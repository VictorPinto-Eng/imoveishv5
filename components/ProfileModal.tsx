'use client'

import React, { useEffect, useState } from 'react';
import { LogOut, X, Loader2 } from 'lucide-react';
import styles from './profileModal.module.css';

interface User {
    id: number;
    name: string;
    social_name?: string;
    email: string;
    avatar_url?: string;
    email_verified?: boolean;
    id_tipo_usuario?: number;
    user_type_name?: string;
    phone?: string;
}

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onLogout: () => void;
}

export default function ProfileModal({ isOpen, onClose, user, onLogout }: ProfileModalProps) {
    const [socialName, setSocialName] = useState(user?.social_name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [countryCode, setCountryCode] = useState('55');
    const [idTipoUsuario, setIdTipoUsuario] = useState<number>(user?.id_tipo_usuario || 2);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [emailVerified, setEmailVerified] = useState(user?.email_verified || false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

    useEffect(() => {
        if (isOpen) {
            refreshUserData();
        }
    }, [isOpen]);

    const refreshUserData = async () => {
        setIsRefreshing(true);
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated && data.user) {
                    setSocialName(data.user.social_name || '');
                    setEmail(data.user.email || '');
                    setEmailVerified(data.user.email_verified);
                    setIdTipoUsuario(data.user.id_tipo_usuario || 2);
                    
                    const storedPhone = data.user.phone || '';
                    if (storedPhone.startsWith('55')) {
                        setCountryCode('55');
                    } else if (storedPhone.startsWith('351')) {
                        setCountryCode('351');
                    } else if (storedPhone.startsWith('1')) {
                        setCountryCode('1');
                    } else if (storedPhone.startsWith('34')) {
                        setCountryCode('34');
                    }
                    
                    setPhone(maskPhone(storedPhone));
                }
            }
        } catch (error) {
            console.error('Error refreshing profile data:', error);
        } finally {
            setIsRefreshing(false);
        }
    };

    if (!isOpen || !user) return null;

    const handleSave = async () => {
        // Validation
        if (!email) {
            setMessage({ type: 'error', text: 'O e-mail é obrigatório.' });
            return;
        }
        if (!email.includes('@')) {
            setMessage({ type: 'error', text: 'E-mail inválido.' });
            return;
        }

        setIsSaving(true);
        setMessage(null);
        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    social_name: socialName,
                    email: email,
                    id_tipo_usuario: idTipoUsuario,
                    phone: (() => {
                        if (!phone) return null;
                        const cleaned = phone.replace(/\D/g, '');
                        if (!cleaned) return null;
                        return `${countryCode}${cleaned}`;
                    })()
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ 
                    type: data.emailChanged ? 'warning' : 'success', 
                    text: data.message || 'Salvo com sucesso!' 
                });
                
                if (!data.emailChanged) {
                    setTimeout(() => setMessage(null), 3000);
                }
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao salvar.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setIsSaving(false);
        }
    };

    const maskPhone = (value: string) => {
        let cleaned = value.replace(/\D/g, '');
        
        // Handle common prefixes if they match current country code
        if (cleaned.startsWith(countryCode) && cleaned.length > 10) {
            cleaned = cleaned.substring(countryCode.length);
        } else if (cleaned.startsWith('55') && cleaned.length > 10) {
            // Also handle 55 specifically as it's the default
            cleaned = cleaned.substring(2);
        }

        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        } else {
            return cleaned.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const maskedValue = maskPhone(e.target.value);
        setPhone(maskedValue);
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    }

    const displayName = user.social_name || user.name;
    const isEmailChanged = email !== user.email;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Meu Perfil</h2>
                    <button className={styles.logoutButton} onClick={onLogout}>
                        <LogOut size={20} />
                        <span>Sair</span>
                    </button>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.photoSection}>
                        <div className={styles.photoContainer}>
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} className={styles.photo} />
                            ) : (
                                <div className={styles.initials}>
                                    {getInitials(displayName)}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nome</label>
                        <input 
                            type="text" 
                            disabled 
                            value={user.name} 
                            className={styles.inputDisabled} 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Você é:</label>
                        <div className={styles.userTypeSelector}>
                            <button 
                                type="button"
                                className={`${styles.typeOption} ${idTipoUsuario === 2 ? styles.activeType : ''}`}
                                onClick={() => setIdTipoUsuario(2)}
                            >
                                Proprietário(a)
                            </button>
                            <button 
                                type="button"
                                className={`${styles.typeOption} ${idTipoUsuario === 1 ? styles.activeType : ''}`}
                                onClick={() => setIdTipoUsuario(1)}
                            >
                                Corretor(a) / Imobiliária
                            </button>
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nome Social</label>
                        <input 
                            type="text" 
                            value={socialName} 
                            onChange={(e) => setSocialName(e.target.value)}
                            placeholder="Como você quer ser chamado?"
                            className={styles.input} 
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>Telefone</label>
                        <div className={styles.phoneInputWrapper}>
                            <div className={styles.countrySelector}>
                                <select 
                                    value={countryCode} 
                                    onChange={(e) => setCountryCode(e.target.value)}
                                    className={styles.countrySelect}
                                >
                                    <option value="55">🇧🇷 +55</option>
                                    <option value="1">🇺🇸 +1</option>
                                    <option value="351">🇵🇹 +351</option>
                                    <option value="34">🇪🇸 +34</option>
                                </select>
                            </div>
                            <input 
                                type="text" 
                                value={phone} 
                                onChange={handlePhoneChange}
                                placeholder="(81) 99999-9999"
                                className={styles.phoneInput} 
                            />
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.label}>
                            E-mail 
                            {isEmailChanged ? (
                                <span className={styles.unverified}> (Aguardando Verificação)</span>
                            ) : emailVerified ? (
                                <span className={styles.verified}> (Verificado)</span>
                            ) : (
                                <span className={styles.unverified}> (Não Verificado)</span>
                            )}
                        </label>
                        <input 
                            type="email" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Seu e-mail"
                            className={styles.input} 
                        />
                        {isEmailChanged && (
                            <p className={styles.warningHint}>
                                Ao trocar o e-mail, uma nova verificação será necessária.
                            </p>
                        )}
                    </div>

                    <button 
                        className={styles.saveProfileButton} 
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Salvando...</span>
                            </>
                        ) : (
                            'Salvar Alterações'
                        )}
                    </button>

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
