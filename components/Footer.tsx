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
                            src="/logo_hv5_1024.png" 
                            alt="HV5" 
                            width={120} 
                            height={44} 
                            className={styles.logoImage} 
                        />
                        <p className={styles.tagline}>
                            Onde grandes oportunidades se encontram. Conectamos pessoas a bens físicos, 
                            digitais e imóveis com a segurança do ecossistema HV5.
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

                    {/* Navigation Column 3 */}
                    <div className={styles.column}>
                        <h3>Serviços</h3>
                        <ul className={styles.list}>
                            <li><Link href="#" className={styles.link}>Anunciar Imóvel</Link></li>
                            <li><Link href="#" className={styles.link}>Guia de Vendas</Link></li>
                            <li><Link href="#" className={styles.link}>Simulador de Financiamento</Link></li>
                            <li><Link href="#" className={styles.link}>HV5 Prime</Link></li>
                        </ul>
                    </div>

                    {/* Social & Apps */}
                    <div className={styles.socialApps}>
                        <div className={styles.column}>
                            <h3>Redes Sociais</h3>
                            <div className={styles.socialIcons}>
                                <Link 
                                    href="https://www.facebook.com/profile.php?id=61576652982785" 
                                    className={styles.socialIcon} 
                                    aria-label="Facebook"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Facebook size={20} />
                                </Link>
                                <Link 
                                    href="https://www.instagram.com/hv5imoveis" 
                                    className={styles.socialIcon} 
                                    aria-label="Instagram"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Instagram size={20} />
                                </Link>
                                {/* <Link 
                                    href="#" 
                                    className={styles.socialIcon} 
                                    aria-label="LinkedIn"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Linkedin size={20} />
                                </Link>
                                <Link 
                                    href="#" 
                                    className={styles.socialIcon} 
                                    aria-label="Twitter"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Twitter size={20} />
                                </Link> */}
                            </div>
                        </div>

                        {/* <div className={styles.appBadges}>
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
                        </div> */}
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
