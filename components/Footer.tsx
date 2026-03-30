import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Linkedin, Twitter, Smartphone, Apple } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
    const currentYear = new Date().getFullYear();
    const lastUpdate = "29/03/2026"; // Data da última grande atualização

    return (
        <footer className={styles.footer}>
            <div className="container">
                <div className={styles.grid}>
                    {/* Brand Column */}
                    <div className={styles.brandColumn}>
                        <Image 
                            src="/logo_hv5_v3.png" 
                            alt="HV5.com" 
                            width={220} 
                            height={80} 
                            className={styles.logoImage} 
                        />
                        <p className={styles.tagline}>
                            Conectando pessoas aos melhores imóveis com tecnologia e transparência. 
                            Sua jornada imobiliária no ecossistema HV5.
                        </p>
                    </div>

                    {/* Navigation Column 1 */}
                    <div className={styles.column}>
                        <h3>Institucional</h3>
                        <ul className={styles.list}>
                            <li><Link href="#" className={styles.link}>Sobre nós</Link></li>
                            <li><Link href="/contato" className={styles.link}>Contato</Link></li>
                            <li><Link href="#" className={styles.link}>Central de Ajuda</Link></li>
                            <li><Link href="/manual" className={styles.link}>Manual do usuário</Link></li>
                        </ul>
                    </div>

                    {/* Navigation Column 2 */}
                    <div className={styles.column}>
                        <h3>Legal</h3>
                        <ul className={styles.list}>
                            <li><Link href="/politica-de-privacidade" className={styles.link}>Política de Privacidade</Link></li>
                            <li><Link href="/termos" className={styles.link}>Termos de uso</Link></li>
                            <li><Link href="/codigo-de-defesa-do-consumidor" className={styles.link}>Código de Defesa do Consumidor</Link></li>
                            <li><Link href="#" className={styles.link}>Preferências de cookies</Link></li>
                        </ul>
                    </div>

                    {/* Social & Apps */}
                    <div className={styles.socialApps}>
                        <div className={styles.column}>
                            <h3>Redes Sociais</h3>
                            <div className={styles.socialIcons}>
                                <Link href="#" className={styles.socialIcon} aria-label="Facebook">
                                    <Facebook size={20} />
                                </Link>
                                <Link href="#" className={styles.socialIcon} aria-label="Instagram">
                                    <Instagram size={20} />
                                </Link>
                                <Link href="#" className={styles.socialIcon} aria-label="LinkedIn">
                                    <Linkedin size={20} />
                                </Link>
                                <Link href="#" className={styles.socialIcon} aria-label="Twitter">
                                    <Twitter size={20} />
                                </Link>
                            </div>
                        </div>

                        <div className={styles.appBadges}>
                            <div className={styles.badge}>
                                <Smartphone size={24} />
                                <div className={styles.badgeContent}>
                                    <span className={styles.badgeSmall}>Disponível no</span>
                                    <span className={styles.badgeLarge}>Google Play</span>
                                </div>
                            </div>
                            <div className={styles.badge}>
                                <Apple size={24} />
                                <div className={styles.badgeContent}>
                                    <span className={styles.badgeSmall}>Baixar na</span>
                                    <span className={styles.badgeLarge}>App Store</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className={styles.divider}></div>

                <div className={styles.bottom}>
                    <p className={styles.copyright}>
                        &copy; {currentYear} hv5.com.br - Todos os direitos reservados.
                    </p>
                    <div className={styles.version}>
                        Versão: {lastUpdate}
                    </div>
                </div>
            </div>
        </footer>
    )
}
