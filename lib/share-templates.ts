/**
 * Utility for generating professional real estate sharing messages.
 * Optimized for WhatsApp with bold text, emojis, and clear call-to-actions.
 */

export interface ShareData {
    id: number | string;
    title: string;
    type?: string;
    operation?: string;
    price?: number | string;
    area?: number | string;
    rooms?: number | string;
    suites?: number | string;
    parking?: number | string;
    bairro?: string;
    cidade?: string;
}

export function generateWhatsAppShareMessage(data: ShareData): string {
    const {
        id, title, type, operation, price, area, rooms, suites, parking, bairro, cidade
    } = data;

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/imovel/${id}?utm_source=whatsapp&utm_medium=share_card`;

    // Improved number formatting with fallback
    const formatCurrency = (val: any) => {
        const num = typeof val === 'string' ? parseFloat(val) : val;
        if (typeof num !== 'number' || isNaN(num)) return val || 'Sob consulta';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
    };

    const formattedPrice = formatCurrency(price);
    
    const numArea = typeof area === 'string' ? parseFloat(area) : area;
    const formattedArea = (typeof numArea === 'number' && !isNaN(numArea))
        ? (numArea % 1 === 0 ? numArea.toString() : numArea.toFixed(2))
        : area;

    const location = [bairro, cidade].filter(Boolean).join(', ');

    // Clean title: prioritize Type and Operation info
    let displayTitle = title;
    if (type && operation) {
        displayTitle = `${operation} - ${type}`;
    } else if (title && title.includes(':')) {
        const parts = title.split(':');
        if (parts.length >= 2) {
            displayTitle = `${parts[parts.length - 2].trim()} - ${parts[parts.length - 1].trim()}`;
        } else {
            displayTitle = parts[parts.length - 1].trim();
        }
    }

    // Build the message with high-compatibility symbols and clear structure
    const lines = [
        `*${displayTitle.toUpperCase()}*`,
        location ? `_${location}_` : '',
        '',
        `*PREÇO: ${formattedPrice}*`,
        '',
        '--- DETALHES DO IMÓVEL ---',
        '',
        formattedArea && formattedArea !== '0' ? `> *Área:* ${formattedArea}m²` : '',
        rooms ? `> *Quartos:* ${rooms}` : '',
        suites ? `> *Suítes:* ${suites}` : '',
        parking ? `> *Vagas:* ${parking}` : '',
        '',
        '-------------------------',
        '',
        'Confira fotos e todos os detalhes aqui:',
        `${shareUrl}`
    ];

    return lines.filter(line => line !== null && line !== undefined).join('\n').trim();
}
