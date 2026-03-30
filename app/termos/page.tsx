import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Terms() {
    return (
        <>
            <Header />
            <main className="container" style={{ padding: '10rem 0 6rem', maxWidth: '800px', minHeight: '80vh' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Termos de Uso</h1>
                <p style={{ color: 'var(--secondary)', lineHeight: '1.8' }}>
                    Esta página está em construção. Em breve apresentaremos os termos e condições detalhados para o uso da plataforma HV5.
                </p>
                <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p>Para dúvidas imediatas, entre em contato através do nosso <a href="/contato" style={{ color: 'var(--primary)', fontWeight: '600' }}>Canal de Atendimento</a>.</p>
                </div>
            </main>
            <Footer />
        </>
    )
}
