import { MetadataRoute } from 'next'
import { query } from '@/lib/db'
import { buildPropertyUrl } from '@/lib/property-url'

export const dynamic = 'force-dynamic'


async function getAllImoveis(): Promise<{ id: string; updated_at?: string; operacao_nome?: string; tipo_nome?: string; cidade_nome?: string; bairro_nome?: string }[]> {
  try {
    const res = await query(
      `SELECT I.id, I.updated_at,
         OP.descricao as operacao_nome,
         TP.descricao as tipo_nome,
         CID.descricao as cidade_nome,
         BAI.descricao as bairro_nome
       FROM public.produto_servico I
       LEFT JOIN public.imbtpoperacao OP ON OP.id = I.imbtpoperacao_id
       LEFT JOIN public.produto_servicos_loca PL ON I.id = PL.produto_servico_id
       LEFT JOIN public.produto_servicos_venda PV ON I.id = PV.produto_servico_id
       LEFT JOIN public.imbtpimovel TP ON COALESCE(PL.imbtpimovel_id, PV.imbtpimovel_id) = TP.id
       JOIN public.apocidade CID ON I.cidade_id = CID.id
       JOIN public.apobairro BAI ON I.bairro_id = BAI.id
       WHERE I.ativo = true AND I.pub_site = true
       ORDER BY I.updated_at DESC`,
      []
    )
    return res.rows || []
  } catch {
    return []
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Páginas estáticas
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/imoveis`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contato`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/empresa`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/termos`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politica-de-privacidade`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]

  // Páginas dinâmicas de cada imóvel (URLs SEO-friendly)
  const imoveis = await getAllImoveis()
  const imovelPages: MetadataRoute.Sitemap = imoveis.map((imovel) => ({
    url: `${baseUrl}${buildPropertyUrl(imovel)}`,
    lastModified: imovel.updated_at ? new Date(imovel.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...imovelPages]
}
