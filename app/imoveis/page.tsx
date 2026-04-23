
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ImovelCard from '@/components/ImovelCard'
import ImovelFilters from '@/components/ImovelFilters'
import { getImoveis } from '@/lib/imoveis'

export const revalidate = 0 // Dynamic

export default async function ImoveisPage({
    searchParams
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const params = await searchParams
    const minPrice = params.minPrice ? Number(params.minPrice) : undefined
    const maxPrice = params.maxPrice ? Number(params.maxPrice) : undefined

    const filters = {
        cidade: params.cidade as string,
        bairro: params.bairro as string,
        tipo: params.tipo as string,
        finalidade: params.finalidade as string,
        minPrice,
        maxPrice,
        dormitorios: params.dormitorios ? Number(params.dormitorios) : undefined,
        suites: params.suites ? Number(params.suites) : undefined,
        banheiros: params.banheiros ? Number(params.banheiros) : undefined,
        vagas: params.vagas ? Number(params.vagas) : undefined,
        minArea: params.minArea ? Number(params.minArea) : undefined,
        maxArea: params.maxArea ? Number(params.maxArea) : undefined,
        status: params.status as string,
        operacao: params.operacao as string,
        alto_padrao: params.alto_padrao as string,
        exclusividade: params.exclusividade as string
    }

    const hasFilters = Object.keys(params).length > 0;
    const imoveis = hasFilters ? await getImoveis(filters) : [];

    return (
        <>
            <Header />
            <main style={{ padding: '2rem 0', minHeight: '80vh' }}>
                <div className="container">
                    <h1 style={{ marginBottom: '2rem' }}>Encontre seu imóvel</h1>

                    <ImovelFilters />

                    {!hasFilters ? (
                        <div style={{ textAlign: 'center', padding: '6rem 0', color: 'var(--secondary)' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
                            <h3>Utilize os filtros acima para iniciar sua busca.</h3>
                            <p>Selecione uma localização ou tipo de imóvel para ver as opções disponíveis.</p>
                        </div>
                    ) : imoveis.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--secondary)' }}>
                            <h3>Nenhum imóvel encontrado com esses filtros.</h3>
                            <p>Tente ajustar sua busca.</p>
                        </div>
                    ) : (
                        <div className="card-grid">
                            {imoveis.map(imovel => (
                                <ImovelCard key={imovel.id} imovel={imovel} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    )
}
