
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';
import { jwtVerify } from 'jose';
import { JWT_SECRET } from '@/lib/auth-config';

// Impedir que o Next.js cache esta rota como página estática
export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        // Resolve o caminho do arquivo
        const { path } = await params;
        const relativePath = path.join('/');
        
        // Caminho absoluto no servidor/Docker
        const isDocker = process.platform === 'linux';
        const baseDir = isDocker ? '/app/public/uploads' : join(process.cwd(), 'public', 'uploads');
        const absolutePath = join(baseDir, relativePath);

        // Prevenção básica contra Directory Traversal (segurança)
        const normalizedBase = baseDir.replace(/\\/g, '/').toLowerCase();
        const normalizedAbsolute = absolutePath.replace(/\\/g, '/').toLowerCase();
        if (!normalizedAbsolute.startsWith(normalizedBase)) {
            return new NextResponse('Forbidden', { status: 403 });
        }

        // SEC-32: Documentos CRECI exigem autenticação
        const isDocumentPath = relativePath.startsWith('documents/') || relativePath.startsWith('documents\\');
        if (isDocumentPath) {
            const token = req.cookies.get('token')?.value;
            if (!token) {
                return new NextResponse('Unauthorized', { status: 401 });
            }
            try {
                const secret = new TextEncoder().encode(JWT_SECRET);
                await jwtVerify(token, secret);
            } catch {
                return new NextResponse('Unauthorized', { status: 401 });
            }
        }

        // Lê o arquivo
        const fileBuffer = await fs.readFile(absolutePath);

        // Define o Mime Type com base na extensão
        const ext = relativePath.split('.').pop()?.toLowerCase();
        const mimeTypes: { [key: string]: string } = {
            'webp': 'image/webp',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'jfif': 'image/jpeg'
        };

        const contentType = mimeTypes[ext || ''] || 'application/octet-stream';

        // SEC-35: CORS restritivo para documentos pessoais
        const corsOrigin = isDocumentPath
            ? (process.env.NEXT_PUBLIC_APP_URL || 'https://imoveis.hv5.com.br')
            : '*';
        const cacheControl = isDocumentPath
            ? 'private, no-cache'
            : 'public, max-age=31536000, immutable';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Content-Length': fileBuffer.length.toString(),
                'Cache-Control': cacheControl,
                'Access-Control-Allow-Origin': corsOrigin,
            },
        });
    } catch (error) {
        console.error('[Upload Proxy Error]:', error);
        return new NextResponse('File not found', { status: 404 });
    }
}
