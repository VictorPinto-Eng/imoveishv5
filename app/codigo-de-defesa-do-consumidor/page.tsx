import Header from '@/components/Header'
import Footer from '@/components/Footer'
import { ExternalLink } from 'lucide-react'

export default function ConsumerCode() {
    return (
        <>
            <Header />
            <main className="container" style={{ padding: '10rem 0 6rem', maxWidth: '800px', minHeight: '80vh' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Código de Defesa do Consumidor</h1>
                
                <section style={{ lineHeight: '1.8', color: '#334155' }}>
                    <p style={{ marginBottom: '1.5rem' }}>
                        Na HV5, prezamos pela transparência e pelo respeito total aos direitos de nossos usuários e clientes. Em conformidade com a legislação brasileira, disponibilizamos o acesso facilitado ao <strong>Código de Defesa do Consumidor (Lei nº 8.078/1990)</strong>.
                    </p>
                    
                    <p style={{ marginBottom: '1.5rem' }}>
                        O CDC é o conjunto de normas que visam a proteção do consumidor, bem como a harmonia das relações de consumo e a transparência em todas as transações realizadas.
                    </p>

                    <div style={{ 
                        marginTop: '3rem', 
                        padding: '2.5rem', 
                        backgroundColor: '#f8fafc', 
                        borderRadius: '16px', 
                        border: '1px solid var(--border)',
                        textAlign: 'center',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)'
                    }}>
                        <h2 style={{ fontSize: '1.25rem', marginBottom: '1.5rem', color: '#0f172a' }}>Deseja ler a lei na íntegra?</h2>
                        <a 
                            href="https://www.planalto.gov.br/ccivil_03/leis/l8078compilado.htm" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="btn btn-primary"
                            style={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                gap: '0.75rem',
                                padding: '1rem 2rem',
                                textDecoration: 'none'
                            }}
                        >
                            <span>Acessar Legislação Oficial</span>
                            <ExternalLink size={18} />
                        </a>
                        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: '#64748b' }}>
                            Você será redirecionado para o portal oficial do Governo Federal (Planalto).
                        </p>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    )
}
