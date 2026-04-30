import Link from 'next/link'
import ImovelCard from '@/components/ImovelCard'
import { Imovel } from '@/lib/imoveis'
import styles from './homeFeatured.module.css'

export interface ImovelSection {
  id: string
  title: string
  subtitle: string
  imoveis: Imovel[]
}

interface HomeFeaturedProps {
  sections: ImovelSection[]
}

export default function HomeFeatured({ sections }: HomeFeaturedProps) {
  // Only render sections that have at least 1 imovel
  const activeSections = sections.filter(s => s.imoveis.length > 0)

  if (activeSections.length === 0) {
    return (
      <section className={styles.featuredSection}>
        <div className="container">
          <p className={styles.emptyMessage}>Nenhum imóvel disponível no momento.</p>
        </div>
      </section>
    )
  }

  return (
    <>
      {activeSections.map((section) => (
        <section key={section.id} className={styles.featuredSection}>
          <div className="container">
            <div className={styles.featuredHeader}>
              <div>
                <h2 className={styles.featuredTitle}>{section.title}</h2>
                <p className={styles.featuredSubtitle}>{section.subtitle}</p>
              </div>
              <Link href="/imoveis" className={`btn ${styles.viewAllButton}`}>
                Ver todos &rarr;
              </Link>
            </div>

            <div className="card-grid">
              {section.imoveis.map((imovel) => (
                <ImovelCard key={imovel.id} imovel={imovel} showStatus={false} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  )
}
