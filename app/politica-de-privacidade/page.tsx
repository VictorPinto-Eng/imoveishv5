import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function PrivacyPolicy() {
    return (
        <>
            <Header />
            <main className="container" style={{ padding: '8rem 0 4rem', maxWidth: '800px' }}>
                <article style={{ lineHeight: '1.8' }}>
                    <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--foreground)' }}>
                        Política de Privacidade
                    </h1>
                    <p style={{ color: 'var(--secondary)', marginBottom: '3rem' }}>
                        Última atualização: 1 de julho de 2025
                    </p>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <p>
                            Este documento explica como coletamos, usamos e protegemos seus dados pessoais ao utilizar o ecossistema HV5.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Quem somos nós?
                        </h2>
                        <ul style={{ listStyle: 'none', paddingLeft: '0' }}>
                            <li><strong>Nome da Empresa:</strong> TI NET LTDA</li>
                            <li><strong>CNPJ:</strong> 06.374.297/0001-31</li>
                            <li><strong>Telefone:</strong> +55 81 99952-9391</li>
                            <li><strong>E-mail:</strong> souhv5@gmail.com</li>
                        </ul>
                        <p style={{ marginTop: '1rem' }}>
                            Somos especializados em serviços de automações empresariais.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Quais dados coletamos?
                        </h2>
                        <ul>
                            <li>Nome</li>
                            <li>Telefone</li>
                            <li>E-mail</li>
                            <li>Mensagens via WhatsApp</li>
                            <li>Outras informações fornecidas por você</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Para que usamos esses dados?
                        </h2>
                        <ul>
                            <li>Responder dúvidas</li>
                            <li>Fornecer serviços</li>
                            <li>Melhorar nosso atendimento</li>
                            <li>Enviar novidades (apenas com sua permissão)</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Compartilhamos seus dados?
                        </h2>
                        <p>
                            Não compartilhamos seus dados com terceiros, exceto quando necessário para cumprir obrigações legais.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2.5rem' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Como protegemos seus dados?
                        </h2>
                        <p>
                            Usamos ferramentas seguras, protocolos de criptografia e mantemos acesso restrito às informações.
                        </p>
                    </section>

                    <section style={{ marginBottom: '2.5rem', background: '#f8fafc', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>📌</span> Seus direitos (LGPD)
                        </h2>
                        <p>
                            De acordo com a Lei Geral de Proteção de Dados (LGPD), você pode solicitar a qualquer momento a confirmação, correção, exclusão ou revogação do seu consentimento.
                        </p>
                        <p style={{ marginTop: '1rem' }}>
                            Entre em contato conosco pelos canais oficiais:
                        </p>
                        <div style={{ marginTop: '1rem' }}>
                            <p><strong>E-mail:</strong> <a href="mailto:souhv5@gmail.com" style={{ color: 'var(--primary)' }}>souhv5@gmail.com</a></p>
                            <p><strong>WhatsApp:</strong> <a href="https://wa.me/5581999529391" style={{ color: 'var(--primary)' }}>+55 81 99952-9391</a></p>
                        </div>
                    </section>
                </article>
            </main>
            <Footer />
        </>
    )
}
