import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeBenefits from '@/components/home/HomeBenefits'
import HomeFeatured from '@/components/home/HomeFeatured'
import { getFeaturedImoveis, getRecentImoveis, getPriceUpdatedImoveis } from '@/lib/imoveis'
import { HOME_SECTIONS } from '@/config/homeSections'

export const revalidate = 60 // ISR: revalida a cada 60 segundos

export default async function Home() {
  // Busca todas as seções em paralelo para melhor performance
  const [destaques, recentes, oportunidades] = await Promise.all([
    getFeaturedImoveis(HOME_SECTIONS.find(s => s.id === 'destaques')?.limit ?? 6),
    getRecentImoveis(HOME_SECTIONS.find(s => s.id === 'recentes')?.limit ?? 6),
    getPriceUpdatedImoveis(HOME_SECTIONS.find(s => s.id === 'oportunidades')?.limit ?? 6),
  ])

  // Monta seções de acordo com a configuração (mantém a ordem e enabled do config)
  const sections = HOME_SECTIONS
    .filter(s => s.enabled)
    .map(s => {
      const imoveis =
        s.id === 'destaques' ? destaques :
        s.id === 'recentes' ? recentes :
        s.id === 'oportunidades' ? oportunidades :
        []
      return { id: s.id, title: s.title, subtitle: s.subtitle, imoveis }
    })

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
