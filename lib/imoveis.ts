import { query } from './db'
import { sanitizeLocationName } from './sanitize-location'

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
  status_imovel_nome?: string
  imoveis_detalhes?: ImovelDetalhes | null
  imbtpoperacao_id?: number
  operacao_nome?: string
  pub_site?: boolean
  pub_price?: boolean
  latitude?: number | null
  longitude?: number | null
  plus_code?: string
  created_at?: string | Date
  pending_questions?: number | string
  uf_nome?: string
  cidade_nome?: string
  bairro_nome?: string
  cidade?: string
  bairro?: string
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
    is_venda: item.is_venda ?? (item.operacao_nome ? item.operacao_nome.toUpperCase().includes('VENDA') : true),
    is_locacao: item.is_locacao ?? (item.operacao_nome ? (item.operacao_nome.toUpperCase().includes('LOCAÇÃO') || item.operacao_nome.toUpperCase().includes('ALUGUEL')) : false),
    tipo_imovel_nome: item.tipo_nome || item.tipo_imovel_nome || custom_fields.tipo_imovel || 'Imóvel',
    tipo_nome: item.tipo_nome,
    pub_site: item.pub_site === true || item.pub_site === 'true',
    pub_price: item.pub_price === true || item.pub_price === 'true',
    latitude: (() => {
      const lat = item.latitude ?? custom_fields.latitude;
      const parsed = parseFloat(lat);
      return !isNaN(parsed) ? parsed : null;
    })(),
    longitude: (() => {
      const lng = item.longitude ?? custom_fields.longitude;
      const parsed = parseFloat(lng);
      return !isNaN(parsed) ? parsed : null;
    })(),
    plus_code: item.plus_code || custom_fields.plus_code,
    uf_nome: item.uf_nome || custom_fields.uf || custom_fields.estado || '',
    cidade_nome: item.cidade_nome || custom_fields.cidade || '',
    bairro_nome: item.bairro_nome || custom_fields.bairro || ''
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
    TP.descricao as tipo_nome,
    ST.nome as status_imovel_nome,
    CID.descricao as cidade_nome,
    BAI.descricao as bairro_nome,
    EST.sigla as uf_nome
  FROM produtos_servicos I
  LEFT JOIN imbtpoperacao OP ON I.imbtpoperacao_id = OP.id
  LEFT JOIN imbtpimovel TP ON I.imbtpimovel_id = TP.id
  LEFT JOIN statimovel ST ON I.statusimovel = ST.id
  LEFT JOIN apocidade CID ON I.cidade_id = CID.id
  LEFT JOIN apobairro BAI ON I.bairro_id = BAI.id
  LEFT JOIN apoestado EST ON I.estado_id = EST.id
`

export async function getFeaturedImoveis(limit = 6, excludeId?: string) {
  try {
    const params: any[] = [limit]
    let whereClause = `WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true AND I.pub_site = true`
    
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

// Imóveis cadastrados nos últimos 30 dias
export async function getRecentImoveis(limit = 6) {
  try {
    const res = await query(`
      ${BASE_SELECT}
      WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true AND I.pub_site = true
        AND I.created_at >= NOW() - INTERVAL '30 days'
      ORDER BY I.created_at DESC
      LIMIT $1
    `, [limit])
    return parseImoveis(res.rows || [])
  } catch (error) {
    console.error('Error fetching recent imoveis:', error)
    return []
  }
}

// Imóveis com preço atualizado recentemente (excluindo recém-criados)
export async function getPriceUpdatedImoveis(limit = 6) {
  try {
    const res = await query(`
      ${BASE_SELECT}
      WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true AND I.pub_site = true
        AND I.updated_at IS NOT NULL
        AND I.updated_at > I.created_at + INTERVAL '1 hour'
        AND I.updated_at >= NOW() - INTERVAL '60 days'
      ORDER BY I.updated_at DESC
      LIMIT $1
    `, [limit])
    return parseImoveis(res.rows || [])
  } catch (error) {
    console.error('Error fetching price-updated imoveis:', error)
    return []
  }
}

export async function getImoveis(filters: ImovelFilters = {}) {
  try {
    let sql = `
      SELECT 
        I.*, 
        ARRAY(SELECT url_referencia FROM produtos_servicos_midia WHERE produto_servico_id = I.id ORDER BY ordem_exibicao ASC, id ASC) as all_photos,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        ST.nome as status_imovel_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome
      FROM produtos_servicos I
      LEFT JOIN public.imbtpoperacao OP ON I.imbtpoperacao_id = OP.id
      LEFT JOIN public.imbtpimovel TP ON I.imbtpimovel_id = TP.id
      LEFT JOIN public.statimovel ST ON I.statusimovel = ST.id
      JOIN public.apocidade CID ON I.cidade_id = CID.id
      JOIN public.apobairro BAI ON I.bairro_id = BAI.id
      LEFT JOIN public.apoestado EST ON I.estado_id = EST.id
      WHERE I.ativo = true AND I.pub_site = true
    `
    const params: any[] = []

    if (filters.cidade) {
      params.push(`%${filters.cidade}%`)
      sql += ` AND CID.descricao ILIKE $${params.length}`
    }

    if (filters.bairro) {
      params.push(`%${filters.bairro}%`)
      sql += ` AND BAI.descricao ILIKE $${params.length}`
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
    // Specific status filter only if explicitly requested and not 'ativo'
    if (filters.status && filters.status !== 'ativo') {
      params.push(filters.status)
      sql += ` AND I.status ILIKE $${params.length}`
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
    const filtered = parsed.filter((imovel) => {
      // Robust city check
      if (filters.cidade) {
        const cityFromCustom = imovel.custom_fields?.cidade ? sanitizeLocationName(imovel.custom_fields.cidade) : '';
        const cityFromName = imovel.cidade_nome ? sanitizeLocationName(imovel.cidade_nome) : '';
        const cityFromField = imovel.cidade ? sanitizeLocationName(imovel.cidade as string) : '';
        
        const searchCity = filters.cidade.toUpperCase().trim();
        
        if (!cityFromCustom.includes(searchCity) && 
            !cityFromName.includes(searchCity) && 
            !cityFromField.includes(searchCity)) {
          return false;
        }
      }

      // Robust neighborhood check
      if (filters.bairro) {
        const neighborhoodFromCustom = imovel.custom_fields?.bairro ? sanitizeLocationName(imovel.custom_fields.bairro) : '';
        const neighborhoodFromName = imovel.bairro_nome ? sanitizeLocationName(imovel.bairro_nome) : '';
        const neighborhoodFromField = imovel.bairro ? sanitizeLocationName(imovel.bairro as string) : '';
        
        const searchNeighborhood = filters.bairro.toUpperCase().trim();
        
        if (!neighborhoodFromCustom.includes(searchNeighborhood) && 
            !neighborhoodFromName.includes(searchNeighborhood) && 
            !neighborhoodFromField.includes(searchNeighborhood)) {
          return false;
        }
      }

      return true;
    });

    return {
      imoveis: filtered,
      debug: {
        sql,
        params,
        filters,
        rowCount: res.rowCount,
        parsedCount: parsed.length,
        filteredCount: filtered.length
      }
    };
  } catch (error) {
    console.error('Error fetching imoveis:', error);
    return { imoveis: [], error, debug: { filters } };
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
