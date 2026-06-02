'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, UserCircle2, Home, MessageSquare, Users, HelpCircle, LayoutGrid, LogOut, ChevronDown, PlusCircle, ShieldCheck, Heart } from 'lucide-react'
import styles from './header.module.css'
import LoginModal from './LoginModal'
import ProfileModal from './ProfileModal'
import AnunciarModal from './AnunciarModal'
import Swal from 'sweetalert2'

interface User {
    id: number;
    name: string;
    social_name?: string;
    email: string;
    avatar_url?: string;
    email_verified: boolean;
    is_admin?: boolean;
    cpf_validated?: boolean;
    roles?: Array<{ id: number; nome: string }>;
}

export default function Header() {
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isProfileOpen, setIsProfileOpen] = useState(false)
    const [isAnunciarOpen, setIsAnunciarOpen] = useState(false)
    const [user, setUser] = useState<User | null>(null)
    const [isDropdownOpen, setIsDropdownOpen] = useState(false)
    const [pendingCount, setPendingCount] = useState<number>(0)
    const dropdownRef = useRef<HTMLDivElement>(null)

    const userRoles = user?.roles || [];
    const hasAdvertiserRole = userRoles.some((r: any) => Number(r.id) === 2 || Number(r.id) === 3);
    const showMeusImoveis = !!user?.is_admin || (hasAdvertiserRole && !!user?.cpf_validated);

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
        
        // Verifica se a conta acabou de ser ativada pela URL ou se foi desativada
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('activated') === 'true') {
                // Remove o parâmetro da URL de forma amigável
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                // Dispara o SweetAlert2 informando o sucesso
                setTimeout(() => {
                    Swal.fire({
                        icon: 'success',
                        title: 'E-mail Ativado! 🎉',
                        text: 'Sua conta foi validada e ativada com sucesso. Você já pode fazer login no ecossistema HV5.',
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Fazer Login'
                    }).then(() => {
                        // Abre o modal de login automaticamente
                        openModal();
                    });
                }, 300);
            } else if (params.get('error') === 'account_deactivated') {
                // Remove o parâmetro da URL de forma amigável
                const newUrl = window.location.pathname;
                window.history.replaceState({}, '', newUrl);

                // Dispara o SweetAlert2 informando a conta desativada
                setTimeout(() => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Acesso Bloqueado ⚠️',
                        text: 'Sua conta está desativada. Entre em contato com o suporte para mais informações.',
                        confirmButtonColor: '#7F34E6',
                    });
                }, 300);
            }
        }
    }, []);

    const checkAuth = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setUser(data.user);
                    if (data.user.is_admin) {
                        fetchPendingCreciCount();
                    }
                } else {
                    setUser(null);
                }
            }
        } catch (error) {
            console.error('Error checking auth:', error);
        }
    }

    const fetchPendingCreciCount = async () => {
        try {
            const res = await fetch('/api/admin/stats');
            if (res.ok) {
                const data = await res.json();
                if (data.success && Array.isArray(data.pendingCreci)) {
                    setPendingCount(data.pendingCreci.length);
                }
            }
        } catch (error) {
            console.error('Error fetching stats for badge:', error);
        }
    };

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

    const handleAnunciarClick = () => {
        if (!user) {
            openModal();
            return;
        }

        const userRoles = (user as any).roles || [];
        const hasAdvertiserRole = userRoles.some((r: any) => Number(r.id) === 2 || Number(r.id) === 3);

        if (hasAdvertiserRole) {
            const isProp = userRoles.some((r: any) => Number(r.id) === 2);
            const isCpfValidated = (user as any).cpf_validated;

            if (isProp && !isCpfValidated) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Validação de CPF Pendente ⚠️',
                    text: 'Como proprietário, você precisa validar seu CPF antes de começar a anunciar seus imóveis.',
                    confirmButtonColor: '#7F34E6',
                    confirmButtonText: 'Validar CPF Agora'
                }).then(() => {
                    window.location.href = '/meu-perfil';
                });
                return;
            }
            window.location.href = '/meus-imoveis/incluir';
        } else {
            setIsAnunciarOpen(true);
        }
    };

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
                        <button onClick={handleAnunciarClick} className={styles.navLink} style={{ background: 'none', border: 'none', font: 'inherit', cursor: 'pointer', marginRight: '0.5rem' }}>
                            <PlusCircle size={18} />
                            <span>Anunciar</span>
                        </button>
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
                                        <Link
                                            href="/meu-perfil"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <UserCircle2 size={18} />
                                            <span>Meu Perfil</span>
                                        </Link>
                                        {showMeusImoveis && (
                                            <Link
                                                href="/meus-imoveis"
                                                className={styles.dropdownItem}
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <LayoutGrid size={18} />
                                                <span>Meus Imóveis</span>
                                            </Link>
                                        )}
                                        <Link
                                            href="/meus-favoritos"
                                            className={styles.dropdownItem}
                                            onClick={() => setIsDropdownOpen(false)}
                                        >
                                            <Heart size={18} />
                                            <span>Meu Painel</span>
                                        </Link>
                                        {user.is_admin && (
                                            <Link
                                                href="/admin"
                                                className={styles.dropdownItem}
                                                onClick={() => setIsDropdownOpen(false)}
                                                style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                                            >
                                                <ShieldCheck size={18} />
                                                <span>Painel Admin</span>
                                                {pendingCount > 0 && (
                                                    <span style={{ 
                                                        backgroundColor: '#ef4444', 
                                                        color: 'white', 
                                                        borderRadius: '9999px', 
                                                        padding: '2px 7px', 
                                                        fontSize: '11px', 
                                                        fontWeight: 'bold', 
                                                        marginLeft: 'auto',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        lineHeight: 1
                                                    }}>
                                                        {pendingCount}
                                                    </span>
                                                )}
                                            </Link>
                                        )}
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

                    <button
                        className={styles.mobileNavLink}
                        onClick={() => {
                            toggleMenu();
                            handleAnunciarClick();
                        }}
                        style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                    >
                        <PlusCircle size={20} />
                        <span>Anunciar</span>
                    </button>

                    {user && (
                        <>
                            <Link href="/meu-perfil" className={styles.mobileNavLink} onClick={toggleMenu}>
                                <UserCircle2 size={20} />
                                <span>Meu Perfil</span>
                            </Link>
                            {showMeusImoveis && (
                                <Link href="/meus-imoveis" className={styles.mobileNavLink} onClick={toggleMenu}>
                                    <LayoutGrid size={20} />
                                    <span>Meus Imóveis</span>
                                </Link>
                            )}
                            <Link href="/meus-favoritos" className={styles.mobileNavLink} onClick={toggleMenu}>
                                <Heart size={20} />
                                <span>Meu Painel</span>
                            </Link>
                            {user.is_admin && (
                                <Link 
                                    href="/admin" 
                                    className={styles.mobileNavLink} 
                                    onClick={toggleMenu}
                                    style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                                >
                                    <ShieldCheck size={20} />
                                    <span>Painel Admin</span>
                                    {pendingCount > 0 && (
                                        <span style={{ 
                                            backgroundColor: '#ef4444', 
                                            color: 'white', 
                                            borderRadius: '9999px', 
                                            padding: '2px 7px', 
                                            fontSize: '11px', 
                                            fontWeight: 'bold', 
                                            marginLeft: 'auto',
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            lineHeight: 1
                                        }}>
                                            {pendingCount}
                                        </span>
                                    )}
                                </Link>
                            )}
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

            <AnunciarModal
                isOpen={isAnunciarOpen}
                onClose={() => {
                    setIsAnunciarOpen(false);
                }}
                user={user}
                onSuccess={() => {
                    checkAuth(); // Refresh after upgrade
                    window.location.href = '/meus-imoveis/incluir';
                }}
            />
        </>
    )
}
