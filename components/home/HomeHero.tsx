import Link from 'next/link'
import WhatsAppLink from '@/components/WhatsAppLink'
import styles from './homeHero.module.css'

export default function HomeHero() {
    return (
        <section className={styles.hero}>
            <div className="container">
                <div className={styles.badge}>
                    ⭐ Imóveis selecionados nas melhores localizações
                </div>

                <h1 className={styles.title}>
                    Encontre seu <span className={styles.highlight}>imóvel ideal</span>
                    <br />
                    em poucos cliques
                </h1>

                <div className={styles.subtitleWrapper}>
                    <p className={styles.subtitle}>• Venda, Compra e Aluguel de imóveis nas melhores localizações</p>
                    <p className={styles.subtitle}>• Atendimento rápido e personalizado via WhatsApp</p>
                </div>

                <div className={styles.buttons}>
                    <Link href="/imoveis" className={`btn btn-primary ${styles.buttonLink}`}>
                        🔍 Buscar imóveis
                    </Link>

                    <WhatsAppLink
                        messageOrImovel="Vim pelo site, e gostaria de falar com um especialista"
                        isFullMessage={true}
                        className={`btn ${styles.whatsappButton}`}
                    >
                        💬 Falar com especialista
                    </WhatsAppLink>
                </div>
            </div>
        </section>
    )
}
