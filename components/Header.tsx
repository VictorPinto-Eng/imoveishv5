'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, UserCircle2, Home, MessageSquare, Users, HelpCircle, LayoutGrid, LogOut, ChevronDown, PlusCircle } from 'lucide-react'
import styles from './header.module.css'
import LoginModal from './LoginModal'
import ProfileModal from './ProfileModal'

interface User {
    id: number;
    name: string;
    social_name?: string;
    email: string;
    avatar_url?: string;
    email_verified: boolean;
}

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            setUser(null);
            setIsDropdownOpen(false);
            setIsProfileOpen(false);
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen)
    }

    const openModal = () => {
        setIsModalOpen(true)
        setIsMenuOpen(false) // Close mobile menu if open
    }

    const openProfile = () => {
        setIsProfileOpen(true)
        setIsDropdownOpen(false)
        setIsMenuOpen(false)
    }

    const getDisplayName = (user: User) => {
        return user.social_name || user.name;
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    return (
        <>
            <header className={styles.header}>
                <div className={`container ${styles.inner}`}>
                    <div className={styles.logoContainer}>
                        <a href="/" className={styles.logoLink} onClick={() => setIsMenuOpen(false)}>
                            <Image
                                src="/logo_hv5_1024.png"
                                alt="HV5 Logo"
                                width={320}
                                height={130}
                                className={styles.logoImage} style={{ width: "105px", height: "auto", objectFit: "contain" }}
                            />
                        </a>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className={`${styles.nav} ${styles.desktopNav}`}>
                        <Link href="/imoveis" className={styles.navLink}>
                            <Home size={18} />
                            <span>Buscar Imóveis</span>
                        </Link>
                        <Link href="/contato" className={styles.navLink}>
                            <MessageSquare size={18} />
                            <span>Contato</span>
                        </Link>
                        <Link href="#" className={styles.navLink}>
                            <Users size={18} />
                            <span>Sobre nós</span>
                        </Link>
                        <Link href="#" className={styles.navLink}>
                            <HelpCircle size={18} />
                            <span>Central de Ajuda</span>
                        </Link>
                    </nav>

                    {/* Desktop Actions */}
                    <div className={`${styles.actions} ${styles.desktopActions}`}>
                        {user ? (
                            <div className={styles.userMenuContainer} ref={dropdownRef}>
                                <button
                                    className={styles.profilePill}
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                >
                                    <div className={styles.avatar}>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className={styles.avatarImg} />
                                        ) : (
                                            getInitials(getDisplayName(user))
                                        )}
                                    </div>
                                    <span className={styles.userName}>{getDisplayName(user)}</span>
                                    <ChevronDown size={16} color="#64748b" />
                                </button>

                                {isDropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={openProfile}
                                        >
                                            <UserCircle2 size={18} />
                                            <span>Meu Perfil</span>
                                        </button>
                                        <Link
                                            href="/meus-imoveis"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <LayoutGrid size={18} />
                                            <span>Meus Imóveis</span>
                                        </Link>
                                        <div className={styles.dropdownDivider}></div>
                                        <button className={`${styles.dropdownItem} ${styles.logoutItem}`} onClick={handleLogout}>
                                            <LogOut size={18} />
                                            <span>Sair</span>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <button className={styles.loginButtonPill} onClick={openModal}>
                                <UserCircle2 size={20} />
                                <span>Entrar</span>
                            </button>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button className={styles.menuButton} onClick={toggleMenu} aria-label="Toggle menu">
                        {isMenuOpen ? <X size={32} /> : <Menu size={32} />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div className={styles.backdrop} onClick={toggleMenu}></div>
            )}

            <div className={`${styles.mobileMenu} ${isMenuOpen ? styles.open : ''}`}>
                <nav className={styles.mobileNav}>
                    {user && (
                        <div className={styles.mobileProfileHeader}>
                            <div className={styles.avatar}>
                                {user.avatar_url ? (
                                    <img src={user.avatar_url} alt={user.name} className={styles.avatarImg} />
                                ) : (
                                    getInitials(getDisplayName(user))
                                )}
                            </div>
                            <div className={styles.mobileProfileInfo}>
                                <span className={styles.mobileUserName}>{getDisplayName(user)}</span>
                                <span className={styles.mobileUserEmail}>{user.email}</span>
                            </div>
                        </div>
                    )}

                    <Link href="/imoveis" className={styles.mobileNavLink} onClick={toggleMenu}>
                        <Home size={20} />
                        <span>Buscar Imóveis</span>
                    </Link>

                    {user && (
                        <>
                            <button className={styles.mobileNavLink} onClick={openProfile}>
                                <UserCircle2 size={20} />
                                <span>Meu Perfil</span>
                            </button>
                            <Link href="/meus-imoveis" className={styles.mobileNavLink} onClick={toggleMenu}>
                                <LayoutGrid size={20} />
                                <span>Meus Imóveis</span>
                            </Link>
                        </>
                    )}

                    <Link href="/contato" className={styles.mobileNavLink} onClick={toggleMenu}>
                        <MessageSquare size={20} />
                        <span>Contato</span>
                    </Link>
                    <Link href="#" className={styles.mobileNavLink} onClick={toggleMenu}>
                        <Users size={20} />
                        <span>Sobre nós</span>
                    </Link>
                    <Link href="#" className={styles.mobileNavLink} onClick={toggleMenu}>
                        <HelpCircle size={20} />
                        <span>Central de Ajuda</span>
                    </Link>

                    {user ? (
                        <div className={styles.mobileLoginContainer}>
                            <button className={`btn btn-outline ${styles.mobileCta}`} onClick={handleLogout}>Sair</button>
                        </div>
                    ) : (
                        <div className={styles.mobileLoginContainer}>
                            <p className={styles.mobileLoginText}>
                                Entre para ver seus favoritos, visitas, propostas e aluguéis
                            </p>
                            <button className={`btn btn-primary ${styles.mobileCta}`} onClick={openModal}>Entrar</button>
                        </div>
                    )}
                </nav>
            </div>

            <LoginModal isOpen={isModalOpen} onClose={() => {
                setIsModalOpen(false);
                checkAuth(); // Refresh auth status after modal closes
            }} />

            <ProfileModal
                isOpen={isProfileOpen}
                onClose={() => {
                    setIsProfileOpen(false);
                    checkAuth(); // Refresh in case name/social name changed
                }}
                user={user}
                onLogout={handleLogout}
            />
        </>
    )
}
