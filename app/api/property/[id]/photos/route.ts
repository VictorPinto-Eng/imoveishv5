
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import crypto from 'crypto';
import { JWT_SECRET } from '@/lib/auth-config';

// Helper to check ownership
async function checkOwnership(imovelId: string, userId: number) {
    const res = await query(
        'SELECT id FROM produtos_servicos WHERE id = $1 AND user_id = $2',
        [imovelId, userId]
    );
    return res.rowCount !== null && res.rowCount > 0;
}

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: imovelId } = await props.params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(imovelId, decoded.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const res = await query(
            'SELECT * FROM produtos_servicos_midia WHERE produto_servico_id = $1 ORDER BY ordem_exibicao ASC, id ASC',
            [imovelId]
        );

        console.log(`[API Debug] Fotos encontradas para o imovel ${imovelId}:`, res.rowCount);

        return NextResponse.json({ 
            success: true, 
            photos: res.rows || [],
            debug_count: res.rowCount 
        });
    } catch (error: any) {
        console.error(`[API Error] Erro ao buscar fotos:`, error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: imovelId } = await props.params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(imovelId, decoded.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${crypto.randomUUID()}.${ext}`;
        
        // Garante o caminho absoluto para o Docker (/app/public/uploads/imoveis)
        // Se estivermos em desenvolvimento (Windows), ele usará o caminho relativo padrão
        const isDocker = process.platform === 'linux';
        const baseDir = isDocker ? '/app/public/uploads/imoveis' : join(process.cwd(), 'public', 'uploads', 'imoveis');
        const uploadDir = join(baseDir, imovelId);
        
        try {
            console.log(`Attempting to create directory: ${uploadDir}`);
            await mkdir(uploadDir, { recursive: true });
            
            const filePath = join(uploadDir, filename);
            console.log(`Attempting to write file: ${filePath}`);
            await writeFile(filePath, buffer);
        } catch (fsError: any) {
            console.error('File system error during upload:', fsError);
            return NextResponse.json({ 
                error: `Erro ao salvar arquivo no servidor: ${fsError.message}. Verifique as permissões da pasta public/uploads.`,
                details: fsError.code
            }, { status: 500 });
        }

        const fileUrl = `/uploads/imoveis/${imovelId}/${filename}`;

        // Get next order
        const orderRes = await query(
            'SELECT MAX(ordem_exibicao) as max_ordem FROM produtos_servicos_midia WHERE produto_servico_id = $1',
            [imovelId]
        );
        const nextOrder = ((orderRes.rows[0]?.max_ordem) || 0) + 1;

        // Is it the first?
        const countRes = await query('SELECT count(*) FROM produtos_servicos_midia WHERE produto_servico_id = $1', [imovelId]);
        const isFirst = parseInt(countRes.rows[0]?.count || '0') === 0;

        const insertRes = await query(`
            INSERT INTO produtos_servicos_midia 
            (produto_servico_id, url_referencia, ordem_exibicao, foto_principal)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [imovelId, fileUrl, nextOrder, isFirst]);

        return NextResponse.json({ success: true, photo: insertRes.rows[0] });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: imovelId } = await props.params;
        const token = req.cookies.get('token')?.value;
        const photoId = req.nextUrl.searchParams.get('photoId');

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(imovelId, decoded.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const photoRes = await query(
            'SELECT * FROM produtos_servicos_midia WHERE id = $1 AND produto_servico_id = $2',
            [photoId, imovelId]
        );

        if (!photoRes.rowCount || photoRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const photo = photoRes.rows[0];

        // Delete from FS
        try {
            const filename = photo.url_referencia.split('/').pop();
            const filePath = join(process.cwd(), 'public', 'uploads', 'imoveis', imovelId, filename);
            await unlink(filePath);
        } catch (e) {
            console.error('File delete error:', e);
        }

        // Delete from DB
        await query('DELETE FROM produtos_servicos_midia WHERE id = $1', [photoId]);

        // If it was principal, set another one
        if (photo.foto_principal) {
            const nextOne = await query(
                'SELECT id FROM produtos_servicos_midia WHERE produto_servico_id = $1 ORDER BY ordem_exibicao ASC LIMIT 1',
                [imovelId]
            );
            if (nextOne.rowCount && nextOne.rowCount > 0) {
                await query('UPDATE produtos_servicos_midia SET foto_principal = TRUE WHERE id = $1', [nextOne.rows[0].id]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: imovelId } = await props.params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(imovelId, decoded.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { photoId, setPrincipal, legenda, categoria, privada } = body;

        if (setPrincipal) {
            await query('UPDATE produtos_servicos_midia SET foto_principal = FALSE WHERE produto_servico_id = $1', [imovelId]);
            await query('UPDATE produtos_servicos_midia SET foto_principal = TRUE WHERE id = $1 AND produto_servico_id = $2', [photoId, imovelId]);
        }

        if (legenda !== undefined || categoria !== undefined || privada !== undefined) {
             await query(`
                UPDATE produtos_servicos_midia 
                SET legenda = COALESCE($1, legenda),
                    categoria = COALESCE($2, categoria),
                    privada = COALESCE($3, privada)
                WHERE id = $4 AND produto_servico_id = $5
            `, [legenda, categoria, privada, photoId, imovelId]);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id: imovelId } = await props.params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(imovelId, decoded.id))) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { items } = body;

        if (Array.isArray(items)) {
            for (const item of items) {
                await query('UPDATE produtos_servicos_midia SET ordem_exibicao = $1 WHERE id = $2 AND produto_servico_id = $3', [item.ordem_exibicao, item.id, imovelId]);
            }
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
