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
Você é um redator imobiliário sênior e altamente criativo especializado em anúncios premium e exclusivos.
Sua tarefa é criar UM único título incrível, chamativo e extremamente persuasivo para um imóvel.

Diretrizes importantes:
1. FOCO NA ATRAÇÃO: Crie um gancho irresistível, elegante e moderno. Use adjetivos refinados que gerem desejo e curiosidade.
2. DADOS DO IMÓVEL (Integre-os de forma natural):
   - Tipo de imóvel: ${type || 'Não informado'}
   - Operação: ${objective || 'Não informado'}
   - Suítes/Quartos: ${suites ? `${suites} suíte(s)` : (rooms ? `${rooms} quarto(s)` : '')}
   - Vagas: ${parking ? `${parking} vaga(s)` : ''}
   - Área: ${area ? area + ' m²' : (areaConstruida ? areaConstruida + ' m²' : '')}
   - Preço: ${price || ''}
3. REGRAS OBRIGATÓRIAS:
   - Limite estrito de no máximo 75 caracteres.
   - Escreva TODO o título em letras MAIÚSCULAS.
   - NÃO inclua bairro, rua, cidade ou qualquer localização.
   - Retorne APENAS o título gerado, sem aspas, explicações, numerações ou introduções.

Exemplos de estrutura premium e muito criativa:
- "APARTAMENTO DESIGN: LAZER COMPLETO E VISTA INFINITA COM 3 SUÍTES"
- "CASA DOS SONHOS: ARQUITETURA MODERNA, PISCINA E 4 SUÍTES DE LUXO"
- "COBERTURA EXCLUSIVA: TERRAÇO PRIVATIVO E MÁXIMO CONFORTO COM 320M²"
- "CASA CONCEITO: INTEGRAÇÃO PERFEITA, ÁREA GOURMET E 3 VAGAS"
- "TERRENO PRIVILEGIADO: OPORTUNIDADE ÚNICA PARA CONSTRUÇÃO DE LUXO"

Gere o título mais atraente, sofisticado e criativo possível:`.trim();
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
