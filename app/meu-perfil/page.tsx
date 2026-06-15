'use client'

import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { User, Lock, Mail, Trash2, Loader2, ChevronRight, FileText, Upload } from 'lucide-react';
import styles from './meu-perfil.module.css';
import Swal from 'sweetalert2';

interface UserProfile {
    id: number;
    name: string;
    social_name?: string;
    email: string;
    avatar_url?: string;
    email_verified: boolean;
    id_tipo_usuario: number;
    roles: Array<{ id: number; nome: string }>;
    phone?: string;
    creci_numero?: string;
    creci_apoestado_id?: number;
    creci_tipo?: string;
    creci_status?: boolean;
    creci_document_url?: string;
    cpf_cnpj?: string;
    data_nascimento?: string;
    cpf_validated?: boolean;
    razao_social?: string;
}

type TabType = 'dados' | 'senha' | 'email' | 'deletar';

export default function MeuPerfilPage() {
    const [activeTab, setActiveTab] = useState<TabType>('dados');
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [authenticated, setAuthenticated] = useState<boolean | null>(null);
    
    // Tab "Dados" states
    const [socialName, setSocialName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [countryCode, setCountryCode] = useState('55');
    const [selectedRoles, setSelectedRoles] = useState<number[]>([1]);
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [razaoSocial, setRazaoSocial] = useState('');

    const handleRoleToggle = (roleId: number) => {
        setSelectedRoles(prev => {
            if (prev.includes(roleId)) {
                if (prev.length === 1) return prev;
                return prev.filter(id => id !== roleId);
            } else {
                return [...prev, roleId];
            }
        });
    };
    const [cpfValidated, setCpfValidated] = useState(false);
    const [isValidatingCpf, setIsValidatingCpf] = useState(false);
    const [creciNumero, setCreciNumero] = useState('');
    const [creciApoestadoId, setCreciApoestadoId] = useState<number | ''>('');
    const [creciTipo, setCreciTipo] = useState('Física');
    const [creciStatus, setCreciStatus] = useState<boolean | null>(null);
    const [creciDocumentUrl, setCreciDocumentUrl] = useState('');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [estados, setEstados] = useState<Array<{ id: number; nome: string; sigla: string }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

    // Tab "Senha" states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [passwordMessage, setPasswordMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    // Tab "E-mail" states
    const [newEmail, setNewEmail] = useState('');
    const [confirmNewEmail, setConfirmNewEmail] = useState('');
    const [isSavingEmail, setIsSavingEmail] = useState(false);
    const [emailMessage, setEmailMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

    // Tab "Deletar" states
    const [deletePassword, setDeletePassword] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

    useEffect(() => {
        fetchUserData();
        fetchEstados();
    }, []);

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

    const fetchUserData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/auth/me');
            const data = await res.json();
            if (res.ok && data.authenticated && data.user) {
                setAuthenticated(true);
                setUser(data.user);
                
                // Set default form values
                setSocialName(data.user.social_name || '');
                setEmail(data.user.email || '');
                const rolesData = data.user.roles || [];
                const roleIds = rolesData.map((r: any) => Number(r.id));
                setSelectedRoles(roleIds.length > 0 ? roleIds : [Number(data.user.id_tipo_usuario || 1)]);
                setCreciNumero(data.user.creci_numero || '');
                setCreciApoestadoId(data.user.creci_apoestado_id || '');
                setCreciTipo(data.user.creci_tipo || 'Física');
                setCreciStatus(data.user.creci_status ?? null);
                setCreciDocumentUrl(data.user.creci_document_url || '');
                setCpfCnpj(maskCpfCnpj(data.user.cpf_cnpj || ''));
                setCpfValidated(data.user.cpf_validated || false);
                setRazaoSocial(data.user.razao_social || '');
                if (data.user.data_nascimento) {
                    setDataNascimento(new Date(data.user.data_nascimento).toISOString().split('T')[0]);
                } else {
                    setDataNascimento('');
                }
                
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
            } else {
                setAuthenticated(false);
            }
        } catch (error) {
            console.error('Error fetching profile data:', error);
            setAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const handleValidateCPF = async () => {
        if (!cpfCnpj) {
            Swal.fire({ icon: 'warning', title: 'Aviso', text: 'Por favor, digite o CPF/CNPJ para validação.' });
            return;
        }
        if (!dataNascimento) {
            Swal.fire({ icon: 'warning', title: 'Aviso', text: 'Por favor, insira a Data de Nascimento / Abertura para validação.' });
            return;
        }
        const isCpf = cpfCnpj.replace(/\D/g, '').length === 11;
        if (isCpf && (!razaoSocial || !razaoSocial.trim())) {
            Swal.fire({ icon: 'warning', title: 'Aviso', text: 'Por favor, insira o nome completo conforme consta na Receita Federal.' });
            return;
        }
        if (!user) return;

        setIsValidatingCpf(true);
        try {
            const res = await fetch('/api/user/validate-cpf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    cpf: cpfCnpj, 
                    fullName: user.name, 
                    birthDate: dataNascimento,
                    razaoSocial: razaoSocial
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (data.isCpfPending) {
                    setCpfValidated(false);
                    Swal.fire({
                        icon: 'info',
                        title: 'Solicitação Enviada! ⏳',
                        text: data.message || 'Seu CPF foi enviado para análise e homologação do administrador.',
                        confirmButtonColor: '#7F34E6'
                    });
                } else {
                    setCpfValidated(true);
                    const isCnpj = cpfCnpj.replace(/\D/g, '').length === 14;
                    if (isCnpj && data.data_nascimento) {
                        setDataNascimento(data.data_nascimento);
                    }
                    Swal.fire({
                        icon: 'success',
                        title: 'Validado com Sucesso! 🎉',
                        text: data.message || 'Seu documento foi validado com sucesso na base de dados cadastral.',
                        confirmButtonColor: '#7F34E6'
                    });
                }
                fetchUserData();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Falha na Validação',
                    text: data.error || 'O documento fornecido ou o nome não são válidos.',
                    confirmButtonColor: '#ef4444'
                });
            }
        } catch (error) {
            Swal.fire({ icon: 'error', title: 'Erro', text: 'Erro ao comunicar com o servidor de validação.' });
        } finally {
            setIsValidatingCpf(false);
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
                setCreciStatus(false);
                setMessage({ type: 'success', text: 'Comprovante do CRECI enviado com sucesso!' });
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

    const handleSaveDados = async () => {
        if (!email) {
            setMessage({ type: 'error', text: 'O e-mail é obrigatório.' });
            return;
        }

        const isProprietario = selectedRoles.includes(2);
        const isCorretor = selectedRoles.includes(3);

        if (isProprietario) {
            if (!cpfCnpj) {
                setMessage({ type: 'error', text: 'O CPF/CNPJ é obrigatório para proprietários.' });
                return;
            }
            if (!dataNascimento) {
                setMessage({ type: 'error', text: 'A data de nascimento é obrigatória.' });
                return;
            }
        }

        if (isCorretor) {
            if (!cpfCnpj) {
                setMessage({ type: 'error', text: 'O CPF é obrigatório para corretores.' });
                return;
            }
            if (!dataNascimento) {
                setMessage({ type: 'error', text: 'A data de nascimento é obrigatória.' });
                return;
            }
            if (!creciNumero) {
                setMessage({ type: 'error', text: 'O número do CRECI é obrigatório.' });
                return;
            }
            if (!creciApoestadoId) {
                setMessage({ type: 'error', text: 'A UF do CRECI é obrigatória.' });
                return;
            }
            if (!creciDocumentUrl) {
                setMessage({ type: 'error', text: 'O upload do comprovante do CRECI é obrigatório.' });
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
                    roles: selectedRoles,
                    creci_numero: isCorretor ? creciNumero : null,
                    creci_apoestado_id: isCorretor ? Number(creciApoestadoId) : null,
                    creci_tipo: isCorretor ? creciTipo : null,
                    cpf_cnpj: (isProprietario || isCorretor) ? cpfCnpj : null,
                    data_nascimento: (isProprietario || isCorretor) ? dataNascimento : null,
                    phone: phone ? `${countryCode}${phone.replace(/\D/g, '')}` : null
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ 
                    type: data.emailChanged ? 'warning' : 'success', 
                    text: data.message || 'Dados atualizados com sucesso!' 
                });
                fetchUserData();
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao salvar alterações.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePassword = async () => {
        if (!currentPassword || !newPassword || !confirmNewPassword) {
            setPasswordMessage({ type: 'error', text: 'Todos os campos de senha são obrigatórios.' });
            return;
        }

        if (newPassword !== confirmNewPassword) {
            setPasswordMessage({ type: 'error', text: 'As novas senhas não coincidem.' });
            return;
        }

        setIsSavingPassword(true);
        setPasswordMessage(null);

        try {
            const res = await fetch('/api/user/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword, newPassword })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setPasswordMessage({ type: 'success', text: data.message });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmNewPassword('');
            } else {
                setPasswordMessage({ type: 'error', text: data.error || 'Erro ao alterar a senha.' });
            }
        } catch (error) {
            setPasswordMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
        } finally {
            setIsSavingPassword(false);
        }
    };

    const handleSaveEmail = async () => {
        if (!newEmail || !newEmail.includes('@')) {
            setEmailMessage({ type: 'error', text: 'E-mail novo inválido.' });
            return;
        }

        if (newEmail.trim().toLowerCase() !== confirmNewEmail.trim().toLowerCase()) {
            setEmailMessage({ type: 'error', text: 'Os e-mails informados não coincidem.' });
            return;
        }

        setIsSavingEmail(true);
        setEmailMessage(null);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    social_name: socialName,
                    email: newEmail,
                    roles: selectedRoles,
                    phone: phone ? `${countryCode}${phone.replace(/\D/g, '')}` : null
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                if (data.emailChanged) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'E-mail Alterado! ✉️',
                        text: 'Um e-mail de ativação foi enviado para seu novo endereço. Sua sessão foi encerrada e você precisa validar o novo e-mail antes de fazer login novamente.',
                        confirmButtonColor: '#7F34E6',
                        confirmButtonText: 'Entendi'
                    }).then(() => {
                        window.location.href = '/';
                    });
                } else {
                    setEmailMessage({
                        type: 'success',
                        text: data.message || 'E-mail alterado com sucesso!'
                    });
                    setNewEmail('');
                    setConfirmNewEmail('');
                    fetchUserData();
                }
            } else {
                setEmailMessage({ type: 'error', text: data.error || 'Erro ao salvar novo e-mail.' });
            }
        } catch (error) {
            setEmailMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
        } finally {
            setIsSavingEmail(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteMessage({ type: 'error', text: 'Por favor, digite sua senha para confirmar.' });
            return;
        }

        const confirm = await Swal.fire({
            title: 'Você tem certeza?',
            text: 'Esta ação é definitiva e apagará todos os seus dados e imóveis!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Sim, excluir minha conta',
            cancelButtonText: 'Cancelar'
        });

        if (!confirm.isConfirmed) return;

        setIsDeleting(true);
        setDeleteMessage(null);

        try {
            const res = await fetch('/api/user/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                Swal.fire({
                    title: 'Conta Excluída',
                    text: 'Sua conta foi removida do ecossistema HV5.',
                    icon: 'success',
                    confirmButtonColor: '#7F34E6'
                }).then(() => {
                    window.location.href = '/';
                });
            } else {
                setDeleteMessage({ type: 'error', text: data.error || 'Erro ao excluir conta.' });
            }
        } catch (error) {
            setDeleteMessage({ type: 'error', text: 'Erro ao conectar ao servidor.' });
        } finally {
            setIsDeleting(false);
        }
    };

    const maskPhone = (value: string) => {
        let cleaned = value.replace(/\D/g, '');
        if (cleaned.startsWith(countryCode) && cleaned.length > 10) {
            cleaned = cleaned.substring(countryCode.length);
        } else if (cleaned.startsWith('55') && cleaned.length > 10) {
            cleaned = cleaned.substring(2);
        }
        if (cleaned.length <= 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3').trim();
        } else {
            return cleaned.substring(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
    };

    const maskCpfCnpj = (value: string) => {
        const cleaned = value.replace(/\D/g, '');
        if (cleaned.length <= 11) {
            return cleaned
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            return cleaned
                .substring(0, 14)
                .replace(/^(\d{2})(\d)/, '$1.$2')
                .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
                .replace(/\.(\d{3})(\d)/, '.$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        }
    };

    const getDisplayName = (u: UserProfile) => {
        return u.social_name || u.name;
    };

    const getInitials = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <>
            <Header />
            <main className={styles.main}>
                <div className={styles.container}>
                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0', gap: '16px' }}>
                            <Loader2 className="animate-spin" size={40} style={{ color: '#7F34E6' }} />
                            <p style={{ color: '#64748b', fontWeight: 500 }}>Carregando perfil...</p>
                        </div>
                    ) : authenticated === false ? (
                        <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '60px 40px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0', maxWidth: '500px', margin: '40px auto' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔐</div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#1e293b', marginBottom: '12px' }}>Acesso Restrito</h2>
                            <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.5 }}>
                                Faça login para gerenciar os dados da sua conta e perfis de anúncio.
                            </p>
                            <button 
                                onClick={() => {
                                    const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
                                    if (loginBtn) loginBtn.click();
                                }}
                                style={{ backgroundColor: '#7F34E6', color: 'white', border: 'none', borderRadius: '12px', padding: '12px 24px', fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(127,52,230,0.3)' }}
                            >
                                Fazer Login
                            </button>
                        </div>
                    ) : user && (
                        <div className={styles.layout}>
                            
                            {/* Left Sidebar */}
                            <aside className={styles.sidebar}>
                                <div className={styles.avatarSection}>
                                    <div className={styles.avatarContainer}>
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt={user.name} className={styles.avatarImg} />
                                        ) : (
                                            getInitials(getDisplayName(user))
                                        )}
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#1e293b' }}>
                                            {getDisplayName(user)}
                                        </h3>
                                    </div>
                                </div>

                                <nav style={{ display: 'flex', flexDirection: 'column' }}>
                                    <button 
                                        className={`${styles.sidebarItem} ${activeTab === 'dados' ? styles.activeItem : ''}`}
                                        onClick={() => setActiveTab('dados')}
                                    >
                                        <span>Dados</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        className={`${styles.sidebarItem} ${activeTab === 'senha' ? styles.activeItem : ''}`}
                                        onClick={() => setActiveTab('senha')}
                                    >
                                        <span>Mudar senha</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        className={`${styles.sidebarItem} ${activeTab === 'email' ? styles.activeItem : ''}`}
                                        onClick={() => setActiveTab('email')}
                                    >
                                        <span>Mudar email</span>
                                        <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        className={`${styles.sidebarItem} ${activeTab === 'deletar' ? styles.activeItem : ''}`}
                                        onClick={() => setActiveTab('deletar')}
                                        style={{ color: '#ef4444' }}
                                    >
                                        <span>Eliminar conta</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </nav>
                            </aside>

                            {/* Right Content Area */}
                            <section className={styles.contentArea}>
                                {activeTab === 'dados' && (
                                    <div>
                                        <h2 className={styles.title}>Dados</h2>
                                        
                                        <h3 className={styles.sectionTitle}>Pessoal</h3>
                                        <p className={styles.sectionSubtitle}>Complete com seus dados pessoais.</p>

                                        <div className={styles.formGroup}>
                                            <label className={styles.label}>Você é:</label>
                                            <div className={styles.userTypeSelector}>
                                                <button 
                                                    type="button"
                                                    className={`${styles.typeOption} ${selectedRoles.includes(1) ? styles.activeType : ''}`}
                                                    onClick={() => handleRoleToggle(1)}
                                                >
                                                    Consumidor
                                                </button>
                                                <button 
                                                    type="button"
                                                    className={`${styles.typeOption} ${selectedRoles.includes(2) ? styles.activeType : ''}`}
                                                    onClick={() => handleRoleToggle(2)}
                                                >
                                                    Proprietário(a)
                                                </button>
                                                <button 
                                                    type="button"
                                                    className={`${styles.typeOption} ${selectedRoles.includes(3) ? styles.activeType : ''}`}
                                                    onClick={() => handleRoleToggle(3)}
                                                >
                                                    Corretor(a)
                                                </button>
                                            </div>
                                        </div>

                                        <div className={styles.grid}>
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Nome Completo</label>
                                                <input type="text" value={user.name} className={styles.inputDisabled} disabled />
                                            </div>
                                            
                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Nome Social / Como deseja ser chamado</label>
                                                <input 
                                                    type="text" 
                                                    value={socialName} 
                                                    onChange={e => setSocialName(e.target.value)}
                                                    placeholder="Nome de exibição"
                                                    className={styles.input} 
                                                />
                                            </div>
                                        </div>

                                        {(selectedRoles.includes(2) || selectedRoles.includes(3)) && (
                                            <div className={styles.grid}>
                                                <div className={styles.formGroup}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <label className={styles.label}>{(selectedRoles.includes(2) && !selectedRoles.includes(3)) ? "CPF ou CNPJ" : "CPF"}</label>
                                                        {cpfValidated ? (
                                                            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✅ Validado Receita</span>
                                                        ) : (!!user?.cpf_cnpj && !user?.cpf_validated) ? (
                                                            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>⏳ Aguardando Homologação</span>
                                                        ) : (
                                                            <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>⚠️ Não Validado</span>
                                                        )}
                                                    </div>
                                                    <input 
                                                        type="text" 
                                                        value={cpfCnpj} 
                                                        onChange={e => setCpfCnpj(maskCpfCnpj(e.target.value))}
                                                        placeholder="000.000.000-00"
                                                        className={(cpfValidated || (!!user?.cpf_cnpj && !user?.cpf_validated)) ? styles.inputDisabled : styles.input} 
                                                        disabled={cpfValidated || (!!user?.cpf_cnpj && !user?.cpf_validated)}
                                                    />
                                                    {cpfValidated && user?.razao_social && (
                                                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '6px', fontWeight: 500 }}>
                                                            <strong>Razão Social:</strong> {user.razao_social}
                                                        </div>
                                                    )}
                                                </div>
 
                                                <div className={styles.formGroup}>
                                                    <label className={styles.label}>Data de Nascimento / Abertura</label>
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <input 
                                                            type="date" 
                                                            value={dataNascimento} 
                                                            onChange={e => setDataNascimento(e.target.value)}
                                                            className={(cpfValidated || (!!user?.cpf_cnpj && !user?.cpf_validated)) ? styles.inputDisabled : styles.input} 
                                                            disabled={cpfValidated || (!!user?.cpf_cnpj && !user?.cpf_validated)}
                                                            style={{ flex: 1, height: '45px' }}
                                                        />
                                                        {!cpfValidated && !(!!user?.cpf_cnpj && !user?.cpf_validated) && (
                                                            <button
                                                                type="button"
                                                                onClick={handleValidateCPF}
                                                                disabled={isValidatingCpf}
                                                                style={{
                                                                    backgroundColor: '#7F34E6',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '10px',
                                                                    padding: '0 16px',
                                                                    fontSize: '0.85rem',
                                                                    fontWeight: 600,
                                                                    cursor: 'pointer',
                                                                    whiteSpace: 'nowrap',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    height: '45px'
                                                                }}
                                                            >
                                                                {isValidatingCpf ? <Loader2 className="animate-spin" size={16} /> : 'Validar'}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}


                                        {selectedRoles.includes(3) && (
                                            <div className={styles.creciContainer}>
                                                <h4 style={{ margin: 0, fontSize: '1rem', color: '#1e293b' }}>Dados de Inscrição do CRECI</h4>
                                                <div className={styles.grid}>
                                                    <div className={styles.formGroup}>
                                                        <label className={styles.label}>Número de Registro</label>
                                                        <input 
                                                            type="text" 
                                                            value={creciNumero} 
                                                            onChange={e => setCreciNumero(e.target.value)}
                                                            placeholder="Ex: 12345"
                                                            className={creciDocumentUrl ? styles.inputDisabled : styles.input} 
                                                            disabled={!!creciDocumentUrl}
                                                        />
                                                    </div>

                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        <div className={styles.formGroup} style={{ flex: 1 }}>
                                                            <label className={styles.label}>UF</label>
                                                            <select
                                                                value={creciApoestadoId}
                                                                onChange={e => setCreciApoestadoId(e.target.value ? Number(e.target.value) : '')}
                                                                className={creciDocumentUrl ? styles.inputDisabled : styles.input}
                                                                disabled={!!creciDocumentUrl}
                                                            >
                                                                <option value="">Selecione</option>
                                                                {estados.map(est => (
                                                                    <option key={est.id} value={est.id}>{est.sigla}</option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        <div className={styles.formGroup} style={{ flex: 1 }}>
                                                            <label className={styles.label}>Tipo</label>
                                                            <select
                                                                value={creciTipo}
                                                                onChange={e => setCreciTipo(e.target.value)}
                                                                className={creciDocumentUrl ? styles.inputDisabled : styles.input}
                                                                disabled={!!creciDocumentUrl}
                                                            >
                                                                <option value="Física">Física (F)</option>
                                                                <option value="Jurídica">Jurídica (J)</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className={styles.formGroup}>
                                                    <label className={styles.label}>Comprovante do CRECI (Obrigatório)</label>
                                                    {creciDocumentUrl ? (
                                                        <div className={styles.creciDocBox}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <FileText size={20} color="#7F34E6" />
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Documento Homologado</span>
                                                                    <a href={creciDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#7F34E6', textDecoration: 'underline' }}>
                                                                        Ver arquivo enviado
                                                                    </a>
                                                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: creciStatus ? '#10b981' : '#64748b' }}>
                                                                        {creciStatus ? '✅ Homologado' : '⏳ Em análise'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <label className={styles.uploadLabel}>
                                                            {isUploadingDoc ? (
                                                                <Loader2 className="animate-spin" size={24} style={{ color: '#7F34E6' }} />
                                                            ) : (
                                                                <>
                                                                    <Upload size={24} style={{ color: '#7F34E6', marginBottom: '8px' }} />
                                                                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#7F34E6' }}>Clique para enviar (PDF/Imagem)</span>
                                                                </>
                                                            )}
                                                            <input type="file" accept="application/pdf,image/*" onChange={handleUploadDocument} style={{ display: 'none' }} />
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <h3 className={styles.sectionTitle}>Contato</h3>
                                        <p className={styles.sectionSubtitle}>Para comunicações internas e ofertas.</p>

                                        <div className={styles.grid}>
                                            <div className={styles.formGroup}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <label className={styles.label}>E-mail</label>
                                                    {user?.email_verified ? (
                                                        <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>✅ Verificado</span>
                                                    ) : (
                                                        <span style={{ fontSize: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>⚠️ Não Verificado</span>
                                                    )}
                                                </div>
                                                <input type="email" value={email} className={styles.inputDisabled} disabled />
                                            </div>

                                            <div className={styles.formGroup}>
                                                <label className={styles.label}>Telefone</label>
                                                <div className={styles.phoneInputWrapper}>
                                                    <select value={countryCode} onChange={e => setCountryCode(e.target.value)} className={styles.countrySelect}>
                                                        <option value="55">🇧🇷 +55</option>
                                                        <option value="1">🇺🇸 +1</option>
                                                        <option value="351">🇵🇹 +351</option>
                                                        <option value="34">🇪🇸 +34</option>
                                                    </select>
                                                    <input 
                                                        type="text" 
                                                        value={phone} 
                                                        onChange={e => setPhone(maskPhone(e.target.value))} 
                                                        placeholder="(81) 99999-9999"
                                                        className={styles.input} 
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button className={styles.saveButton} onClick={handleSaveDados} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : null}
                                            <span>Salvar Alterações</span>
                                        </button>

                                        {message && (
                                            <div className={`${styles.message} ${styles[message.type]}`}>
                                                {message.text}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'senha' && (
                                    <div>
                                        <h2 className={styles.title}>Mudar senha</h2>
                                        <p className={styles.sectionSubtitle} style={{ marginBottom: '32px' }}>Garanta a segurança da sua conta trocando a sua senha periodicamente.</p>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Senha Atual</label>
                                            <input 
                                                type="password" 
                                                value={currentPassword} 
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                placeholder="Digite sua senha atual" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Nova Senha</label>
                                            <input 
                                                type="password" 
                                                value={newPassword} 
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Crie uma nova senha de segurança" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Confirmar Nova Senha</label>
                                            <input 
                                                type="password" 
                                                value={confirmNewPassword} 
                                                onChange={e => setConfirmNewPassword(e.target.value)}
                                                placeholder="Repita a nova senha criada" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <button className={styles.saveButton} onClick={handleSavePassword} disabled={isSavingPassword}>
                                            {isSavingPassword ? <Loader2 className="animate-spin" size={18} /> : null}
                                            <span>Atualizar Senha</span>
                                        </button>

                                        {passwordMessage && (
                                            <div className={`${styles.message} ${styles[passwordMessage.type]}`}>
                                                {passwordMessage.text}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'email' && (
                                    <div>
                                        <h2 className={styles.title}>Mudar e-mail</h2>
                                        <p className={styles.sectionSubtitle} style={{ marginBottom: '32px' }}>Atenção: Ao alterar seu e-mail, sua conta precisará ser reativada via link enviado ao novo endereço.</p>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>E-mail Atual</label>
                                            <input type="email" value={user.email} className={styles.inputDisabled} disabled />
                                        </div>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Novo Endereço de E-mail</label>
                                            <input 
                                                type="email" 
                                                value={newEmail} 
                                                onChange={e => setNewEmail(e.target.value)}
                                                placeholder="novoemail@provedor.com" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Confirmar Novo Endereço de E-mail</label>
                                            <input 
                                                type="email" 
                                                value={confirmNewEmail} 
                                                onChange={e => setConfirmNewEmail(e.target.value)}
                                                placeholder="Repita o novo e-mail informado" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <button className={styles.saveButton} onClick={handleSaveEmail} disabled={isSavingEmail}>
                                            {isSavingEmail ? <Loader2 className="animate-spin" size={18} /> : null}
                                            <span>Confirmar Alteração de E-mail</span>
                                        </button>

                                        {emailMessage && (
                                            <div className={`${styles.message} ${styles[emailMessage.type]}`}>
                                                {emailMessage.text}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'deletar' && (
                                    <div>
                                        <h2 className={styles.title} style={{ color: '#ef4444' }}>Eliminar conta</h2>
                                        <p className={styles.sectionSubtitle} style={{ marginBottom: '32px' }}>
                                            Cuidado! Essa ação é permanente. Todos os seus imóveis, leads, favoritos e dados pessoais serão excluídos sem possibilidade de recuperação.
                                        </p>

                                        <div className={styles.formGroup} style={{ maxWidth: '450px' }}>
                                            <label className={styles.label}>Digite sua senha para confirmar</label>
                                            <input 
                                                type="password" 
                                                value={deletePassword} 
                                                onChange={e => setDeletePassword(e.target.value)}
                                                placeholder="Confirme sua senha de acesso" 
                                                className={styles.input} 
                                            />
                                        </div>

                                        <button className={styles.saveButton} onClick={handleDeleteAccount} disabled={isDeleting} style={{ backgroundColor: '#ef4444', boxShadow: '0 4px 12px rgba(239,68,68,0.25)' }}>
                                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : null}
                                            <span>Excluir minha conta definitivamente</span>
                                        </button>

                                        {deleteMessage && (
                                            <div className={`${styles.message} ${styles[deleteMessage.type]}`}>
                                                {deleteMessage.text}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </section>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
