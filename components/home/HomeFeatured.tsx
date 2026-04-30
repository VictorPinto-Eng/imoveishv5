import Link from 'next/link'
import ImovelCard from '@/components/ImovelCard'
import { Imovel } from '@/lib/imoveis'
import styles from './homeFeatured.module.css'

interface HomeFeaturedProps {
    imoveis: Imovel[]
}

export default function HomeFeatured({ imoveis }: HomeFeaturedProps) {
    return (
        <section className={styles.featuredSection}>
            <div className="container">
                <div className={styles.featuredHeader}>
                    <div>
                        <h2 className={styles.featuredTitle}>Imóveis em destaque</h2>
                        <p className={styles.featuredSubtitle}>Conheça nossas melhores oportunidades</p>
                    </div>
                    <Link href="/imoveis" className={`btn ${styles.viewAllButton}`}>
                        Ver todos &rarr;
                    </Link>
                </div>

                {imoveis.length === 0 ? (
                    <p className={styles.emptyMessage}>Nenhum imóvel em destaque no momento.</p>
                ) : (
                    <div className="card-grid">
                        {imoveis.map((imovel) => (
                            <ImovelCard key={imovel.id} imovel={imovel} />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
