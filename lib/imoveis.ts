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
  condominio_incluso?: boolean
  iptu_incluso?: boolean
  seguro_incendio_incluso?: boolean
  seguro_incendio?: number
  vrtotal?: number
  periodo_loca_id?: number
  imbtipoanuncio_id?: number
  imbtpimovel_id?: number
  imbfinalidade_id?: number
  owner_phone?: string
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
  if (!custom_fields) {
    custom_fields = {}
  }

  // Mapear campos de locação ou venda se existirem das tabelas acessórias
  const hasLocacao = item.loc_preco_base !== null && item.loc_preco_base !== undefined;
  const hasVenda = item.venda_preco_base !== null && item.venda_preco_base !== undefined;
  
  if (hasLocacao) {
    if (item.loc_preco_base !== null && item.loc_preco_base !== undefined) {
      item.preco_base = Number(item.loc_preco_base);
    }
    if (item.loc_imbfinalidade_id !== null && item.loc_imbfinalidade_id !== undefined) {
      item.imbfinalidade_id = Number(item.loc_imbfinalidade_id);
    }
    if (item.loc_imbtpimovel_id !== null && item.loc_imbtpimovel_id !== undefined) {
      item.imbtpimovel_id = Number(item.loc_imbtpimovel_id);
    }
    if (item.pr_condominio !== null && item.pr_condominio !== undefined) {
      custom_fields.condominio = Number(item.pr_condominio);
      custom_fields.valor_condominio = Number(item.pr_condominio);
    }
    if (item.pr_iptuanual !== null && item.pr_iptuanual !== undefined) {
      custom_fields.iptu = Number(item.pr_iptuanual);
      custom_fields.valor_iptu = Number(item.pr_iptuanual);
    }
    if (item.inclusocond !== null && item.inclusocond !== undefined) {
      item.condominio_incluso = item.inclusocond === '0' || item.inclusocond === 0 || item.inclusocond.toString() === '0';
    }
    if (item.inclusoiptu !== null && item.inclusoiptu !== undefined) {
      item.iptu_incluso = item.inclusoiptu === '0' || item.inclusoiptu === 0 || item.inclusoiptu.toString() === '0';
    }
    if (item.inclusoincendio !== null && item.inclusoincendio !== undefined) {
      item.seguro_incendio_incluso = item.inclusoincendio === '0' || item.inclusoincendio === 0 || item.inclusoincendio.toString() === '0';
    }
    if (item.pr_segincendio !== null && item.pr_segincendio !== undefined) {
      item.seguro_incendio = Number(item.pr_segincendio);
    }
    if (item.vrtotal !== null && item.vrtotal !== undefined) {
      item.vrtotal = Number(item.vrtotal);
    }
  } else if (hasVenda) {
    if (item.venda_preco_base !== null && item.venda_preco_base !== undefined) {
      item.preco_base = Number(item.venda_preco_base);
    }
    if (item.venda_imbfinalidade_id !== null && item.venda_imbfinalidade_id !== undefined) {
      item.imbfinalidade_id = Number(item.venda_imbfinalidade_id);
    }
    if (item.venda_imbtpimovel_id !== null && item.venda_imbtpimovel_id !== undefined) {
      item.imbtpimovel_id = Number(item.venda_imbtpimovel_id);
    }
    if (item.venda_pr_condominio !== null && item.venda_pr_condominio !== undefined) {
      custom_fields.condominio = Number(item.venda_pr_condominio);
      custom_fields.valor_condominio = Number(item.venda_pr_condominio);
    }
    if (item.venda_pr_iptuanual !== null && item.venda_pr_iptuanual !== undefined) {
      custom_fields.iptu = Number(item.venda_pr_iptuanual);
      custom_fields.valor_iptu = Number(item.venda_pr_iptuanual);
    }
    if (item.venda_pr_segincendio !== null && item.venda_pr_segincendio !== undefined) {
      item.seguro_incendio = Number(item.venda_pr_segincendio);
    }
    if (item.venda_vrtotal !== null && item.venda_vrtotal !== undefined) {
      item.vrtotal = Number(item.venda_vrtotal);
    }
  } else if (item.imbtpoperacao_id === 2) {
    // Para imóveis de locação que não possuem registro na tabela acessória, os valores adicionais iniciam zerados
    item.condominio_incluso = false;
    item.iptu_incluso = false;
    item.seguro_incendio_incluso = false;
    item.seguro_incendio = 0;
    custom_fields.condominio = 0;
    custom_fields.valor_condominio = 0;
    custom_fields.iptu = 0;
    custom_fields.valor_iptu = 0;
    item.vrtotal = Number(item.preco_base || 0);
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
    lavabo: item.lavabo || custom_fields.lavabo,
    dimensoes_terreno: item.dimensoes_terreno || custom_fields.dimensoes_terreno,
    cidade: custom_fields.cidade,
    bairro: custom_fields.bairro,
    is_venda: item.is_venda ?? (item.operacao_nome ? item.operacao_nome.toUpperCase().includes('VENDA') : true),
    is_locacao: item.imbtpoperacao_id === 2 || (item.is_locacao ?? (item.operacao_nome ? (item.operacao_nome.toUpperCase().includes('LOCAÇÃO') || item.operacao_nome.toUpperCase().includes('ALUGUEL')) : false)),
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
    COALESCE(
      NULLIF(ARRAY(SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = I.id ORDER BY ordem_exibicao ASC, id ASC), '{}'),
      ARRAY(SELECT url_referencia FROM public.imbempreendimento_midia WHERE imbempreendimento_id = I.imbempreendimento_id ORDER BY ordem_exibicao ASC, id ASC)
    ) as all_photos,
    OP.descricao as operacao_nome,
    TP.descricao as tipo_nome,
    ST.nome as status_imovel_nome,
    CID.descricao as cidade_nome,
    BAI.descricao as bairro_nome,
    EST.sigla as uf_nome,
    PL.periodo_loca_id,
    PL.imbfinalidade_id as loc_imbfinalidade_id,
    PL.imbtpimovel_id as loc_imbtpimovel_id,
    PL.inclusocond,
    PL.pr_condominio,
    PL.inclusoiptu,
    PL.pr_iptuanual,
    PL.inclusoincendio,
    PL.pr_segincendio,
    PL.vrtotal,
    PL.preco_base as loc_preco_base,
    PV.imbfinalidade_id as venda_imbfinalidade_id,
    PV.imbtpimovel_id as venda_imbtpimovel_id,
    PV.pr_condominio as venda_pr_condominio,
    PV.pr_iptuanual as venda_pr_iptuanual,
    PV.pr_segincendio as venda_pr_segincendio,
    PV.vrtotal as venda_vrtotal,
    COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
    COALESCE(PL.imbfinalidade_id, PV.imbfinalidade_id) as imbfinalidade_id,
    COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) as imbtpimovel_id,
    U.phone as owner_phone
  FROM produtos_servicos I
  LEFT JOIN public.users U ON I.user_id = U.id
  LEFT JOIN imbtpoperacao OP ON I.imbtpoperacao_id = OP.id
  LEFT JOIN public.produto_servicos_loca PL ON I.id = PL.produto_servico_id
  LEFT JOIN public.produto_servicos_venda PV ON I.id = PV.produto_servico_id
  LEFT JOIN imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
  LEFT JOIN statimovel ST ON I.statusimovel = ST.id
  LEFT JOIN apocidade CID ON I.cidade_id = CID.id
  LEFT JOIN apobairro BAI ON I.bairro_id = BAI.id
  LEFT JOIN apoestado EST ON I.estado_id = EST.id
