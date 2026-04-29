
import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import { join } from 'path';

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
        if (!absolutePath.startsWith(baseDir)) {
            return new NextResponse('Forbidden', { status: 403 });
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

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('[Upload Proxy Error]:', error);
        return new NextResponse('File not found', { status: 404 });
    }
}
