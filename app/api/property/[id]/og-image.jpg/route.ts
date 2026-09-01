import { NextRequest, NextResponse } from 'next/server';
import { getImovelById } from '@/lib/imoveis';

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
  } catch (error) {
    console.error('Error in og-image.jpg route:', error);
    return new NextResponse('Erro ao carregar imagem', { status: 500 });
  }
}
