'use client'

import React, { useEffect, useState } from 'react';
import { X, Loader2, Award, Home, FileText } from 'lucide-react';
import styles from './profileModal.module.css'; // Reuse profile modal styles for consistency

interface User {
    id: number;
    name: string;
    social_name?: string;
    email: string;
    roles?: Array<{ id: number; nome: string }>;
    creci_numero?: string;
    creci_apoestado_id?: number;
    creci_tipo?: string;
    creci_status?: boolean;
    creci_document_url?: string;
    cpf_cnpj?: string;
    data_nascimento?: string;
}

interface AnunciarModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onSuccess: () => void;
}

export default function AnunciarModal({ isOpen, onClose, user, onSuccess }: AnunciarModalProps) {
    const [selectedRoles, setSelectedRoles] = useState<number[]>([2]);

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
    const [cpfCnpj, setCpfCnpj] = useState('');
    const [dataNascimento, setDataNascimento] = useState('');
    const [creciNumero, setCreciNumero] = useState('');
    const [creciApoestadoId, setCreciApoestadoId] = useState<number | ''>('');
    const [creciTipo, setCreciTipo] = useState('Física');
    const [creciDocumentUrl, setCreciDocumentUrl] = useState('');
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const [estados, setEstados] = useState<Array<{ id: number; nome: string; sigla: string }>>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

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

    useEffect(() => {
        if (isOpen) {
            fetchEstados();
            if (user) {
                setCpfCnpj(maskCpfCnpj(user.cpf_cnpj || ''));
                if (user.data_nascimento) {
                    setDataNascimento(new Date(user.data_nascimento).toISOString().split('T')[0]);
                }
                setCreciNumero(user.creci_numero || '');
                setCreciApoestadoId(user.creci_apoestado_id || '');
                setCreciTipo(user.creci_tipo || 'Física');
                setCreciDocumentUrl(user.creci_document_url || '');
            }
        }
    }, [isOpen, user]);

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

    const handleSave = async () => {
        if (!cpfCnpj) {
            setMessage({ type: 'error', text: (selectedRoles.includes(2) && !selectedRoles.includes(3)) ? 'O CPF ou CNPJ é obrigatório.' : 'O CPF é obrigatório.' });
            return;
        }
        if (!dataNascimento) {
            setMessage({ type: 'error', text: 'A data de nascimento é obrigatória.' });
            return;
        }

        if (selectedRoles.includes(3)) {
            if (!creciNumero) {
                setMessage({ type: 'error', text: 'O número do CRECI é obrigatório.' });
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
                setMessage({ type: 'error', text: 'O upload do comprovante do CRECI é obrigatório.' });
                return;
            }
        }

        setIsSaving(true);
        setMessage(null);

        try {
            // Validate CPF mathematically & name match if upgrading to Proprietário or Corretor
            const validateRes = await fetch('/api/user/validate-cpf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf: cpfCnpj, fullName: user?.name || '', birthDate: dataNascimento })
            });
            const validateData = await validateRes.json();
            if (!validateRes.ok || !validateData.success) {
                setMessage({ type: 'error', text: validateData.error || 'Validação de CPF/CNPJ falhou na base da Receita.' });
                setIsSaving(false);
                return;
            }

            const isCnpj = cpfCnpj.replace(/\D/g, '').length === 14;
            const birthDateToSave = isCnpj ? (validateData.data_nascimento || dataNascimento) : dataNascimento;

            const res = await fetch('/api/user/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    social_name: user?.social_name || user?.name || '',
                    email: user?.email || '',
                    roles: selectedRoles,
                    creci_numero: selectedRoles.includes(3) ? creciNumero : null,
                    creci_apoestado_id: selectedRoles.includes(3) ? Number(creciApoestadoId) : null,
                    creci_tipo: selectedRoles.includes(3) ? creciTipo : null,
                    cpf_cnpj: cpfCnpj,
                    data_nascimento: birthDateToSave
                })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setMessage({ type: 'success', text: 'Perfil de anunciante ativado com sucesso!' });
                setTimeout(() => {
                    onSuccess();
                    onClose();
                }, 1500);
            } else {
                setMessage({ type: 'error', text: data.error || 'Erro ao salvar perfil.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Erro de conexão.' });
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Quero Anunciar Imóveis</h2>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                        <X size={24} />
                    </button>
                </div>

                <div className={styles.content}>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '1.25rem', textAlign: 'center' }}>
                        Escolha como deseja anunciar os seus imóveis na plataforma:
                    </p>

                    <div className={styles.formGroup}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                            <button
                                type="button"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: selectedRoles.includes(2) ? '2px solid #7F34E6' : '1px solid #e2e8f0',
                                    backgroundColor: selectedRoles.includes(2) ? 'rgba(127, 52, 230, 0.05)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: selectedRoles.includes(2) ? '#7F34E6' : '#475569',
                                    fontWeight: 600
                                }}
                                onClick={() => handleRoleToggle(2)}
                            >
                                <Home size={28} />
                                <span>Proprietário(a)</span>
                            </button>
                            
                            <button
                                type="button"
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: selectedRoles.includes(3) ? '2px solid #7F34E6' : '1px solid #e2e8f0',
                                    backgroundColor: selectedRoles.includes(3) ? 'rgba(127, 52, 230, 0.05)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    color: selectedRoles.includes(3) ? '#7F34E6' : '#475569',
                                    fontWeight: 600
                                }}
                                onClick={() => handleRoleToggle(3)}
                            >
                                <Award size={28} />
                                <span>Corretor(a)</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
                        <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                            <label className={styles.label}>{(selectedRoles.includes(2) && !selectedRoles.includes(3)) ? "CPF ou CNPJ" : "CPF"}</label>
                            <input
                                type="text"
                                value={cpfCnpj}
                                onChange={(e) => setCpfCnpj(maskCpfCnpj(e.target.value))}
                                placeholder={(selectedRoles.includes(2) && !selectedRoles.includes(3)) ? "Digite CPF ou CNPJ" : "Digite seu CPF"}
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                            <label className={styles.label}>Data de Nascimento / Abertura</label>
                            <input
                                type="date"
                                value={dataNascimento}
                                onChange={(e) => setDataNascimento(e.target.value)}
                                className={styles.input}
                                style={{ height: '45px' }}
                                max="9999-12-31"
                            />
                        </div>
                    </div>

                    {selectedRoles.includes(3) && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '1.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#475569' }}>Dados do CRECI</h4>
                            
                            <div className={styles.formGroup} style={{ marginBottom: '0.25rem' }}>
                                <label className={styles.label}>Número do CRECI</label>
                                <input
                                    type="text"
                                    value={creciNumero}
                                    onChange={(e) => setCreciNumero(e.target.value)}
                                    placeholder="Número do registro (ex: 12345)"
                                    className={styles.input}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                <div className={styles.formGroup} style={{ flex: 1, marginBottom: 0 }}>
                                    <label className={styles.label}>UF de Registro</label>
                                    <select
                                        value={creciApoestadoId}
                                        onChange={(e) => setCreciApoestadoId(e.target.value ? Number(e.target.value) : '')}
                                        className={styles.input}
                                        style={{ height: '45px', padding: '0 0.75rem', backgroundColor: 'white' }}
                                    >
                                        <option value="">UF</option>
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
                                        className={styles.input}
                                        style={{ height: '45px', padding: '0 0.75rem', backgroundColor: 'white' }}
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
                                            <FileText size={20} color="#7F34E6" />
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>Documento Enviado</span>
                                                <a href={creciDocumentUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#7F34E6', textDecoration: 'underline' }}>
                                                    Ver arquivo enviado
                                                </a>
                                            </div>
                                        </div>
                                        <button type="button" onClick={() => setCreciDocumentUrl('')} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>Excluir</button>
                                    </div>
                                ) : (
                                    <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.25rem', border: '2px dashed #cbd5e1', borderRadius: '8px', cursor: 'pointer', backgroundColor: 'white' }}>
                                        {isUploadingDoc ? (
                                            <>
                                                <Loader2 className="animate-spin" size={24} style={{ color: '#7F34E6' }} />
                                                <span style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.5rem' }}>Enviando arquivo...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '1.5rem' }}>📄</span>
                                                <span style={{ fontSize: '0.85rem', color: '#7F34E6', fontWeight: 600, marginTop: '0.25rem' }}>Enviar Comprovante (PDF/Imagem)</span>
                                            </>
                                        )}
                                        <input type="file" accept="application/pdf,image/*" onChange={handleUploadDocument} style={{ display: 'none' }} />
                                    </label>
                                )}
                            </div>
                        </div>
                    )}

                    <button
                        className={styles.saveProfileButton}
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ marginTop: '0.5rem' }}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Ativando Perfil...</span>
                            </>
                        ) : (
                            'Salvar e Começar a Anunciar'
                        )}
                    </button>

                    {message && (
                        <div className={`${styles.message} ${styles[message.type]}`} style={{ marginTop: '1rem' }}>
                            {message.text}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
