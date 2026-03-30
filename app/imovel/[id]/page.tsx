import styles from './page.module.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { getImovelById, getFeaturedImoveis } from '@/lib/imoveis'
import { notFound } from 'next/navigation'
import PropertyGallery from '@/components/PropertyGallery'
import PropertyStats from '@/components/PropertyStats'
import ContactStickyCard from '@/components/ContactStickyCard'
import AmenitiesTabs from '@/components/AmenitiesTabs'
import ImovelCard from '@/components/ImovelCard'
import BackButton from '@/components/BackButton'
import { MapPin, ChevronRight } from 'lucide-react'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { Metadata } from 'next'
import SafePropertyMap from '@/components/SafePropertyMap'

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const imovel = await getImovelById(id)
    
    if (!imovel) return { title: 'Imóvel não encontrado' }

    const title = `${imovel.operacao_nome || 'Imóvel'} - ${imovel.tipo_nome || 'Detalhes'} | HV5`
    const description = `${imovel.custom_fields?.bairro || ''}, ${imovel.custom_fields?.cidade || ''} - ${imovel.dormitorios || 0} Qtos, ${imovel.area_util || imovel.area_terreno || 0}m²`
    const images = imovel.foto_capa ? [imovel.foto_capa] : (imovel.imagens_urls?.[0] ? [imovel.imagens_urls[0]] : [])

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images,
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images,
        }
    }
}

export default async function ImovelDetail({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const imovel = await getImovelById(id)

    if (!imovel) {
        notFound()
    }

    const similarImoveis = await getFeaturedImoveis(4, id)

    const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(imovel.preco_base)

    const cf = typeof imovel.custom_fields === 'string'
        ? {} 
        : imovel.custom_fields || {}

    // Costs
    const condominioFormatted = cf.valor_condominio 
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cf.valor_condominio)
        : undefined;
    const iptuFormatted = cf.valor_iptu
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cf.valor_iptu)
        : undefined;

    let tags: string[] = []
    try {
        if (typeof imovel.tags === 'string') tags = JSON.parse(imovel.tags)
        else if (Array.isArray(imovel.tags)) tags = imovel.tags
    } catch { }

    const address = [imovel.logradouro, cf.bairro, cf.cidade].filter(Boolean).join(' - ')
    const locationTitle = [cf.bairro, cf.cidade].filter(Boolean).join(', ')

    return (
        <div className={styles.pageWrapper}>
            <Header />
            <AnalyticsTracker produto_servico_id={Number(id)} event_name="view_property" />
            
            <main className="container" style={{ paddingTop: '2rem' }}>
                {/* Breadcrumbs (Simplified) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                    <span>Imóveis</span>
                    <ChevronRight size={14} />
                    <span>{cf.cidade || 'Pernambuco'}</span>
                    <ChevronRight size={14} />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>{imovel.tipo_imovel_nome}</span>
                </div>

                <PropertyGallery images={imovel.imagens_urls} alt={imovel.nome} />

                <div className={styles.mainContent}>
                    {/* Left Column: Details */}
                    <div className={styles.leftCol}>
                        <div className={styles.headerSection}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <span className={styles.typeOperation}>
                                    {imovel.operacao_nome ? `${imovel.operacao_nome} - ` : ''}
                                    {imovel.tipo_imovel_nome}
                                </span>
                                {imovel.status !== 'ativo' && (
                                    <span className={styles.statusBadge}>
                                        {imovel.operacao_nome?.toLowerCase().includes('locaç') ? 'LOCADO' : 'VENDIDO'}
                                    </span>
                                )}
                            </div>
                            <h1 className={styles.title}>{imovel.nome}</h1>
                            <div className={styles.address}>
                                <MapPin size={18} />
                                <span>{address}</span>
                            </div>
                        </div>

                        <PropertyStats 
                            area={imovel.area_util || imovel.area_terreno}
                            bedrooms={imovel.dormitorios}
                            suites={imovel.suites}
                            bathrooms={imovel.banheiros}
                            parking={imovel.vagas}
                        />

                        <section className={styles.section}>
                            <h3 className={styles.sectionTitle}>Perguntas para a Imobiliária</h3>
                            <p className={styles.sectionSubtitle}>Selecione uma ou mais perguntas, ou escreva a sua consulta.</p>
                            <div className={styles.questionButtons}>
                                <button className={styles.questionBtn}>Está disponível?</button>
                                <button className={styles.questionBtn}>Eu posso visitar?</button>
                                <button className={styles.questionBtn}>Qual o valor do condomínio?</button>
                                <button className={styles.questionBtn}>Qual andar?</button>
                            </div>
                            <div className={styles.inquiryBox}>
                                <textarea placeholder="Escreva sua pergunta..." className={styles.inquiryTextarea}></textarea>
                                <button className={styles.sendBtn}>Enviar</button>
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Descrição</h2>
                            <div className={styles.description}>
                                {imovel.descricao}
                            </div>
                        </section>

                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Saiba mais sobre este imóvel</h2>
                            <AmenitiesTabs tags={tags} />
                        </section>
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>Localização</h2>
                            <SafePropertyMap 
                                latitude={imovel.latitude} 
                                longitude={imovel.longitude} 
                                address={address}
                            />
                        </section>
                    </div>

                    {/* Right Column: Sticky Contact Card */}
                    <div className={styles.rightCol}>
                        <ContactStickyCard 
                            price={priceFormatted}
                            condominium={condominioFormatted}
                            iptu={iptuFormatted}
                            propertyName={imovel.nome}
                            propertyLocation={locationTitle}
                            propertyId={id}
                            pub_price={imovel.pub_price}
                            isRental={!!imovel.is_locacao}
                        />
                    </div>
                </div>

                {/* Similar Properties */}
                <section style={{ marginTop: '4rem' }}>
                    <h2 className={styles.sectionTitle}>Imóveis semelhantes</h2>
                    <div className={styles.similarGrid}>
                        {similarImoveis.map((item: any) => (
                            <ImovelCard key={item.id} imovel={item} />
                        ))}
                    </div>
                </section>
            </main>

            {/* Back Button */}
            <div className={styles.backFixed}>
                <BackButton className={styles.backBtn} fallbackHref="/imoveis">
                    ← Voltar para a lista
                </BackButton>
            </div>

            <Footer />
        </div>
    )
}
