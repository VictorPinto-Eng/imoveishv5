import type { Metadata } from 'next'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const metadata: Metadata = {
    title: 'Sobre a HV5 Imóveis | Empresa',
    description: 'Conheça a HV5 Imóveis, o portal de anúncios imobiliários inovador operado pela TI NET LTDA. CNPJ: 06.374.297/0001-31. Conectamos negócios a pessoas globalmente.',
    keywords: ['HV5 Imóveis', 'TI NET LTDA', 'CNPJ 06374297000131', 'portal de anúncios imobiliários', 'sobre a empresa', 'plataforma imobiliária'],
    alternates: {
        canonical: 'https://imoveis.hv5.com.br/empresa',
    },
    openGraph: {
        title: 'Sobre a HV5 Imóveis | Empresa',
        description: 'Plataforma de anúncios de imóveis conectando negócios a pessoas e pessoas para pessoas. Operado pela TI NET LTDA, CNPJ: 06.374.297/0001-31.',
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
        streetAddress: 'R. Jornalista Aníbal Fernandes, 16, Andar 3',
        addressLocality: 'Caruaru',
        addressRegion: 'PE',
        postalCode: '55002-340',
        addressCountry: 'BR',
    },
    sameAs: [
        'https://www.facebook.com/profile.php?id=61576652982785',
        'https://www.instagram.com/hv5imoveis',
    ],
    description: 'Plataforma global e flexível de anúncios de imóveis conectando negócios a pessoas e pessoas para pessoas.',
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
                    padding: '5rem 0 6rem',
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
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
                            fontSize: 'clamp(2rem, 4vw, 3.5rem)',
                            fontWeight: 700,
                            color: '#ffffff',
                            lineHeight: 1.2,
                            marginBottom: '1.5rem',
                        }}>
                            Uma Nova Experiência em <span style={{ color: '#e30613' }}>Conexões Imobiliárias</span>
                        </h1>
                        <p style={{
                            fontSize: '1.2rem',
                            color: 'rgba(255,255,255,0.8)',
                            maxWidth: '650px',
                            lineHeight: 1.8,
                        }}>
                            Desenvolvemos ecossistemas inteligentes para conectar negócios a pessoas e pessoas para pessoas. Uma plataforma flexível, adaptável e desenhada para redefinir o mercado de anúncios imobiliários.
                        </p>
                    </div>
                </section>

                {/* Main content */}
                <div className="container" style={{ padding: '4rem 1.5rem 5rem', maxWidth: '950px' }}>

                    {/* About card with premium text */}
                    <section style={{
                        background: '#ffffff',
                        borderRadius: '1.25rem',
                        padding: '3rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        marginBottom: '2.5rem',
                        border: '1px solid #e2e8f0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'rgba(227,6,19,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0,
                            }}>🚀</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>O Futuro das Conexões Imobiliárias</h2>
                        </div>

                        <p style={{ fontSize: '1.08rem', lineHeight: 1.9, color: '#374151', marginBottom: '1.5rem' }}>
                            A <strong>HV5 Imóveis</strong> é uma unidade de negócios estratégica da <strong>TI NET LTDA</strong>. Nascemos com a proposta de quebrar barreiras geográficas e operacionais. Projetamos tecnologia avançada aplicada ao mercado de imóveis para oferecer uma experiência de anúncios dinâmica, fluida e totalmente integrada.
                        </p>
                        
                        <p style={{ fontSize: '1.08rem', lineHeight: 1.9, color: '#374151', marginBottom: '1.5rem' }}>
                            Nosso modelo é <strong>global por concepção e local por aplicação</strong>. Criamos um sistema modular capaz de se adequar perfeitamente a diferentes realidades comerciais, legislações regionais e perfis de clientes. Se a sua necessidade muda, nossa tecnologia se adapta instantaneamente, ajustando processos e workflows para garantir a máxima eficiência.
                        </p>

                        <p style={{ fontSize: '1.08rem', lineHeight: 1.9, color: '#374151' }}>
                            Mais do que um portal, somos o elo facilitador que aproxima negócios a pessoas e pessoas para pessoas. Oferecemos ferramentas modernas de contato, gestão interna de propostas (Mural Kanban), segurança de dados e integrações ágeis para garantir que anunciantes e compradores atinjam seus objetivos com rapidez e clareza.
                        </p>
                    </section>

                    {/* Legal info card */}
                    <section style={{
                        background: '#ffffff',
                        borderRadius: '1.25rem',
                        padding: '3rem',
                        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                        marginBottom: '2.5rem',
                        border: '1px solid #e2e8f0',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '2rem' }}>
                            <div style={{
                                width: '40px', height: '40px', borderRadius: '10px',
                                background: 'rgba(227,6,19,0.08)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '1.25rem',
                                flexShrink: 0,
                            }}>📋</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a' }}>Identificação e Transparência</h2>
                        </div>

                        <dl style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                            {[
                                { label: 'Razão Social', value: 'TI NET LTDA', icon: '🏛️' },
                                { label: 'CNPJ', value: '06.374.297/0001-31', icon: '🔢' },
                                { label: 'Telefone / WhatsApp', value: '(81) 99952-9391', icon: '📞', href: 'tel:5581999529391' },
                                { label: 'Site Oficial', value: 'imoveis.hv5.com.br', icon: '🌐', href: 'https://imoveis.hv5.com.br' },
                                { label: 'E-mail Corporativo', value: 'souhv5@gmail.com', icon: '✉️', href: 'mailto:souhv5@gmail.com' },
                                { label: 'Sede Administrativa', value: 'R. Jornalista Aníbal Fernandes, 16, Andar 3 — Bairro Nossa Senhora das Dores, Caruaru/PE — CEP 55002-340', icon: '📍' },
                            ].map(({ label, value, icon, href }) => (
                                <div key={label} style={{
                                    background: '#f8fafc',
                                    borderRadius: '0.875rem',
                                    padding: '1.5rem',
                                    border: '1px solid #e2e8f0',
                                    display: 'flex',
                                    gap: '1rem',
                                    alignItems: 'flex-start',
                                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                                }}
                                className="info-card-hover"
                                >
                                    <span style={{ fontSize: '1.35rem', flexShrink: 0, marginTop: '0.1rem' }}>{icon}</span>
                                    <div>
                                        <dt style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                                            {label}
                                        </dt>
                                        <dd style={{ fontWeight: 600, color: '#0f172a', fontSize: '0.98rem', wordBreak: 'break-word', lineHeight: 1.5 }}>
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

                    {/* Adaptability / values strip */}
                    <section style={{
                        background: 'linear-gradient(135deg, #1f2937, #111827)',
                        borderRadius: '1.25rem',
                        padding: '3rem 2rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                        gap: '2.5rem',
                        marginBottom: '2.5rem',
                    }}>
                        {[
                            { icon: '🧩', title: 'Adaptabilidade Total', text: 'Nossa tecnologia é flexível e pronta para se adaptar a diferentes realidades de mercado, modelos de negócios e particularidades regionais.' },
                            { icon: '🎯', title: 'Conectividade Ágil', text: 'Encurtamos a distância entre a oportunidade e o fechamento do negócio de maneira transparente e 100% segura.' },
                            { icon: '💎', title: 'Experiência Diferenciada', text: 'Foco na usabilidade, workflows de acompanhamento eficientes e design focado no sucesso de anunciantes e corretores.' },
                        ].map(({ icon, title, text }) => (
                            <div key={title} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2.25rem', marginBottom: '1rem' }}>{icon}</div>
                                <h3 style={{ color: '#ffffff', fontWeight: 700, marginBottom: '0.75rem', fontSize: '1.15rem', letterSpacing: '0.02em' }}>{title}</h3>
                                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.92rem', lineHeight: 1.7 }}>{text}</p>
                            </div>
                        ))}
                    </section>

                    {/* CTA */}
                    <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>Pronto para vivenciar o novo?</h3>
                        <p style={{ color: '#64748b', marginBottom: '1.5rem', fontSize: '1rem' }}>
                            Anuncie de forma ágil ou entre em contato direto para conhecer nossas soluções personalizadas.
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                            <a
                                href="/contato"
                                className="btn btn-primary"
                                style={{ minWidth: '180px', padding: '0.85rem 2rem' }}
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
                                    minWidth: '180px',
                                    padding: '0.85rem 2rem',
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
