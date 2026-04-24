import Header from '@/components/Header'
import Footer from '@/components/Footer'
import WhatsAppLink from '../../components/WhatsAppLink'


export default function ContactPage() {
    return (
        <>
            <Header />
            <main style={{ padding: '4rem 0', background: '#f8fafc', minHeight: 'calc(100vh - 4rem)' }}>
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem', textAlign: 'center' }}>Contato</h1>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '2rem',
                        backgroundColor: 'white',
                        padding: '2rem',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* Form Section */}
                        <div>
                            <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Envie uma mensagem</h2>
                            <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div>
                                    <label htmlFor="name" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Nome</label>
                                    <input type="text" id="name" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} placeholder="Seu nome" />
                                </div>
                                <div>
                                    <label htmlFor="phone" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Telefone</label>
                                    <input type="tel" id="phone" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} placeholder="(00) 00000-0000" />
                                </div>
                                <div>
                                    <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>E-mail</label>
                                    <input type="email" id="email" style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} placeholder="seu@email.com" />
                                </div>
                                <div>
                                    <label htmlFor="message" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Mensagem</label>
                                    <textarea id="message" rows={4} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }} placeholder="Como podemos ajudar?"></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>Enviar</button>
                            </form>
                        </div>

                        {/* Info Section */}
                        <div style={{ backgroundColor: '#1f2937', color: 'white', padding: '2rem', borderRadius: '1rem', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: 'white' }}>HV5</h3>
                            <p style={{ marginBottom: '2rem', opacity: 0.9 }}>
                                Avenida Campina Grande, 2227, Sala 01 - Nova Caruaru - Caruaru - PE
                            </p>

                            <div style={{ marginBottom: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <p style={{ opacity: 0.7, fontSize: '0.875rem', marginBottom: '-0.25rem' }}>Venda</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>(81) 98666-1683</p>
                                <p style={{ fontSize: '1.1rem', fontWeight: 500 }}>(81) 99952-9391</p>
                            </div>

                            <p style={{ marginBottom: '2rem' }}>hv5solucoesimobiliarias@gmail.com</p>

                            <WhatsAppLink
                                messageOrImovel="Vim pelo site, desejo efetuar contato para esclarecimento"
                                isFullMessage={true}
                                className="btn"
                                style={{
                                    backgroundColor: '#25D366',
                                    color: 'white',
                                    border: 'none',
                                    textAlign: 'center',
                                    display: 'block',
                                    width: '100%'
                                }}
                            >
                                Falar no WhatsApp
                            </WhatsAppLink>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    )
}
