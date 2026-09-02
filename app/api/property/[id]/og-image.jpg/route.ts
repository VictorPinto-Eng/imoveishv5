import { NextRequest, NextResponse } from 'next/server';
import { getImovelById } from '@/lib/imoveis';
import { join } from 'path';
import { stat } from 'fs/promises';

export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const imovel = await getImovelById(id);

    if (!imovel) {
      return new NextResponse('Imóvel não encontrado', { status: 404 });
    }

    // Tenta encontrar o cover_og.jpg pré-gerado
    const isDocker = process.platform === 'linux';
    const baseDir = isDocker ? '/app/public/uploads/imoveis' : join(process.cwd(), 'public', 'uploads', 'imoveis');
    const coverPath = join(baseDir, id, 'cover_og.jpg');

    try {
        await stat(coverPath);
        // Se existir, serve o cover_og.jpg
        const baseUrl = 'https://imoveis.hv5.com.br';
        const coverUrl = `${baseUrl}/uploads/imoveis/${id}/cover_og.jpg`;
        return NextResponse.redirect(coverUrl, {
            status: 302,
            headers: {
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
                'Content-Type': 'image/jpeg'
            }
        });
    } catch (e) {
        // Fallback: serve a primeira imagem original
        const imagePath = imovel.foto_capa || imovel.imagens_urls?.[0];
        if (!imagePath) {
            return new NextResponse('Imagem não encontrada', { status: 404 });
        }
        const baseUrl = 'https://imoveis.hv5.com.br';
        const fullImageUrl = imagePath.startsWith('http')
            ? imagePath
            : `${baseUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
        return NextResponse.redirect(fullImageUrl, {
            status: 302,
            headers: {
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
                'Content-Type': 'image/jpeg'
            }
        });
    }
  } catch (error) {
    console.error('Error in og-image.jpg route:', error);
    return new NextResponse('Erro ao carregar imagem', { status: 500 });
  }
}
