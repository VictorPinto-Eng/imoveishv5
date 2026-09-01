import { NextRequest, NextResponse } from 'next/server';
import { getImovelById } from '@/lib/imoveis';
import { promises as fs } from 'fs';
import { join } from 'path';
import sharp from 'sharp';

// Cache por 1 dia (3600 segundos)
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

    // 1. Pega a foto principal
    const imagePath = imovel.foto_capa || imovel.imagens_urls?.[0];
    if (!imagePath) {
      return new NextResponse('Imagem não encontrada', { status: 404 });
    }

    // 2. Verifica se é URL externa ou local
    if (imagePath.startsWith('http')) {
      // Para URLs externas, redireciona para a imagem original
      return NextResponse.redirect(imagePath);
    }

    // 3. Caminho absoluto da imagem no servidor
    const isDocker = process.platform === 'linux';
    const baseDir = isDocker ? '/app/public/uploads' : join(process.cwd(), 'public', 'uploads');
    const absolutePath = join(baseDir, imagePath.replace(/^\//, ''));

    // 4. Processa a imagem com sharp
    const imageBuffer = await fs.readFile(absolutePath);
    const processedImage = await sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // 5. Retorna a imagem processada
    return new NextResponse(new Uint8Array(processedImage), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Content-Length': processedImage.length.toString(),
        'Cache-Control': 'public, max-age=86400'
      }
    });
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new NextResponse('Erro ao gerar imagem', { status: 500 });
  }
}
