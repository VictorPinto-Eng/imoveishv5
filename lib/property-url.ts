import { slugify } from './slugify'

interface PropertyForUrl {
  id: string | number
  tipo_nome?: string
  operacao_nome?: string
  cidade_nome?: string
  bairro_nome?: string
}

/**
 * Constrói URL SEO-friendly para um imóvel.
 * Pattern: /imovel/{tipo}/{operacao}/{cidade}/{bairro}/{id}
 */
export function buildPropertyUrl(imovel: PropertyForUrl): string {
  const tipo = slugify(imovel.tipo_nome || '') || 'imovel'
  const operacao = slugify(imovel.operacao_nome || '') || 'venda'
  const cidade = slugify(imovel.cidade_nome || '') || 'cidade'
  const bairro = slugify(imovel.bairro_nome || '') || 'bairro'

  return `/imovel/${tipo}/${operacao}/${cidade}/${bairro}/${imovel.id}`
}