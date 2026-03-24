import { query } from './db'

// Types
export interface ImovelCustomFields {
  dormitorios?: number
  banheiros?: number
  vagas?: number
  area_total?: number
  cidade?: string
  estado?: string
  bairro?: string
  [key: string]: any
}

export interface TipoImovelRef {
  nome: string
}

export interface ImovelDetalhes {
  is_venda: boolean
  is_locacao: boolean
  tipo_imovel_id: number | null
  tipos_imovel?: TipoImovelRef | null
}

export interface Imovel {
  id: string
  organization_id: string
  nome: string
  tipo: string
  categoria: string
  preco_base: number
  descricao: string
  ativo: boolean
  status: string
  tags: string // JSON string array
  custom_fields: ImovelCustomFields // JSON string or object
  imagens_urls: string[]
  logradouro?: string
  numero?: string
  complemento?: string
  cep?: string
  area_util?: number
  area_construida?: number
  area_terreno?: number
  dormitorios?: number
  suites?: number
  banheiros?: number
  vagas?: number
  varandas?: number
  areaservico?: number
  quartoservico?: number
  cozinha?: number
  lavabo?: number
  sala?: number
  dimensoes_terreno?: string
  thumbnail_url?: string
  is_venda?: boolean
  is_locacao?: boolean
  tipo_imovel_nome?: string
  tipo_nome?: string
  foto_capa?: string
  imoveis_detalhes?: ImovelDetalhes | null
  imbtpoperacao_id?: number
  operacao_nome?: string
  created_at?: string | Date
}

export interface ImovelFilters {
  cidade?: string
  bairro?: string
  tipo?: string | number // imbtpimovel_id
  finalidade?: string | number // imbfinalidade_id
  operacao?: string | number // imbtpoperacao_id
  minPrice?: number
  maxPrice?: number
  dormitorios?: number
  suites?: number
  banheiros?: number
  vagas?: number
  minArea?: number
  maxArea?: number
  status?: string
  alto_padrao?: string
  exclusividade?: string
}

// Helpers
function parseImovel(item: any): Imovel {
  let custom_fields = item.custom_fields
  if (typeof custom_fields === 'string') {
    try {
      custom_fields = JSON.parse(custom_fields)
    } catch {
      custom_fields = {}
    }
  }

  let imagens_urls: string[] = []
  if (Array.isArray(item.all_photos) && item.all_photos.length > 0) {
    imagens_urls = item.all_photos
  } else if (item.thumbnail_url) {
    imagens_urls = [item.thumbnail_url]
  } else if (Array.isArray(item.imagens_urls)) {
    imagens_urls = item.imagens_urls
  }

  return {
    ...item,
    imagens_urls,
    custom_fields: custom_fields || {},
    // Flattened fields for easy access, prioritizing top-level columns
    dormitorios: item.dormitorios || item.dormitorio || custom_fields.dormitorios,
    suites: item.suites || item.suite || custom_fields.suites,
    banheiros: item.banheiros || item.banheiro || custom_fields.banheiros,
    vagas: item.vagas || item.vaga || custom_fields.vagas,
    varandas: item.varandas || item.varanda || custom_fields.varandas,
    area_util: item.area_util ?? custom_fields.area_util ?? custom_fields.area_total,
    area_total: item.area_terreno ?? custom_fields.area_total ?? item.area_total,
    sala: item.sala || custom_fields.sala,
    dimensoes_terreno: item.dimensoes_terreno || custom_fields.dimensoes_terreno,
    cidade: custom_fields.cidade,
    bairro: custom_fields.bairro,
    is_venda: item.is_venda || true,
    is_locacao: item.is_locacao || false,
    tipo_imovel_nome: item.tipo_nome || item.tipo_imovel_nome || custom_fields.tipo_imovel || 'Imóvel',
    tipo_nome: item.tipo_nome
  }
}

function parseImoveis(data: any[]): Imovel[] {
  return data.map(parseImovel)
}

