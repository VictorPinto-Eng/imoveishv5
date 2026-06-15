import { MetadataRoute } from 'next'
import { query } from '@/lib/db'

export const dynamic = 'force-dynamic'


async function getAllImovelIds(): Promise<{ id: string; updated_at?: string }[]> {
  try {
    const res = await query(
      `SELECT id, updated_at FROM public.produto_servico 
       WHERE tipo = 'produto' AND categoria = 'Imovel' AND ativo = true AND pub_site = true
       ORDER BY updated_at DESC`,
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

  // Páginas dinâmicas de cada imóvel
  const imoveis = await getAllImovelIds()
  const imovelPages: MetadataRoute.Sitemap = imoveis.map((imovel) => ({
    url: `${baseUrl}/imovel/${imovel.id}`,
    lastModified: imovel.updated_at ? new Date(imovel.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [...staticPages, ...imovelPages]
}
