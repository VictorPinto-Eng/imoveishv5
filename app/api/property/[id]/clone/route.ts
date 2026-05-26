
import { NextRequest, NextResponse } from 'next/server';
import { JWT_SECRET } from '@/lib/auth-config';
import jwt from 'jsonwebtoken';
import { query } from '@/lib/db';
import { join } from 'path';
import { cp, mkdir } from 'fs/promises';
import { recordAuditLog } from '@/lib/analytics-service';

async function checkOwnership(imovelId: string, userId: number) {
    const res = await query(
        'SELECT id FROM produtos_servicos WHERE id = $1 AND user_id = $2',
        [imovelId, userId]
    );
    return res.rows.length > 0;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: originalId } = await params;
        const token = req.cookies.get('token')?.value;

        if (!token) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        
        if (!(await checkOwnership(originalId, decoded.id))) {
            return NextResponse.json({ error: 'Proibido' }, { status: 403 });
        }

        // 1. Fetch original property
        const propRes = await query('SELECT * FROM produtos_servicos WHERE id = $1', [originalId]);
        const original = propRes.rows[0];

        // 2. Create new property record
        const { id, created_at, updated_at, ...dataToClone } = original;
        
        // Clean up redundant custom_fields before cloning
        if (dataToClone.custom_fields) {
            let cf = typeof dataToClone.custom_fields === 'string' 
                ? JSON.parse(dataToClone.custom_fields) 
                : dataToClone.custom_fields;
            
            const toRemove = [
                'dormitorio', 'suite', 'varanda', 'banheiro', 'vaga',
                'areaservico', 'quartoservico', 'cozinha', 'lavabo', 'sala', 'dimensoes_terreno',
                'area_util', 'area_construida', 'area_terreno',
                'logradouro', 'numero', 'complemento', 'quadra_torre_bloco', 'unidade', 'andar', 'cep',
                'pais_id', 'estado_id', 'cidade_id', 'bairro_id',
                'imbtpoperacao_id', 'imbfinalidade_id', 'imbtpimovel_id', 'statusimovel',
                'status', 'area_total'
            ];
            
            toRemove.forEach(key => delete cf[key]);
            dataToClone.custom_fields = JSON.stringify(cf);
        }

        // Modify title to reflect it's a copy
        dataToClone.nome = `${original.nome} (Cópia)`;
        
        const keys = Object.keys(dataToClone);
        const values = Object.values(dataToClone);
        const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
        const columns = keys.join(', ');

        const insertRes = await query(
            `INSERT INTO produtos_servicos (${columns}) VALUES (${placeholders}) RETURNING id`,
            values
        );
        const newId = insertRes.rows[0].id;

        // Clone accessory table records (public.produto_servicos_loca or public.produto_servicos_venda)
        if (dataToClone.imbtpoperacao_id === 2) {
            const locRes = await query('SELECT * FROM public.produto_servicos_loca WHERE produto_servico_id = $1', [originalId]);
            if (locRes.rows.length > 0) {
                const { id: _, produto_servico_id: __, created_at: ___, updated_at: ____, ...locData } = locRes.rows[0];
                const locKeys = Object.keys(locData);
                const locValues = Object.values(locData);
                const locPlaceholders = locKeys.map((_, i) => `$${i + 2}`).join(', ');
                await query(
                    `INSERT INTO public.produto_servicos_loca (produto_servico_id, ${locKeys.join(', ')}) VALUES ($1, ${locPlaceholders})`,
                    [newId, ...locValues]
                );
            }
        } else if (dataToClone.imbtpoperacao_id === 1) {
            const vendaRes = await query('SELECT * FROM public.produto_servicos_venda WHERE produto_servico_id = $1', [originalId]);
            if (vendaRes.rows.length > 0) {
                const { id: _, produto_servico_id: __, created_at: ___, updated_at: ____, ...vendaData } = vendaRes.rows[0];
                const vendaKeys = Object.keys(vendaData);
                const vendaValues = Object.values(vendaData);
                const vendaPlaceholders = vendaKeys.map((_, i) => `$${i + 2}`).join(', ');
                await query(
                    `INSERT INTO public.produto_servicos_venda (produto_servico_id, ${vendaKeys.join(', ')}) VALUES ($1, ${vendaPlaceholders})`,
                    [newId, ...vendaValues]
                );
            }
        }

        // 3. Clone Media (DB + Files)
        const mediaRes = await query('SELECT * FROM produtos_servicos_midia WHERE produto_servico_id = $1', [originalId]);
        
        if (mediaRes.rows.length > 0) {
            const originalDir = join(process.cwd(), 'public', 'uploads', 'imoveis', originalId.toString());
            const newDir = join(process.cwd(), 'public', 'uploads', 'imoveis', newId.toString());

            // Create new directory
            try {
                await mkdir(newDir, { recursive: true });
                
                for (const media of mediaRes.rows) {
                    const filename = media.url_referencia.split('/').pop();
                    const oldPath = join(originalDir, filename);
                    const newPath = join(newDir, filename);
                    const newUrl = `/uploads/imoveis/${newId}/${filename}`;

                    // Copy file
                    try {
                        await cp(oldPath, newPath);
                    } catch (cpErr) {
                        console.error(`Error copying media file ${oldPath}:`, cpErr);
                    }

                    // Insert DB record
                    await query(
                        `INSERT INTO produtos_servicos_midia 
                        (produto_servico_id, url_referencia, ordem_exibicao, foto_principal, legenda, categoria, privada)
                        VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                        [newId, newUrl, media.ordem_exibicao, media.foto_principal, media.legenda, media.categoria, media.privada]
                    );
                }
            } catch (err) {
                console.error('Error cloning media files:', err);
            }
        }

        // Log the cloning activity
        await recordAuditLog(newId, decoded.id, 'CLONAGEM', {
            originalId: originalId,
            newTitle: dataToClone.nome
        });

        return NextResponse.json({ success: true, newId });

    } catch (error: any) {
        console.error('Clone error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