`

export async function getFeaturedImoveis(
  limit = 6, 
  excludeId?: string, 
  imbtpimovelId?: number,
  imbtpoperacaoId?: number,
  imbfinalidadeId?: number
) {
  try {
    const params: any[] = [limit]
    let whereClause = `WHERE I.tipo = 'produto' AND I.categoria = 'Imovel' AND I.ativo = true AND I.pub_site = true`
    
    if (excludeId) {
      params.push(excludeId)
      whereClause += ` AND I.id != $${params.length}`
    }

    if (imbtpimovelId) {
      params.push(imbtpimovelId)
      whereClause += ` AND COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = $${params.length}`
    }

    if (imbtpoperacaoId) {
      params.push(imbtpoperacaoId)
      whereClause += ` AND I.imbtpoperacao_id = $${params.length}`
    }

    if (imbfinalidadeId) {
      params.push(imbfinalidadeId)
      whereClause += ` AND COALESCE(PL.imbfinalidade_id, PV.imbfinalidade_id) = $${params.length}`
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
        COALESCE(
          NULLIF(ARRAY(SELECT url_referencia FROM public.produtos_servicos_midia WHERE produto_servico_id = I.id ORDER BY ordem_exibicao ASC, id ASC), '{}'),
          ARRAY(SELECT url_referencia FROM public.imbempreendimento_midia WHERE imbempreendimento_id = I.imbempreendimento_id ORDER BY ordem_exibicao ASC, id ASC)
        ) as all_photos,
        OP.descricao as operacao_nome,
        TP.descricao as tipo_nome,
        ST.nome as status_imovel_nome,
        CID.descricao as cidade_nome,
        BAI.descricao as bairro_nome,
        EST.sigla as uf_nome,
        PL.periodo_loca_id,
        PL.imbfinalidade_id as loc_imbfinalidade_id,
        PL.imbtpimovel_id as loc_imbtpimovel_id,
        PL.inclusocond,
        PL.pr_condominio,
        PL.inclusoiptu,
        PL.pr_iptuanual,
        PL.inclusoincendio,
        PL.pr_segincendio,
        PL.vrtotal,
        PL.preco_base as loc_preco_base,
        PV.imbfinalidade_id as venda_imbfinalidade_id,
        PV.imbtpimovel_id as venda_imbtpimovel_id,
        PV.pr_condominio as venda_pr_condominio,
        PV.pr_iptuanual as venda_pr_iptuanual,
        PV.pr_segincendio as venda_pr_segincendio,
        PV.vrtotal as venda_vrtotal,
        PV.preco_base as venda_preco_base,
        COALESCE(PL.preco_base, PV.preco_base, 0) as preco_base,
        COALESCE(PL.imbfinalidade_id, PV.imbfinalidade_id) as imbfinalidade_id,
        COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) as imbtpimovel_id
      FROM produtos_servicos I
      LEFT JOIN public.imbtpoperacao OP ON I.imbtpoperacao_id = OP.id
      LEFT JOIN public.produto_servicos_loca PL ON I.id = PL.produto_servico_id
      LEFT JOIN public.produto_servicos_venda PV ON I.id = PV.produto_servico_id
      LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
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
      sql += ` AND COALESCE(PL.preco_base, PV.preco_base, 0) >= $${params.length}`
    }
    if (filters.maxPrice) {
      params.push(filters.maxPrice)
      sql += ` AND COALESCE(PL.preco_base, PV.preco_base, 0) <= $${params.length}`
    }
    if (filters.finalidade) {
      params.push(filters.finalidade)
      sql += ` AND COALESCE(PL.imbfinalidade_id, PV.imbfinalidade_id) = $${params.length}`
    }
    if (filters.tipo) {
      params.push(filters.tipo)
      sql += ` AND COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = $${params.length}`
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
    // Custom fields filters (alto_padrao/exclusividade) are disabled since custom_fields was dropped from database
    if (filters.alto_padrao === 'true') {
      // noop
    }
    if (filters.exclusividade === 'true') {
      // noop
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
