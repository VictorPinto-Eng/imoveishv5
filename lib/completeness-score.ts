/**
 * COMP-04: Score de Completude do Anúncio
 * Calcula quão completo está o preenchimento de um imóvel.
 * Retorna score (0-100) + lista de itens pendentes para o proprietário.
 */

export interface CompletenessItem {
  label: string
  points: number
  filled: boolean
  category: 'essential' | 'recommended' | 'optional'
}

export interface CompletenessResult {
  score: number
  maxScore: number
  percentage: number
  items: CompletenessItem[]
  pendingItems: CompletenessItem[]
}

export function calculateCompleteness(imovel: any): CompletenessResult {
  const items: CompletenessItem[] = [
    // Essenciais (50 pts)
    { label: 'Título do anúncio', points: 5, filled: !!imovel.nome, category: 'essential' },
    { label: 'Preço definido', points: 10, filled: (imovel.preco_base || 0) > 0, category: 'essential' },
    { label: 'Tipo de operação', points: 5, filled: !!imovel.imbtpoperacao_id || !!imovel.operacao_nome, category: 'essential' },
    { label: 'Tipo de imóvel', points: 5, filled: !!imovel.imbtpimovel_id || !!imovel.tipo_nome, category: 'essential' },
    { label: 'Pelo menos 1 foto', points: 10, filled: (imovel.imagens_urls?.length || 0) >= 1, category: 'essential' },
    { label: 'Cidade', points: 5, filled: !!imovel.cidade_nome || !!imovel.cidade_id, category: 'essential' },
    { label: 'Bairro', points: 5, filled: !!imovel.bairro_nome || !!imovel.bairro_id, category: 'essential' },
    { label: 'Endereço (logradouro)', points: 5, filled: !!imovel.logradouro, category: 'essential' },

    // Recomendados (35 pts)
    { label: '5 ou mais fotos', points: 8, filled: (imovel.imagens_urls?.length || 0) >= 5, category: 'recommended' },
    { label: 'Descrição detalhada (100+ caracteres)', points: 7, filled: (imovel.descricao?.length || 0) >= 100, category: 'recommended' },
    { label: 'Área útil', points: 5, filled: (Number(imovel.area_util) || 0) > 0, category: 'recommended' },
    { label: 'Dormitórios', points: 3, filled: (Number(imovel.dormitorios) || 0) > 0, category: 'recommended' },
    { label: 'Banheiros', points: 3, filled: (Number(imovel.banheiros) || 0) > 0, category: 'recommended' },
    { label: 'Vagas de garagem', points: 3, filled: (Number(imovel.vagas) || 0) > 0, category: 'recommended' },
    { label: 'CEP', points: 3, filled: !!imovel.cep, category: 'recommended' },
    { label: 'Localização no mapa', points: 3, filled: !!(imovel.latitude && imovel.longitude), category: 'recommended' },

    // Opcionais (15 pts)
    { label: '10 ou mais fotos', points: 5, filled: (imovel.imagens_urls?.length || 0) >= 10, category: 'optional' },
    { label: 'Descrição rica (500+ caracteres)', points: 5, filled: (imovel.descricao?.length || 0) >= 500, category: 'optional' },
    { label: 'Suítes informadas', points: 2, filled: (Number(imovel.suites) || 0) > 0, category: 'optional' },
    { label: 'Área do terreno', points: 3, filled: (Number(imovel.area_terreno) || 0) > 0, category: 'optional' },
  ]

  const maxScore = items.reduce((sum, i) => sum + i.points, 0)
  const score = items.filter(i => i.filled).reduce((sum, i) => sum + i.points, 0)
  const percentage = Math.round((score / maxScore) * 100)
  const pendingItems = items.filter(i => !i.filled)

  return { score, maxScore, percentage, items, pendingItems }
}