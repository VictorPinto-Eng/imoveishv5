import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Sobre a HV5 Imóveis | Empresa',
    description: 'Conheça a HV5 Imóveis, portal de anúncios imobiliários operado pela TI NET LTDA. CNPJ: 06.374.297/0001-31. Conectamos negócios a pessoas em Pernambuco.',
    keywords: ['HV5 Imóveis', 'TI NET LTDA', 'CNPJ 06374297000131', 'portal imóveis Pernambuco', 'sobre a empresa'],
    alternates: {
        canonical: 'https://imoveis.hv5.com.br/empresa',
    },
    openGraph: {
        title: 'Sobre a HV5 Imóveis | Empresa',
        description: 'Portal de anúncios imobiliários conectando negócios a pessoas em Pernambuco. Operado pela TI NET LTDA, CNPJ: 06.374.297/0001-31.',
        url: 'https://imoveis.hv5.com.br/empresa',
    },
}

const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HV5 Imóveis',
    legalName: 'TI NET LTDA',
    taxID: '06.374.297/0001-31',
    url: 'https://imoveis.hv5.com.br',
    logo: 'https://imoveis.hv5.com.br/logo_hv5_1024.png',
    telephone: '+55-81-99952-9391',
    email: 'souhv5@gmail.com',
    address: {
        '@type': 'PostalAddress',
        streetAddress: 'Avenida Campina Grande, 2227, Sala 01',
        addressLocality: 'Caruaru',
        addressRegion: 'PE',
        addressCountry: 'BR',
    },
    sameAs: [
        'https://www.facebook.com/profile.php?id=61576652982785',
        'https://www.instagram.com/hv5imoveis',
    ],
    description: 'Portal de anúncios de imóveis conectando negócios a pessoas e pessoas para pessoas em Pernambuco.',
}

