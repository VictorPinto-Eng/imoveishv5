import Jimp from 'jimp';

/**
 * Processa uma imagem original e gera uma versão otimizada de 1200x630 (16:9)
 * com crop centralizado (estilo cover) para uso como OpenGraph cover.
 */
export async function generateOgCover(inputBuffer: Buffer, outputPath: string): Promise<boolean> {
    try {
        const image = await Jimp.read(inputBuffer);

        const targetWidth = 1200;
        const targetHeight = 630;
        const targetAspect = targetWidth / targetHeight; // ~1.9048

        const origWidth = image.getWidth();
        const origHeight = image.getHeight();
        const origAspect = origWidth / origHeight;

        let cropWidth = origWidth;
        let cropHeight = origHeight;
        let cropX = 0;
        let cropY = 0;

        if (origAspect > targetAspect) {
            // Imagem mais larga que o alvo (cortar laterais)
            cropWidth = Math.round(origHeight * targetAspect);
            cropHeight = origHeight;
            cropX = Math.round((origWidth - cropWidth) / 2);
            cropY = 0;
        } else {
            // Imagem mais alta que o alvo (cortar topo/fundo)
            cropWidth = origWidth;
            cropHeight = Math.round(origWidth / targetAspect);
            cropX = 0;
            cropY = Math.round((origHeight - cropHeight) / 2);
        }

        image.crop(cropX, cropY, cropWidth, cropHeight);
        image.resize(targetWidth, targetHeight);
        image.quality(85);

        await image.writeAsync(outputPath);
        return true;
    } catch (error) {
        console.error('[Image Optimizer] Erro ao gerar OG cover:', error);
        return false;
    }
}
