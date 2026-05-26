import styles from './page.module.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PropertyQuestions from '@/components/PropertyQuestions'
import { getImovelById, getFeaturedImoveis } from '@/lib/imoveis'
import { notFound } from 'next/navigation'
import PropertyGallery from '@/components/PropertyGallery'
import PropertyStats from '@/components/PropertyStats'
import ContactStickyCard from '@/components/ContactStickyCard'

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

    // Costs formatting
    const condominioFormatted = imovel.condominio_incluso
        ? 'Incluso'
        : (cf.valor_condominio 
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cf.valor_condominio)
            : undefined);

    const iptuFormatted = imovel.iptu_incluso
        ? 'Incluso'
        : (cf.valor_iptu
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cf.valor_iptu / 12)
            : undefined);

    const seguroIncendioFormatted = imovel.seguro_incendio_incluso
        ? 'Incluso'
        : (imovel.seguro_incendio
            ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.seguro_incendio)
            : undefined);

    const vrtotalFormatted = imovel.vrtotal
        ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.vrtotal)
        : undefined;



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
                                <span className={styles.statusBadge}>
                                    {(imovel.status_imovel_nome || imovel.status || '').toUpperCase()}
                                </span>
                            </div>
                            <h1 className={styles.title}>{imovel.nome}</h1>
                            <div className={styles.address}>
                                <MapPin size={18} className={styles.addressIcon} />
                                <div className={styles.addressText}>
                                    <span className={styles.street}>{imovel.logradouro || 'Endereço não informado'}</span>
                                    <span className={styles.locationDetail}>
                                        {imovel.bairro_nome && `${imovel.bairro_nome} - `}
                                        {imovel.cidade_nome}{imovel.uf_nome ? `/${imovel.uf_nome}` : ''}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <PropertyStats 
                            area={imovel.area_util || imovel.area_terreno}
                            bedrooms={imovel.dormitorios}
                            suites={imovel.suites}
                            bathrooms={imovel.banheiros}
                            lavabos={imovel.lavabo}
                            parking={imovel.vagas}
                        />

                        <PropertyQuestions 
                            propertyId={id} 
                            propertyTitle={imovel.nome} 
                        />


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
                            seguroIncendio={seguroIncendioFormatted}
                            vrtotal={vrtotalFormatted}
                            propertyName={imovel.nome}
                            propertyLocation={locationTitle}
                            propertyId={id}
                            pub_price={imovel.pub_price}
                            isRental={!!imovel.is_locacao}
                        />
                    </div>
                </div>

                {/* Similar Properties */}
                <section className={styles.similarSection}>
                    <div className={styles.similarContainer}>
                        <div className={styles.similarHeader}>
                            <h2>Imóveis semelhantes</h2>
                            <p style={{ color: '#64748b' }}>Outras opções que podem te interessar nesta região</p>
                        </div>
                        <div className={styles.similarGrid}>
                            {similarImoveis.map((item: any) => (
                                <ImovelCard key={item.id} imovel={item} />
                            ))}
                        </div>
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