export default function EmpresaPage() {
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Header />
            <main style={{ minHeight: 'calc(100vh - 5.7rem)', background: '#f8fafc' }}>

                {/* Hero Banner */}
                <section style={{
                    background: 'linear-gradient(135deg, #1f2937 0%, #111827 60%, #0f172a 100%)',
                    padding: '4rem 0 5rem',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Decorative circles */}
                    <div style={{
                        position: 'absolute', top: '-80px', right: '-80px',
                        width: '400px', height: '400px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(227,6,19,0.15) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-60px', left: '-60px',
                        width: '300px', height: '300px', borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(227,6,19,0.10) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <span style={{
                                background: 'rgba(227,6,19,0.2)',
                                color: '#e30613',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '999px',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                letterSpacing: '0.05em',
                                textTransform: 'uppercase',
                                border: '1px solid rgba(227,6,19,0.3)',
                            }}>
                                Institucional
                            </span>
                        </div>
                        <h1 style={{
                            fontSize: 'clamp(2rem, 4vw, 3.25rem)',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.2,
                            marginBottom: '1.25rem',
                        }}>
                            Sobre a <span style={{ color: '#e30613' }}>HV5 Imóveis</span>
                        </h1>
                        <p style={{
                            fontSize: '1.15rem',
                            color: 'rgba(255,255,255,0.7)',
                            maxWidth: '580px',
                            lineHeight: 1.7,
                        }}>
                            Conectamos negócios a pessoas e pessoas para pessoas — seu portal de anúncios imobiliários em Pernambuco.
                        </p>
                    </div>
                </section>

                {/* Main content */}
                <div className="container" style={{ padding: '3.5rem 1.5rem 5rem', maxWidth: '900px' }}>

                    {/* About card */}
                    <section style={{
                        background: '#ffffff',
                        borderRadius: '1.25rem',
                        padding: '2.5rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                        marginBottom: '2rem',
                        border: '1px solid #e2e8f0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'rgba(227,6,19,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0,
                            }}>🏢</div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Quem somos</h2>
                        </div>

                        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#374151', marginBottom: '1.25rem' }}>
                            A <strong>HV5 Imóveis</strong> é uma unidade de negócios da <strong>TI NET LTDA</strong>, empresa
                            com sede em Caruaru (PE), dedicada a conectar compradores, vendedores e locatários através de
                            tecnologia e atendimento humano de qualidade.
                        </p>
                        <p style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#374151' }}>
                            Atuamos como <strong>portal de anúncios de imóveis</strong>, aproximando negócios a pessoas e
                            pessoas para pessoas — com transparência, agilidade e segurança em cada etapa da sua jornada imobiliária.
                        </p>
                    </section>

                    {/* Legal info card */}
                    <section style={{
                        background: '#ffffff',
                        borderRadius: '1.25rem',
                        padding: '2.5rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
                        marginBottom: '2rem',
                        border: '1px solid #e2e8f0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'rgba(227,6,19,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0,
                            }}>📋</div>
                            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>Dados da empresa</h2>
                        </div>

                        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                            {[
                                { label: 'Razão Social', value: 'TI NET LTDA', icon: '🏛️' },
                                { label: 'CNPJ', value: '06.374.297/0001-31', icon: '🔢' },
                                { label: 'Telefone / WhatsApp', value: '(81) 99952-9391', icon: '📞', href: 'tel:5581999529391' },
                                { label: 'Site', value: 'imoveis.hv5.com.br', icon: '🌐', href: 'https://imoveis.hv5.com.br' },
                                { label: 'E-mail', value: 'souhv5@gmail.com', icon: '✉️', href: 'mailto:souhv5@gmail.com' },
                                { label: 'Endereço', value: 'Av. Campina Grande, 2227, Sala 01 — Nova Caruaru, Caruaru/PE', icon: '📍' },
                            ].map(({ label, value, icon, href }) => (
                                <div key={label} style={{
                                    background: '#f8fafc',
                                    borderRadius: '0.875rem',
                                    padding: '1.25rem 1.5rem',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    gap: '0.875rem',
                                    alignItems: 'flex-start',
                                }}>
                                    <span style={{ fontSize: '1.15rem', flexShrink: 0, marginTop: '0.1rem' }}>{icon}</span>
                                    <div>
                                        <dt style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                                            {label}
                                        </dt>
                                        <dd style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.97rem', wordBreak: 'break-word' }}>
                                            {href ? (
                                                <a href={href} style={{ color: '#e30613', textDecoration: 'none' }}
                                                    target={href.startsWith('http') ? '_blank' : undefined}
                                                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>
                                                    {value}
                                                </a>
                                            ) : value}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </dl>
                    </section>

                    {/* Mission / values strip */}
                    <section style={{
                        background: 'linear-gradient(135deg, #1f2937, #111827)',
                        borderRadius: '1.25rem',
                        padding: '2.5rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '2rem',
                        marginBottom: '2rem',
                    }}>
                        {[
                            { icon: '🎯', title: 'Missão', text: 'Facilitar a compra, venda e locação de imóveis com transparência e tecnologia.' },
                            { icon: '👁️', title: 'Visão', text: 'Ser o principal portal imobiliário de Pernambuco, referência em confiança e inovação.' },
                            { icon: '💎', title: 'Valores', text: 'Transparência, agilidade, comprometimento e respeito às pessoas.' },
                        ].map(({ icon, title, text }) => (
                            <div key={title} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{icon}</div>
                                <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '0.5rem', fontSize: '1.05rem' }}>{title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.9rem', lineHeight: 1.6 }}>{text}</p>
                            </div>
                        ))}
                    </section>

                    {/* CTA */}
                    <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                        <p style={{ color: '#64748b', marginBottom: '1.25rem', fontSize: '1rem' }}>
                            Quer anunciar seu imóvel ou tirar dúvidas? Fale com a gente!
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a
                                href="/contato"
                                className="btn btn-primary"
                                style={{ minWidth: '160px' }}
                            >
                                Fale Conosco
                            </a>
                            <a
                                href="https://wa.me/5581999529391?text=Vim+pela+p%C3%A1gina+Empresa+do+site+e+gostaria+de+mais+informa%C3%A7%C3%B5es."
                                className="btn"
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                    background: '#25D366',
                                    color: '#ffffff',
                                    minWidth: '160px',
                                }}
                            >
                                WhatsApp
                            </a>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </>
    )
}
