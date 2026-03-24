/**
 * Centralized utility for property title generation.
 * Ensures the prompt is strictly data-driven and consistent between inclusion and editing.
 */

export interface PropertyTitleData {
    type?: string;          // imbtpimovel description
    rooms?: number | string;
    bathrooms?: number | string;
    suites?: number | string;
    parking?: number | string;
    area?: number | string;
    areaTerreno?: number | string;
    areaConstruida?: number | string;
    varandas?: number | string;
    address?: string;
    finalidade?: string;   // imbfinalidade description
    objective?: string;    // imbtpoperacao description (e.g., Venda, Aluguel)
    acceptsPets?: boolean;
    price?: number | string;
}

export function buildPropertyTitlePrompt(data: PropertyTitleData): string {
    const {
        type, rooms, bathrooms, suites, parking, area, 
        areaTerreno, areaConstruida, varandas, acceptsPets, price, objective
    } = data;

    return `
Você é um REDATOR IMOBILIÁRIO SÊNIOR especializado em copywriting persuasivo e mercado premium.
Sua missão: criar UM título de anúncio ALTAMENTE ATRATIVO e IRRESISTÍVEL para captar leads qualificados.

DIRETRIZES DE COPYWRITING:
- USE "POWER WORDS": Oportunidade, Exclusivo, Luxo, Conforto, Moderno, Vista Incrível, Raridade.
- FOCO EM BENEFÍCIOS: Em vez de apenas listar dados, crie uma promessa de valor (ex: "More com sofisticação", "Oportunidade única").
- NÃO INVENTE DADOS TÉCNICOS: Mantenha a precisão de quartos, suítes e área, mas use adjetivos que valorizam esses itens.

DADOS REAIS (REFERÊNCIA OBRIGATÓRIA):
• Tipo: ${type || 'Não informado'}
• Operação: ${objective || 'Não informado'}
• Suítes: ${suites || '0'} | Quartos: ${rooms || '0'}
• Vagas: ${parking || '0'} | Varandas: ${varandas || '0'}
• Área Útil: ${area ? area + ' m²' : (areaConstruida ? areaConstruida + ' m²' : 'Não informada')}
• Diferenciais: ${acceptsPets ? 'Pet Friendly' : ''} | Preço: ${price || 'Sob consulta'}

REGRAS DE OURO:
1. MÁXIMO 70 CARACTERES.
2. TUDO EM MAIÚSCULAS.
3. NUNCA cite bairro, rua, cidade ou localização.
4. Gere APENAS o texto do título, sem aspas ou introduções.
5. Se for um imóvel compacto, foque na praticidade e modernidade. Se for amplo (>150m²), foque em exclusividade e amplitude.
6. Se houver suítes, destaque como um diferencial de privacidade e conforto.

Gere um título poderoso e persuasivo para captar leads:`.trim();
}

export function generatePropertyTitleFallback(data: PropertyTitleData): string {
    const highlights: string[] = [];
    const rooms = Number(data.rooms) || 0;
    const suites = Number(data.suites) || 0;
    const parking = Number(data.parking) || 0;
    const area = data.area || data.areaConstruida;

    if (suites > 0) highlights.push(`${suites} SUÍTE(S)`);
    else if (rooms > 0) highlights.push(`${rooms} QUARTO(S)`);
    
    if (parking > 0) highlights.push(`${parking} VAGA(S)`);
    if (area) highlights.push(`${area}M²`);

    const typeStr = (data.type || 'IMÓVEL').toUpperCase();
    const details = highlights.length > 0 ? `: ${highlights.join(' | ')}` : '';
    const operation = data.objective ? `${data.objective.toUpperCase()}: ` : '';

    return `${operation}${typeStr}${details}`.trim();
}
