import styles from './homeBenefits.module.css'

export default function HomeBenefits() {
    return (
        <section className={styles.benefitsSection}>
            <div className="container">
                <div className={styles.benefitsGrid}>
                    <div className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 21l1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                            </svg>
                        </div>
                        <h3 className={styles.benefitTitle}>Imóveis verificados</h3>
                        <p className={styles.benefitText}>Selecionados nas melhores localizações</p>
                    </div>

                    <div className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                        <h3 className={styles.benefitTitle}>Compra segura</h3>
                        <p className={styles.benefitText}>Documentação verificada e processo transparente</p>
                    </div>

                    <div className={styles.benefitCard}>
                        <div className={styles.benefitIcon}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                            </svg>
                        </div>
                        <h3 className={styles.benefitTitle}>Atendimento rápido via WhatsApp</h3>
                        <p className={styles.benefitText}>Suporte ágil em todas as etapas</p>
                    </div>
                </div>
            </div>
        </section>
    )
}
