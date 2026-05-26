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
    creci_numero?: string;
    creci_apoestado_id?: number;
    creci_tipo?: string;
    creci_status?: boolean;
    creci_document_url?: string;
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
    const [creciNumero, setCreciNumero] = useState(user?.creci_numero || '');
    const [creciApoestadoId, setCreciApoestadoId] = useState<number | ''>(user?.creci_apoestado_id || '');
    const [creciTipo, setCreciTipo] = useState(user?.creci_tipo || 'Física');
    const [creciStatus, setCreciStatus] = useState<boolean | null>(user?.creci_status ?? null);
    const [creciDocumentUrl, setCreciDocumentUrl] = useState(user?.creci_document_url || '');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [estados, setEstados] = useState<Array<{ id: number; nome: string; sigla: string }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [emailVerified, setEmailVerified] = useState(user?.email_verified || false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

    useEffect(() => {
        if (isOpen) {
            refreshUserData();
            fetchEstados();
        }
    }, [isOpen]);

    const fetchEstados = async () => {
        try {
            const res = await fetch('/api/property/estados');
            if (res.ok) {
                const data = await res.json();
                setEstados(data);
            }
        } catch (error) {
            console.error('Error fetching estados:', error);
        }
    };

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
                    setCreciNumero(data.user.creci_numero || '');
                    setCreciApoestadoId(data.user.creci_apoestado_id || '');
                    setCreciTipo(data.user.creci_tipo || 'Física');
                    setCreciStatus(data.user.creci_status ?? null);
                    setCreciDocumentUrl(data.user.creci_document_url || '');
                    
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

    const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: 'O comprovante deve ter no máximo 5MB.' });
            return;
        }

        setIsUploadingDoc(true);
        setMessage(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/user/profile/document', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setCreciDocumentUrl(data.url);
                setCreciStatus(false); // Pendente de aprovação
                setMessage({ type: 'success', text: 'Comprovante do CRECI enviado com sucesso! Aguarde homologação.' });
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao enviar o documento.' });
            }
        } catch (error) {
            console.error('Error uploading document:', error);
            setMessage({ type: 'error', text: 'Erro de conexão ao enviar documento.' });
        } finally {
            setIsUploadingDoc(false);
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

        if (idTipoUsuario === 1) {
            if (!creciNumero) {
                setMessage({ type: 'error', text: 'O número do CRECI é obrigatório para corretores.' });
                return;
            }
            if (!creciApoestadoId) {
                setMessage({ type: 'error', text: 'A UF de registro do CRECI é obrigatória.' });
                return;
            }
            if (!creciTipo) {
                setMessage({ type: 'error', text: 'O tipo de inscrição do CRECI é obrigatório.' });
                return;
            }
            if (!creciDocumentUrl) {
                setMessage({ type: 'error', text: 'É obrigatório fazer o upload do comprovante do CRECI.' });
                return;
            }
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
                    creci_numero: idTipoUsuario === 1 ? creciNumero : null,
                    creci_apoestado_id: idTipoUsuario === 1 ? (Number(creciApoestadoId) || null) : null,
                    creci_tipo: idTipoUsuario === 1 ? creciTipo : null,
                    phone: (() => {
                        if (!phone) return null;
                        const cleaned = phone.replace(/\D/g, '');
                        if (!cleaned) return null;
                        return `${countryCode}${cleaned}`;
                    })()
                })
            });

            const contentType = res.headers.get("content-type");
            let data;
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                // Se não for JSON, provavelmente é um erro do Gateway (HTML)
                throw new Error('O servidor demorou muito para responder ou ocorreu um erro interno. Por favor, tente novamente.');
            }

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

                    {idTipoUsuario === 1 && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>Dados do CRECI</h4>
                            
                            <div className={styles.formGroup} style={{ marginBottom: '0.25rem' }}>
                                <label className={styles.label}>Número do CRECI</label>
                                <input 
                                    type="text" 
                                    value={creciNumero} 
                                    onChange={(e) => setCreciNumero(e.target.value)}
                                    placeholder="Número do registro (ex: 12345)"
                                    className={creciDocumentUrl ? styles.inputDisabled : styles.input} 
                                    disabled={!!creciDocumentUrl}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                    <label className={styles.label}>UF de Registro</label>
                                    <select 
                                        value={creciApoestadoId} 
                                        onChange={(e) => setCreciApoestadoId(e.target.value ? Number(e.target.value) : '')}
                                        className={creciDocumentUrl ? styles.inputDisabled : styles.input}
                                        style={{ height: '45px', padding: '0 0.75rem', backgroundColor: creciDocumentUrl ? '#f1f5f9' : 'white' }}
                                        disabled={!!creciDocumentUrl}
                                    >
                                        <option value="">Selecione a UF</option>
                                        {estados.map(est => (
                                            <option key={est.id} value={est.id}>{est.sigla}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                    <label className={styles.label}>Tipo de Inscrição</label>
                                    <select 
                                        value={creciTipo} 
                                        onChange={(e) => setCreciTipo(e.target.value)}
                                        className={creciDocumentUrl ? styles.inputDisabled : styles.input}
                                        style={{ height: '45px', padding: '0 0.75rem', backgroundColor: creciDocumentUrl ? '#f1f5f9' : 'white' }}
                                        disabled={!!creciDocumentUrl}
                                    >
                                        <option value="Física">Física (F)</option>
                                        <option value="Jurídica">Jurídica (J)</option>
                                    </select>
                                </div>
                            </div>

                            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
                                <label className={styles.label}>Comprovante do CRECI (Obrigatório)</label>
                                {creciDocumentUrl ? (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', backgroundColor: 'white', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📄</span>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Comprovante Enviado</span>
                                                <a href={creciDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#7F34E6', textDecoration: 'underline' }}>
                                                    Visualizar documento enviado
                                                </a>
                                            </div>
                                        </div>
                                        {/* Só permite alterar caso não tenha sido verificado ainda. Se verificado, esconde opção de alterar. */}
                                        {!creciStatus ? (
                                            <label style={{ cursor: 'pointer', fontSize: '0.8rem', color: '#64748b', textDecoration: 'underline' }}>
                                                {isUploadingDoc ? 'Enviando...' : 'Alterar'}
                                                <input type="file" accept="application/pdf,image/*" onChange={handleUploadDocument} style={{ display: 'none' }} />
                                            </label>
                                        ) : (
                                            <span style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Homologado</span>
                                        )}
                                    </div>
                                ) : (
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white', transition: 'all 0.2s' }}>
                                        {isUploadingDoc ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} style={{ color: '#7F34E6' }} />
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Enviando documento...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '1.5rem' }}>📄</span>
                                                <span style={{ fontSize: '0.85rem', color: '#7F34E6', fontWeight: 600, marginTop: '0.25rem' }}>Enviar Comprovante (PDF/Imagem)</span>
                                                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Clique para selecionar (Máx 5MB)</span>
                                            </>
                                        )}
                                        <input type="file" accept="application/pdf,image/*" onChange={handleUploadDocument} style={{ display: 'none' }} />
                                    </label>
                                )}
                            </div>
                            
                            {creciStatus !== null && (
                                <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                    Status do CRECI:{' '}
                                    {!creciDocumentUrl ? (
                                        <span style={{ color: '#ef4444' }}>❌ Não Enviado</span>
                                    ) : creciStatus ? (
                                        <span style={{ color: '#10b981' }}>✅ Verificado / Ativo</span>
                                    ) : (
                                        <span style={{ color: '#64748b' }}>⏳ Aguardando Verificação</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

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
