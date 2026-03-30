import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Manual() {
    return (
        <>
            <Header />
            <main className="container" style={{ padding: '10rem 0 6rem', maxWidth: '800px', minHeight: '80vh' }}>
                <h1 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>Manual do Usuário</h1>
                <p style={{ color: 'var(--secondary)', lineHeight: '1.8' }}>
                    Esta página está sendo preparada com o Manual do Usuário HV5. 
                    Em breve, você encontrará guias detalhados sobre como aproveitar ao máximo a plataforma.
                </p>
                <div style={{ marginTop: '2rem', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p>Precisa de assistência imediata? Visite nossa <a href="/contato" style={{ color: 'var(--primary)', fontWeight: '600' }}>Central de Atendimento</a>.</p>
                </div>
            </main>
            <Footer />
        </>
    )
}
