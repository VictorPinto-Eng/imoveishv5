import styles from './page.module.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import PropertyQuestions from '@/components/PropertyQuestions'
import { getImovelById, getFeaturedImoveis } from '@/lib/imoveis'
import { notFound, permanentRedirect } from 'next/navigation'
import PropertyGallery from '@/components/PropertyGallery'
import PropertyStats from '@/components/PropertyStats'
import ContactStickyCard from '@/components/ContactStickyCard'

import ImovelCard from '@/components/ImovelCard'
import BackButton from '@/components/BackButton'
import { MapPin, ChevronRight } from 'lucide-react'
import {
  Waves,
  GlassWater,
  Utensils,
  Flower2,
  Laptop,
  TreePine,
  Flame,
  Dog,
  ShoppingCart,
  Gamepad2,
  Dices,
  Clapperboard,
  ToyBrick,
  Heart,
  Footprints,
  Sprout,
  Users,
  Dumbbell,
  Activity,
  Trophy,
  Sun,
  CircleDot,
  Bike,
  KeyRound,
  Package,
  Wifi
} from 'lucide-react'
import AnalyticsTracker from '@/components/AnalyticsTracker'
import { Metadata } from 'next'
import SafePropertyMap from '@/components/SafePropertyMap'
import { cache } from 'react'
import { buildPropertyUrl } from '@/lib/property-url'

// PERF-06: Deduplifica chamadas a getImovelById no mesmo request cycle
const getCachedImovel = cache(async (id: string) => getImovelById(id))

/** Extrai o UUID do array de slugs */
function extractId(slug: string[]): string | null {
    if (slug.length === 1) return slug[0] // URL legada: /imovel/{uuid}
    if (slug.length === 5) return slug[4] // SEO URL: /imovel/{tipo}/{op}/{cidade}/{bairro}/{uuid}
    return null
}

export const revalidate = 60

export async function generateMetadata({ params }: { params: Promise<{ slug: string[] }> }): Promise<Metadata> {
    const { slug } = await params
    const id = extractId(slug)
    if (!id) return { title: 'Imóvel não encontrado' }

    const imovel = await getCachedImovel(id)
    if (!imovel) return { title: 'Imóvel não encontrado' }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const canonicalUrl = `${baseUrl}${buildPropertyUrl(imovel)}`

    const title = `${imovel.operacao_nome || 'Imóvel'} - ${imovel.tipo_nome || 'Detalhes'} | HV5`
    const description = `${imovel.custom_fields?.bairro || ''}, ${imovel.custom_fields?.cidade || ''} - ${imovel.dormitorios || 0} Qtos, ${imovel.area_util || imovel.area_terreno || 0}m²`
    const rawImage = imovel.foto_capa || imovel.imagens_urls?.[0] || ''
    const ogImage = rawImage.startsWith('http') ? rawImage : (rawImage ? `${baseUrl}${rawImage.startsWith('/') ? '' : '/'}${rawImage}` : '')

    return {
        title,
        description,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title,
            description,
            images: ogImage ? [{
                url: ogImage,
                width: 1200,
                height: 630,
                alt: title,
            }] : [],
            url: canonicalUrl,
            type: 'website',
            siteName: 'HV5 Imóveis',
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: ogImage ? [ogImage] : [],
        }
    }
}

