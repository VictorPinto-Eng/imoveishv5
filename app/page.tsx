import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeBenefits from '@/components/home/HomeBenefits'
import HomeFeatured from '@/components/home/HomeFeatured'
import { getFeaturedImoveis, getRecentImoveis, getPriceUpdatedImoveis } from '@/lib/imoveis'
import { Imovel } from '@/lib/imoveis'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function Home() {
  // Busca todas as fontes em paralelo
  const [destaques, recentes, oportunidades] = await Promise.all([
    getFeaturedImoveis(12),
    getRecentImoveis(6),
    getPriceUpdatedImoveis(6),
  ])

  // Mescla tudo em uma única lista, removendo duplicatas por ID
  const seen = new Set<string>()
  const allImoveis: Imovel[] = []
  for (const imovel of [...destaques, ...recentes, ...oportunidades]) {
    if (!seen.has(imovel.id)) {
      seen.add(imovel.id)
      allImoveis.push(imovel)
    }
  }

  const sections = [
    {
      id: 'destaques',
      title: 'Imóveis em Destaque',
      subtitle: 'Conheça nossas melhores oportunidades — destaques, novidades e ofertas',
      imoveis: allImoveis,
    },
  ]

  return (
    <>
      <Header />
      <main>
        <HomeHero />
        <HomeBenefits />
        <HomeFeatured sections={sections} />
      </main>
      <Footer />
    </>
  )
}
