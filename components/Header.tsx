'use client'

import React, { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, UserCircle2, Home, MessageSquare, Users, HelpCircle, LayoutGrid, LogOut, ChevronDown, PlusCircle, ShieldCheck, Heart, Briefcase, Kanban } from 'lucide-react'
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

    const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

    const fetchUnreadMessagesCount = async () => {
        try {
            const res = await fetch('/api/user/messages/unread');
            if (res.ok) {
                const data = await res.json();
                if (data.success) {
                    setUnreadMessagesCount(data.unreadCount || 0);
                }
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    useEffect(() => {
        if (user) {
            fetchUnreadMessagesCount();
            const interval = setInterval(fetchUnreadMessagesCount, 30000);
            return () => clearInterval(interval);
        } else {
            setUnreadMessagesCount(0);
        }
    }, [user]);

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
                if (data.authenticated && data.user) {
                    setUser(data.user);
                    if (data.user.is_admin) {
                        fetchPendingCreciCount();
                    }

                    // --- Alerta pós-login de dados pendentes (CPF / CRECI) ---
                    const rolesData = data.user.roles || [];
                    const roleIds = rolesData.map((r: any) => Number(r.id));
                    const isProprietario = roleIds.includes(2);
                    const isCorretor = roleIds.includes(3);

                    const hasNotified = sessionStorage.getItem('hv5_notified_pending_docs');

                    if (!hasNotified && !data.user.is_admin) {
                        let needsAlert = false;
                        let alertHtml = '';
                        if (isProprietario && !data.user.cpf_validated) {
                            needsAlert = true;
                            const isCpfFilled = !!data.user.cpf_cnpj;
                            if (isCpfFilled) {
                                alertHtml = `
                                    <p style="margin-bottom:12px; line-height: 1.5;">Você já enviou seus dados cadastrais, agora basta <strong>aguardar a confirmação do seu CPF</strong> pelo administrador para a liberação de anúncios de imóveis na plataforma.</p>
                                    <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:0.875rem; color:#475569; text-align:left;">
                                        ⏳ <strong>Status:</strong> Aguardando Confirmação do CPF
                                    </div>
                                `;
                            } else {
                                alertHtml = `
                                    <p style="margin-bottom:12px; line-height: 1.5;">Como <strong>Proprietário(a)</strong>, você precisa da confirmação do seu CPF para começar a publicar anúncios.</p>
                                    <div style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:8px; padding:12px; font-size:0.875rem; color:#92400e; text-align:left;">
                                        ⚠️ <strong>Pendente:</strong> Cadastro de CPF ou CNPJ.
                                    </div>
                                `;
                            }
                        } else if (isCorretor && (!data.user.cpf_validated || !data.user.creci_status)) {
                            needsAlert = true;
                            const cpfText = data.user.cpf_validated ? '✅ CPF Confirmado' : '❌ CPF Pendente de Confirmação';
                            const creciText = data.user.creci_status ? '✅ CRECI Homologado' : (data.user.creci_document_url ? '⏳ CRECI em Análise' : '❌ Comprovante do CRECI não enviado');

                            alertHtml = `
                                <p style="margin-bottom:12px; line-height: 1.5;">Como <strong>Corretor(a)</strong>, sua conta precisa ser homologada pelo administrador para liberar suas permissões.</p>
                                <div style="background-color:#f5f3ff; border:1px solid #ddd6fe; border-radius:8px; padding:12px; font-size:0.875rem; color:#6d28d9; text-align:left; display:flex; flex-direction:column; gap:4px;">
                                    <div>${cpfText}</div>
                                    <div>${creciText}</div>
                                </div>
                            `;
                        }

                        if (needsAlert) {
                            sessionStorage.setItem('hv5_notified_pending_docs', 'true');
                            const isCpfFilled = !!data.user.cpf_cnpj;
                            const isOnlyProprietarioWaiting = isProprietario && isCpfFilled;

                            setTimeout(() => {
                                Swal.fire({
                                    icon: isOnlyProprietarioWaiting ? 'info' : 'warning',
                                    title: isOnlyProprietarioWaiting ? 'Aguardando Confirmação do CPF ⏳' : 'Perfil Incompleto ⚠️',
                                    html: alertHtml,
                                    confirmButtonText: isOnlyProprietarioWaiting ? 'Entendi' : 'Completar Perfil',
                                    confirmButtonColor: '#7F34E6',
                                    showCancelButton: !isOnlyProprietarioWaiting,
                                    cancelButtonText: 'Depois',
                                    cancelButtonColor: '#64748b'
                                }).then((result) => {
                                    if (result.isConfirmed && !isOnlyProprietarioWaiting) {
                                        window.location.href = '/meu-perfil';
                                    }
                                });
                            }, 500);
                        }
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
            sessionStorage.removeItem('hv5_notified_pending_docs');
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
            const isCorretor = userRoles.some((r: any) => Number(r.id) === 3);
            const isCpfValidated = (user as any).cpf_validated;
            const isCreciValidated = (user as any).creci_status;

            // If it's a Corretor and either CPF or CRECI is not validated
            if (isCorretor && (!isCpfValidated || !isCreciValidated)) {
                const isCpfFilled = !!(user as any).cpf_cnpj;
                const isCreciFilled = !!(user as any).creci_document_url;

                if (isCpfFilled && isCreciFilled) {
                    const cpfText = isCpfValidated ? '✅ CPF Confirmado' : '⏳ CPF Aguardando Confirmação';
                    const creciText = isCreciValidated ? '✅ CRECI Homologado' : '⏳ CRECI em Análise';

                    Swal.fire({
                        icon: 'info',
                        title: 'Aguardando Homologação do Perfil ⏳',
                        html: `
                            <p style="margin-bottom:12px; line-height: 1.5;">Você já enviou seus dados e comprovantes. Agora basta <strong>aguardar a validação e homologação do seu perfil</strong> pelo administrador para anunciar seus imóveis.</p>
                            <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:0.875rem; color:#475569; text-align:left; display:flex; flex-direction:column; gap:4px;">
                                <div>${cpfText}</div>
                                <div>${creciText}</div>
                            </div>
                        `,
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Entendi'
                    });
                } else {
                    const pendingItems = [];
                    if (!isCpfFilled) pendingItems.push('Cadastro de CPF');
                    if (!isCreciFilled) pendingItems.push('Upload do Comprovante do CRECI');

                    Swal.fire({
                        icon: 'warning',
                        title: 'Homologação de CRECI/CPF Pendente ⚠️',
                        html: `
                            <p style="margin-bottom:12px; line-height: 1.5;">Como corretor, você precisa cadastrar seu CPF e enviar o comprovante do seu CRECI para poder anunciar imóveis na plataforma.</p>
                            <div style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:8px; padding:12px; font-size:0.875rem; color:#92400e; text-align:left;">
                                ⚠️ <strong>Pendente:</strong> ${pendingItems.join(' e ')}.
                            </div>
                        `,
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Completar Perfil Agora'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/meu-perfil';
                        }
                    });
                }
                return;
            }

            // If it's ONLY an Owner and CPF is not validated
            if (isProp && !isCorretor && !isCpfValidated) {
                const isCpfFilled = !!(user as any).cpf_cnpj;
                if (isCpfFilled) {
                    Swal.fire({
                        icon: 'info',
                        title: 'Aguardando Confirmação do CPF ⏳',
                        html: `
                            <p style="margin-bottom:12px; line-height: 1.5;">Você já enviou seus dados cadastrais, agora basta <strong>aguardar a confirmação do seu CPF</strong> pelo administrador para a liberação de anúncios de imóveis na plataforma.</p>
                            <div style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:12px; font-size:0.875rem; color:#475569; text-align:left;">
                                ⏳ <strong>Status:</strong> Aguardando Confirmação do CPF
                            </div>
                        `,
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Entendi'
                    });
                } else {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Confirmação de CPF Pendente ⚠️',
                        html: `
                            <p style="margin-bottom:12px; line-height: 1.5;">Como proprietário, você precisa cadastrar e confirmar seu CPF antes de começar a anunciar seus imóveis.</p>
                            <div style="background-color:#fffbeb; border:1px solid #fef3c7; border-radius:8px; padding:12px; font-size:0.875rem; color:#92400e; text-align:left;">
                                ⚠️ <strong>Pendente:</strong> Cadastro de CPF ou CNPJ.
                            </div>
                        `,
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Confirmar CPF Agora'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            window.location.href = '/meu-perfil';
                        }
                    });
                }
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
                                            <>
                                                <Link
                                                    href="/meus-imoveis"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <LayoutGrid size={18} />
                                                    <span>Meus Imóveis</span>
                                                </Link>
                                                <Link
                                                    href="/negocios"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <Briefcase size={18} />
                                                    <span>Negócios</span>
                                                </Link>
                                                <Link
                                                    href="/mural"
                                                    className={styles.dropdownItem}
                                                    onClick={() => setIsDropdownOpen(false)}
                                                >
                                                    <Kanban size={18} />
                                                    <span>Mural</span>
                                                </Link>
                                            </>
                                        )}
                                         <Link
                                             href={unreadMessagesCount > 0 ? "/meus-favoritos?tab=propostas" : "/meus-favoritos"}
                                             className={styles.dropdownItem}
                                             onClick={() => setIsDropdownOpen(false)}
                                             style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                                         >
                                             <Heart size={18} />
                                             <span>Meu Painel</span>
                                             {unreadMessagesCount > 0 && (
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
                                                     {unreadMessagesCount}
                                                 </span>
                                             )}
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
                                <>
                                    <Link href="/meus-imoveis" className={styles.mobileNavLink} onClick={toggleMenu}>
                                        <LayoutGrid size={20} />
                                        <span>Meus Imóveis</span>
                                    </Link>
                                    <Link href="/negocios" className={styles.mobileNavLink} onClick={toggleMenu}>
                                        <Briefcase size={20} />
                                        <span>Negócios</span>
                                    </Link>
                                    <Link href="/mural" className={styles.mobileNavLink} onClick={toggleMenu}>
                                        <Kanban size={20} />
                                        <span>Mural</span>
                                    </Link>
                                </>
                            )}
                             <Link 
                                 href={unreadMessagesCount > 0 ? "/meus-favoritos?tab=propostas" : "/meus-favoritos"}
                                 className={styles.mobileNavLink} 
                                 onClick={toggleMenu}
                                 style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                             >
                                 <Heart size={20} />
                                 <span>Meu Painel</span>
                                 {unreadMessagesCount > 0 && (
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
                                         {unreadMessagesCount}
                                     </span>
                                 )}
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