// Data Fetching
const BASE_SELECT = `
  SELECT 
    I.*, 
    ARRAY(SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = I.id ORDER BY ordem_exibicao ASC, id ASC) as all_photos,
    OP.descricao as operacao_nome,
    TP.descricao as tipo_nome
  FROM produtos_servicos I
  LEFT JOIN imbtpoperacao OP ON I.imbtpoperacao_id = OP.id
  LEFT JOIN imbtpimovel TP ON I.imbtpimovel_id = TP.id
`

export async function getFeaturedImoveis(limit = 6, excludeId?: string) {
  try {
    const params: any[] = [limit]
    let whereClause = `WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.status = 'ativo' AND I.ativo = true`
    
    if (excludeId) {
      params.push(excludeId)
      whereClause += ` AND I.id != $${params.length}`
    }

    const res = await query(`
      ${BASE_SELECT}
      ${whereClause}
      ORDER BY I.created_at DESC
      LIMIT $1
    `, params)

    return parseImoveis(res.rows || [])
  } catch (error) {
    console.error('Error fetching featured imoveis:', error)
    return []
  }
}

export async function getImoveis(filters: ImovelFilters = {}) {
  try {
    let sql = `${BASE_SELECT} WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true`
    const params: any[] = []

    if (!filters.status) {
      sql += ` AND I.status = 'ativo'`
    }

    if (filters.minPrice) {
      params.push(filters.minPrice)
      sql += ` AND I.preco_base >= $${params.length}`
    }
    if (filters.maxPrice) {
      params.push(filters.maxPrice)
      sql += ` AND I.preco_base <= $${params.length}`
    }
    if (filters.finalidade) {
      params.push(filters.finalidade)
      sql += ` AND I.imbfinalidade_id = $${params.length}`
    }
    if (filters.tipo) {
      params.push(filters.tipo)
      sql += ` AND I.imbtpimovel_id = $${params.length}`
    }
    if (filters.operacao) {
      params.push(filters.operacao)
      sql += ` AND I.imbtpoperacao_id = $${params.length}`
    }
    if (filters.dormitorios) {
      params.push(filters.dormitorios)
      sql += ` AND I.dormitorio >= $${params.length}`
    }
    if (filters.suites) {
      params.push(filters.suites)
      sql += ` AND I.suite >= $${params.length}`
    }
    if (filters.banheiros) {
      params.push(filters.banheiros)
      sql += ` AND I.banheiro >= $${params.length}`
    }
    if (filters.vagas) {
      params.push(filters.vagas)
      sql += ` AND I.vaga >= $${params.length}`
    }
    if (filters.minArea) {
      params.push(filters.minArea)
      sql += ` AND I.area_util >= $${params.length}`
    }
    if (filters.maxArea) {
      params.push(filters.maxArea)
      sql += ` AND I.area_util <= $${params.length}`
    }
    if (filters.status) {
      params.push(filters.status)
      sql += ` AND I.status = $${params.length}`
    }
    if (filters.alto_padrao === 'true') {
      sql += ` AND (I.custom_fields::jsonb->>'alto_padrao')::boolean = true`
    }
    if (filters.exclusividade === 'true') {
      sql += ` AND (I.custom_fields::jsonb->>'exclusividade')::boolean = true`
    }

    const res = await query(sql, params)
    const parsed = parseImoveis(res.rows || [])

    // Memory filter for city and neighborhood
    return parsed.filter((imovel) => {
      const fields = imovel.custom_fields
      if (filters.cidade && fields.cidade !== filters.cidade) return false
      if (filters.bairro && fields.bairro !== filters.bairro) return false
      return true
    })
  } catch (error) {
    console.error('Error fetching imoveis:', error)
    return []
  }
}

export async function getImovelById(id: string) {
  try {
    const res = await query(`${BASE_SELECT} WHERE I.id = $1`, [id])
    if (res.rowCount === 0) return null
    return parseImovel(res.rows[0])
  } catch (error) {
    console.error('Error fetching imovel by id:', error)
    return null
  }
}