export default async function ImovelDetail({ params }: { params: Promise<{ slug: string[] }> }) {
    const { slug } = await params
    const id = extractId(slug)

    if (!id) notFound()

    const imovel = await getCachedImovel(id)

    if (!imovel) notFound()

    // Redirect: URL legada ou slugs incorretos → URL canônica
    const canonicalPath = buildPropertyUrl(imovel)
    const currentPath = `/imovel/${slug.join('/')}`
    if (currentPath !== canonicalPath) {
        permanentRedirect(canonicalPath)
    }

    const similarImoveis = await getFeaturedImoveis(4, id, imovel.imbtpimovel_id, imovel.imbtpoperacao_id, imovel.imbfinalidade_id)

    const isEmpreendimento = imovel.imbtipoanuncio_id === 2;
    const totalUnits = Number(imovel.emp_total_unidades) || 0;
    const hasMultipleUnits = isEmpreendimento && totalUnits > 1;
    const hasSingleUnit = isEmpreendimento && totalUnits === 1;

    const displayPrice = ((hasMultipleUnits || hasSingleUnit) && imovel.emp_min_preco !== undefined && imovel.emp_min_preco !== null)
        ? imovel.emp_min_preco
        : imovel.preco_base;

    const priceFormatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(displayPrice)

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

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'RealEstateListing',
        name: imovel.nome,
        description: imovel.descricao || `${imovel.tipo_imovel_nome} ${imovel.operacao_nome ? `para ${imovel.operacao_nome}` : ''} em ${cf.bairro || ''}, ${cf.cidade || 'Pernambuco'}`,
        url: `${baseUrl}${buildPropertyUrl(imovel)}`,
        image: imovel.imagens_urls?.length ? imovel.imagens_urls : (imovel.foto_capa ? [imovel.foto_capa] : undefined),
        datePosted: imovel.created_at || undefined,
        price: imovel.pub_price !== false ? imovel.preco_base : undefined,
        priceCurrency: 'BRL',
        address: {
            '@type': 'PostalAddress',
            streetAddress: imovel.logradouro || undefined,
            addressLocality: imovel.cidade_nome || cf.cidade || undefined,
            addressRegion: imovel.uf_nome || 'PE',
            addressCountry: 'BR',
            postalCode: imovel.cep || undefined,
            neighborhood: imovel.bairro_nome || cf.bairro || undefined,
        },
        geo: (imovel.latitude && imovel.longitude) ? {
            '@type': 'GeoCoordinates',
            latitude: imovel.latitude,
            longitude: imovel.longitude,
        } : undefined,
        numberOfRooms: imovel.dormitorios || undefined,
        numberOfBathroomsTotal: imovel.banheiros || undefined,
        floorSize: imovel.area_util ? {
            '@type': 'QuantitativeValue',
            value: imovel.area_util,
            unitCode: 'MTK',
        } : undefined,
        additionalProperty: [
            imovel.suites ? { '@type': 'PropertyValue', name: 'Suítes', value: imovel.suites } : null,
            imovel.vagas ? { '@type': 'PropertyValue', name: 'Vagas de garagem', value: imovel.vagas } : null,
            imovel.area_terreno ? { '@type': 'PropertyValue', name: 'Área do terreno', value: `${imovel.area_terreno} m²` } : null,
        ].filter(Boolean),
        offers: {
            '@type': 'Offer',
            price: imovel.pub_price !== false ? imovel.preco_base : undefined,
            priceCurrency: 'BRL',
            availability: 'https://schema.org/InStock',
        },
    }

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Início', item: baseUrl },
            { '@type': 'ListItem', position: 2, name: 'Imóveis', item: `${baseUrl}/imoveis` },
            { '@type': 'ListItem', position: 3, name: imovel.nome, item: `${baseUrl}${buildPropertyUrl(imovel)}` },
        ],
    }
    
    const categories = [
        {
            title: 'Lazer e Social',
            items: [
                { key: 'parque_aquatico', label: 'Parque Aquático', icon: Waves },
                { key: 'salao_festas', label: 'Salão de Festas', icon: GlassWater },
                { key: 'espaco_gourmet', label: 'Espaço Gourmet', icon: Utensils, isNumeric: true },
                { key: 'espaco_zen', label: 'Espaço Zen', icon: Flower2 },
                { key: 'coworking', label: 'Coworking', icon: Laptop },
                { key: 'piquenique', label: 'Espaço Piquenique', icon: TreePine },
                { key: 'espaco_grill', label: 'Espaço Grill', icon: Flame },
                { key: 'pet_park', label: 'Pet Park', icon: Dog },
                { key: 'supermarket', label: 'Supermercado', icon: ShoppingCart },
                { key: 'espaco_gamer', label: 'Espaço Gamer', icon: Gamepad2 },
                { key: 'salao_jogos', label: 'Salão de Jogos', icon: Dices },
                { key: 'sala_cinema', label: 'Sala de Cinema', icon: Clapperboard },
                { key: 'playground', label: 'Playground', icon: ToyBrick }
            ]
        },
        {
            title: 'Bem-Estar',
            items: [
                { key: 'sala_yoga', label: 'Sala de Yoga', icon: Heart },
                { key: 'redario', label: 'Redário', icon: Footprints },
                { key: 'horta', label: 'Horta', icon: Sprout },
                { key: 'area_convivencia', label: 'Área de Convivência', icon: Users }
            ]
        },
        {
            title: 'Esportes',
            items: [
                { key: 'academia', label: 'Academia', icon: Dumbbell },
                { key: 'sala_funcional', label: 'Sala Funcional', icon: Activity },
                { key: 'quadra_poliesportiva', label: 'Quadra Poliesportiva', icon: Trophy },
                { key: 'quadra_beach_tennis', label: 'Quadra Beach Tennis', icon: Sun },
                { key: 'campo_futebol_society', label: 'Campo Futebol Society', icon: CircleDot },
                { key: 'quadra_volei_praia', label: 'Quadra Vôlei de Praia', icon: Sun },
                { key: 'quadra_tenis', label: 'Quadra de Tênis', icon: CircleDot },
                { key: 'ciclovia', label: 'Ciclovia', icon: Bike },
                { key: 'pista_cooper', label: 'Pista de Cooper', icon: Footprints }
            ]
        },
        {
            title: 'Segurança e Conforto',
            items: [
                { key: 'controle_acesso_automatizado', label: 'Acesso Automatizado', icon: KeyRound },
                { key: 'sala_encomendas_delivery', label: 'Sala de Encomendas', icon: Package },
                { key: 'wi_fi_areas_comuns', label: 'Wi-Fi Áreas Comuns', icon: Wifi }
            ]
        }
    ];

    const im = imovel as any;
    const activeCategories = categories.map(cat => {
        const activeItems = cat.items.filter(item => {
            if (item.isNumeric) {
                return Number(im[item.key]) > 0;
            }
            return !!im[item.key];
        });
        return { ...cat, items: activeItems };
    }).filter(cat => cat.items.length > 0);

    return (
        <div className={styles.pageWrapper}>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <Header />
            <AnalyticsTracker produto_servico_id={Number(id)} event_name="view_property" />
            
            <main className="container" style={{ paddingTop: '2rem' }}>
                {/* Breadcrumbs (Simplified) */}
                {(() => {
                    const stateMap: Record<string, string> = {
                        'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia',
                        'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás',
                        'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais',
                        'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí',
                        'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul',
                        'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo',
                        'SE': 'Sergipe', 'TO': 'Tocantins'
                    };
                    const stateName = imovel.uf_nome 
                        ? (stateMap[imovel.uf_nome.toUpperCase()] || imovel.uf_nome)
                        : 'Pernambuco';
                    const cityName = imovel.cidade_nome || cf.cidade || '';
                    
                    return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', fontSize: '0.9rem', color: '#64748b', flexWrap: 'wrap' }}>
                            <span>Imóveis</span>
                            <ChevronRight size={14} />
                            <span>{stateName}</span>
                            {cityName && (
                                <>
                                    <ChevronRight size={14} />
                                    <span>{cityName}</span>
                                </>
                            )}
                            <ChevronRight size={14} />
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>{imovel.tipo_imovel_nome}</span>
                        </div>
                    );
                })()}

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

                        {(() => {
                            const minArea = ((hasMultipleUnits || hasSingleUnit) && imovel.emp_min_area !== undefined && imovel.emp_min_area !== null)
                                ? imovel.emp_min_area
                                : (Number(imovel.area_util) > 0 ? Number(imovel.area_util) : (Number(imovel.area_construida) > 0 ? Number(imovel.area_construida) : Number(imovel.area_terreno)));
                            
                            let areaVal: string | number = minArea;
                            let areaLabel = 'Área total';

                            if (hasMultipleUnits) {
                                areaVal = `a partir de ${minArea} m²`;
                                areaLabel = 'Tamanho das unidades';
                            } else if (hasSingleUnit) {
                                areaVal = `${minArea} m²`;
                                areaLabel = 'Tamanho da última unidade';
                            }

                            return (
                                <PropertyStats 
                                    area={areaVal || undefined}
                                    areaLabel={areaLabel}
                                    bedrooms={imovel.dormitorios}
                                    suites={imovel.suites}
                                    bathrooms={imovel.banheiros}
                                    lavabos={imovel.lavabo}
                                    parking={imovel.vagas}
                                />
                            );
                        })()}

                        {imovel.descricao && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Descrição</h2>
                                <p className={styles.description}>{imovel.descricao}</p>
                            </section>
                        )}

                        {activeCategories.length > 0 && (
                            <section className={styles.section}>
                                <h2 className={styles.sectionTitle}>Área Comum</h2>
                                {activeCategories.map(cat => (
                                    <div key={cat.title} className={styles.caracGroup}>
                                        <h4 className={styles.caracGroupTitle}>{cat.title}</h4>
                                        <div className={styles.caracGrid}>
                                            {cat.items.map(item => {
                                                const IconComponent = item.icon;
                                                const qty = Number(im[item.key]);
                                                const displayLabel = item.isNumeric
                                                    ? (qty > 1 ? `${qty} Espaços Gourmet` : item.label)
                                                    : item.label;
                                                return (
                                                    <div key={item.key} className={styles.caracItem}>
                                                        <div className={styles.caracIconContainer}>
                                                            <IconComponent size={18} className={styles.caracIcon} />
                                                        </div>
                                                        <span className={styles.caracText}>{displayLabel}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

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
                            numericPrice={imovel.preco_base}
                            operacao_nome={imovel.operacao_nome || 'Venda'}
                            condominium={condominioFormatted}
                            iptu={iptuFormatted}
                            seguroIncendio={seguroIncendioFormatted}
                            vrtotal={vrtotalFormatted}
                            propertyName={imovel.nome}
                            propertyLocation={locationTitle}
                            propertyId={id}
                            pub_price={imovel.pub_price}
                            isRental={!!imovel.is_locacao}
                            isEmpreendimento={isEmpreendimento}
                            totalUnits={totalUnits}
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
                        {similarImoveis.length > 0 ? (
                            <div className="card-grid">
                                {similarImoveis.map((item: any) => (
                                    <ImovelCard key={item.id} imovel={item} />
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#64748b', fontSize: '0.95rem' }}>
                                Nenhum outro imóvel semelhante encontrado nesta categoria.
                            </div>
                        )}
                    </div>
                </section>
            </main>

            {/* Back Button */}
            <div className={styles.backFixed}>
                <BackButton className={styles.backBtn} fallbackHref="/imoveis">
                    ← Voltar
                </BackButton>
            </div>

            <Footer />
        </div>
    )
}
