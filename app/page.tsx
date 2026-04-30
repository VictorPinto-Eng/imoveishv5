import Header from '@/components/Header'
import Footer from '@/components/Footer'
import HomeHero from '@/components/home/HomeHero'
import HomeBenefits from '@/components/home/HomeBenefits'
import HomeFeatured from '@/components/home/HomeFeatured'
import { getFeaturedImoveis } from '@/lib/imoveis'

export const revalidate = 60 // ISR: revalida a cada 60 segundos

export default async function Home() {
    const featured = await getFeaturedImoveis()

    return (
        <>
            <Header />
            <main>
                <HomeHero />
                <HomeBenefits />
                <HomeFeatured imoveis={featured} />
            </main>
            <Footer />
        </>
    )
}
