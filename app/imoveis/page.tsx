import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ImovelCard from '@/components/ImovelCard'
import ImovelFilters from '@/components/ImovelFilters'
import Pagination from '@/components/Pagination'
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
        exclusividade: params.exclusividade as string,
        page: params.page ? Number(params.page) : 1,
        pageSize: 24,
        sortBy: (params.sortBy as 'recent' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc') || 'recent',
    }

    const hasActiveFilters = !!(
        filters.cidade || filters.bairro || filters.tipo || filters.finalidade ||
        filters.operacao || filters.minPrice || filters.maxPrice ||
        filters.dormitorios || filters.suites || filters.banheiros || filters.vagas ||
        filters.minArea || filters.maxArea
    )

    const result = await getImoveis(filters)
    const imoveis = result.imoveis
    const pagination = result.pagination

    return (
        <>
            <Header />
            <main style={{ padding: '2rem 0', minHeight: '80vh' }}>
                <div className="container">
                    <h1 style={{ marginBottom: '2rem' }}>Encontre seu imóvel</h1>

                    <ImovelFilters
                        initialFilters={filters}
                    />

                    {imoveis.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--secondary)' }}>
                            <h3>Nenhum imóvel encontrado com esses filtros.</h3>
                            <p>Tente ajustar sua busca.</p>
                        </div>
                    ) : (
                        <>
                            <p style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
                                {hasActiveFilters
                                    ? `${pagination.total} ${pagination.total === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}`
                                    : 'Imóveis recentes'
                                }
                            </p>
                            <div className="card-grid">
                                {imoveis.map((imovel: any) => (
                                    <ImovelCard key={imovel.id} imovel={imovel} />
                                ))}
                            </div>
                            {pagination.totalPages > 1 && (
                                <Pagination
                                    currentPage={pagination.page}
                                    totalPages={pagination.totalPages}
                                />
                            )}
                        </>
                    )}
                </div>
            </main>
            <Footer />
        </>
    )
}
