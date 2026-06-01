'use client'

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, CheckCircle, Loader2, Square } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PhotoManager = dynamic(() => import('@/components/PhotoManager'), { 
    ssr: false,
    loading: () => (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '5rem', gap: '1rem' }}>
            <Loader2 className="animate-spin text-blue-600" size={40} />
        </div>
    )
});
import styles from '@/app/meus-imoveis/empreendimentos/incluir/empreendimento.module.css';
import { maskCep } from '@/lib/format';
import Swal from 'sweetalert2';

interface LocationItem {
    id: number;
    nome: string;
}

export default function EditarEmpreendimentoPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id;

    const [loading, setLoading] = useState(true);
    const [success, setSuccess] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const isCepSearching = useRef(false);
    const isInitialLoad = useRef(true);

    // Form state
    const [descricao, setDescricao] = useState('');
    const [cep, setCep] = useState('');
    const [estadoId, setEstadoId] = useState<number | ''>('');
    const [cidadeId, setCidadeId] = useState<number | ''>('');
    const [bairroId, setBairroId] = useState<number | ''>('');
    const [paisId] = useState<number>(1); // Default Brasil

    // Locations state
    const [estados, setEstados] = useState<LocationItem[]>([]);
    const [cidades, setCidades] = useState<LocationItem[]>([]);
    const [bairros, setBairros] = useState<LocationItem[]>([]);

    // 1. Fetch States on mount
    useEffect(() => {
        fetch('/api/property/estados')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEstados(data);
                } else {
                    setEstados([]);
                }
            })
            .catch(err => console.error("Erro ao carregar estados:", err));
    }, []);

    // 2. Fetch development details and pre-populate
    useEffect(() => {
        if (id) {
            setLoading(true);
            isInitialLoad.current = true;
            fetch(`/api/property/empreendimentos/${id}`)
                .then(res => res.json())
                .then(async data => {
                    if (data.success && data.empreendimento) {
                        const emp = data.empreendimento;
                        setDescricao(emp.descricao || '');
                        setCep(emp.cep ? maskCep(emp.cep) : '');

                        // Load cities for the selected state
                        if (emp.estado_id) {
                            const cidRes = await fetch(`/api/property/cidades?estado_id=${emp.estado_id}`);
                            const cidData = await cidRes.json();
                            setCidades(cidData);
                        }

                        // Load bairros for the selected city
                        if (emp.cidade_id) {
                            const baiRes = await fetch(`/api/property/bairros?cidade_id=${emp.cidade_id}`);
                            const baiData = await baiRes.json();
                            setBairros(baiData);
                        }

                        // Set the IDs
                        setEstadoId(emp.estado_id || '');
                        setCidadeId(emp.cidade_id || '');
                        setBairroId(emp.bairro_id || '');

                        // Delay removing initial load flag to let render loops finish
                        setTimeout(() => {
                            isInitialLoad.current = false;
                        }, 500);
                    } else {
                        Swal.fire({
                            title: 'Erro!',
                            text: data.error || 'Empreendimento não encontrado.',
                            icon: 'error'
                        });
                        router.push('/meus-imoveis');
                    }
                })
                .catch(err => {
                    console.error("Error loading development details:", err);
                    Swal.fire({
                        title: 'Erro!',
                        text: 'Erro ao carregar dados do empreendimento.',
                        icon: 'error'
                    });
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [id, router]);

    const handleEstadoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const numVal = val ? Number(val) : '';
        setEstadoId(numVal);
        setCidadeId('');
        setBairroId('');
        if (numVal) {
            fetch(`/api/property/cidades?estado_id=${numVal}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setCidades(data);
                    } else {
                        setCidades([]);
                    }
                })
                .catch(err => {
                    console.error("Erro ao carregar cidades:", err);
                    setCidades([]);
                });
        } else {
            setCidades([]);
            setBairros([]);
        }
    };

    const handleCidadeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        const numVal = val ? Number(val) : '';
        setCidadeId(numVal);
        setBairroId('');
        if (numVal) {
            fetch(`/api/property/bairros?cidade_id=${numVal}`)
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data)) {
                        setBairros(data);
                    } else {
                        setBairros([]);
                    }
                })
                .catch(err => {
                    console.error("Erro ao carregar bairros:", err);
                    setBairros([]);
                });
        } else {
            setBairros([]);
        }
    };
    // CEP Auto-completion logic
    useEffect(() => {
        const cleanCep = cep.replace(/\D/g, '');
        console.log(`[DEBUG CEP EDIT] cleanCep: "${cleanCep}", isInitialLoad: ${isInitialLoad.current}`);
        if (cleanCep.length === 8 && !isInitialLoad.current) {
            setLoading(true);
            isCepSearching.current = true;
            console.log(`[DEBUG CEP EDIT] Triggering ViaCEP fetch for: ${cleanCep}`);
            fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                .then(res => res.json())
                .then(async data => {
                    console.log(`[DEBUG CEP EDIT] ViaCEP response data:`, data);
                    if (data.erro) throw new Error("CEP não encontrado");
                    
                    const ufViaCep = data.uf.toUpperCase();
                    const estadoEncontrado = estados.find(e => 
                        e.nome.toUpperCase() === ufViaCep || 
                        (e as any).sigla?.toUpperCase() === ufViaCep
                    );
                    
                    const resolvedEstadoId = estadoEncontrado ? estadoEncontrado.id : '';
                    console.log(`[DEBUG CEP EDIT] Resolved Estado ID: ${resolvedEstadoId} (${estadoEncontrado?.nome})`);
                    
                    if (resolvedEstadoId) {
                        setEstadoId(resolvedEstadoId);
                        
                        try {
                            console.log(`[DEBUG CEP EDIT] Fetching cities for estado_id: ${resolvedEstadoId}`);
                            const cidRes = await fetch(`/api/property/cidades?estado_id=${resolvedEstadoId}`);
                            const cidData = await cidRes.json();
                            if (Array.isArray(cidData)) {
                                setCidades(cidData);
                                const cidadeViaCep = data.localidade.toUpperCase();
                                const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                                
                                const cidadeEncontrada = cidData.find(c => normalize(c.nome) === normalize(cidadeViaCep));
                                let resolvedCidadeId = cidadeEncontrada ? cidadeEncontrada.id : '';
                                console.log(`[DEBUG CEP EDIT] Resolved Cidade ID: ${resolvedCidadeId} (${cidadeEncontrada?.nome})`);
                                
                                // Auto-register City if not found
                                if (!resolvedCidadeId && data.localidade) {
                                    console.log(`[DEBUG CEP EDIT] City not found. Auto-registering: ${data.localidade}`);
                                    const createCid = await fetch('/api/property/cidades', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ descricao: data.localidade, estado_id: resolvedEstadoId })
                                    });
                                    if (createCid.ok) {
                                        const newCid = await createCid.json();
                                        resolvedCidadeId = Number(newCid.id);
                                        console.log(`[DEBUG CEP EDIT] Auto-registered City ID: ${resolvedCidadeId}`);
 
                                        // Instantly append to cities list to prevent dropdown reset
                                        const newCityOption = { id: resolvedCidadeId, nome: data.localidade.toUpperCase().trim() };
                                        setCidades(prev => {
                                            const exists = prev.some(c => c.id === resolvedCidadeId);
                                            if (exists) return prev;
                                            return [...prev, newCityOption].sort((a, b) => a.nome.localeCompare(b.nome));
                                        });
 
                                        const newCidRes = await fetch(`/api/property/cidades?estado_id=${resolvedEstadoId}`);
                                        setCidades(await newCidRes.json());
                                    } else {
                                        console.error(`[DEBUG CEP EDIT] Failed to register city:`, createCid.status);
                                    }
                                }
                                
                                if (resolvedCidadeId) {
                                    setCidadeId(resolvedCidadeId);
                                    
                                    console.log(`[DEBUG CEP EDIT] Fetching neighborhoods for cidade_id: ${resolvedCidadeId}`);
                                    const baiRes = await fetch(`/api/property/bairros?cidade_id=${resolvedCidadeId}`);
                                    const baiData = await baiRes.json();
                                    if (Array.isArray(baiData)) {
                                        setBairros(baiData);
                                        const bairroViaCep = (data.bairro || '').toUpperCase();
                                        const bairroEncontrado = baiData.find(b => normalize(b.nome) === normalize(bairroViaCep));
                                        let resolvedBairroId = bairroEncontrado ? bairroEncontrado.id : '';
                                        console.log(`[DEBUG CEP EDIT] Resolved Bairro ID: ${resolvedBairroId} (${bairroEncontrado?.nome})`);
                                        
                                        // Auto-register Neighborhood if not found
                                        if (!resolvedBairroId && data.bairro) {
                                            console.log(`[DEBUG CEP EDIT] Bairro not found. Auto-registering: ${data.bairro}`);
                                            const createBai = await fetch('/api/property/bairros', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ descricao: data.bairro, cidade_id: resolvedCidadeId, estado_id: resolvedEstadoId })
                                            });
                                            if (createBai.ok) {
                                                const newBai = await createBai.json();
                                                resolvedBairroId = Number(newBai.id);
                                                console.log(`[DEBUG CEP EDIT] Auto-registered Bairro ID: ${resolvedBairroId}`);
 
                                                // Instantly append to neighborhoods list to prevent dropdown reset
                                                const newBairroOption = { id: resolvedBairroId, nome: data.bairro.toUpperCase().trim() };
                                                setBairros(prev => {
                                                    const exists = prev.some(b => b.id === resolvedBairroId);
                                                    if (exists) return prev;
                                                    return [...prev, newBairroOption].sort((a, b) => a.nome.localeCompare(b.nome));
                                                });
 
                                                const newBaiRes = await fetch(`/api/property/bairros?cidade_id=${resolvedCidadeId}`);
                                                setBairros(await newBaiRes.json());
                                            } else {
                                                console.error(`[DEBUG CEP EDIT] Failed to register neighborhood:`, createBai.status);
                                            }
                                        }
                                        
                                        if (resolvedBairroId) {
                                            setBairroId(resolvedBairroId);
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("[DEBUG CEP EDIT] Erro no auto-preenchimento das cidades/bairros:", err);
                        }
                    }
                })
                .catch(err => {
                    console.error("[DEBUG CEP EDIT] Erro na busca do CEP:", err);
                })
                .finally(() => {
                    setLoading(false);
                    setTimeout(() => { isCepSearching.current = false; }, 500);
                });
        } else {
            isCepSearching.current = false;
        }
    }, [cep, estados]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/property/empreendimentos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao,
                    cep: cep.replace(/\D/g, ''),
                    estado_id: estadoId,
                    cidade_id: cidadeId,
                    bairro_id: bairroId,
                    pais_id: paisId
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao salvar empreendimento');
            }

            setSuccess(true);
        } catch (error: any) {
            console.error("Submit error:", error);
            Swal.fire({
                title: 'Erro!',
                text: error.message,
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>
                <div className={styles.container}>
                    <aside className={styles.sidebar}>
                        <Link href={`/meus-imoveis?mode=empreendimentos&empId=${id}`} className={styles.backBtn}>
                            <ArrowLeft size={20} />
                            Voltar para Empreendimentos
                        </Link>
                        <div className={styles.logoIcon}>
                            <Building2 size={24} color="#ffffff" />
                        </div>
                        <h1 className={styles.sidebarTitle}>
                            Edição de<br />Empreendimento
                        </h1>
                    </aside>
                    <main className={styles.mainContent}>
                        <div className={styles.successContainer}>
                            <div className={styles.successIcon}>
                                <CheckCircle size={40} />
                            </div>
                            <h2 className={styles.successTitle}>Empreendimento Atualizado!</h2>
                            <p className={styles.successText}>
                                O empreendimento <strong>{descricao}</strong> foi atualizado com sucesso no sistema.
                            </p>
                            <div className={styles.successButtons}>
                                <Link href={`/meus-imoveis?mode=empreendimentos&empId=${id}`} className={styles.btnPrimary}>
                                    Voltar para Empreendimentos
                                </Link>
                            </div>
                        </div>
                    </main>
                </div>
            </>
        );
    }

    return (
        <>
            <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <Link href={`/meus-imoveis?mode=empreendimentos&empId=${id}`} className={styles.backBtn}>
                        <ArrowLeft size={20} />
                        Voltar
                    </Link>
                    <div className={styles.logoIcon}>
                        <Square size={60} strokeWidth={2.5} color="#ffffff" />
                    </div>
                    <h1 className={styles.sidebarTitle}>
                        Edição de<br />Empreendimento
                    </h1>
                </aside>

                <main className={styles.mainContent}>
                    <div className={styles.formContainer}>
                        <div className={styles.formHeader}>
                            <h2 className={styles.formTitle}>Editar Empreendimento</h2>
                            <p className={styles.formSubtitle}>Atualize as informações do empreendimento.</p>
                        </div>

                        {loading && isInitialLoad.current ? (
                            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                                <Loader2 size={32} className="animate-spin" />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Nome do Empreendimento</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Ex: Edf. Solar da Praia"
                                        value={descricao}
                                        onChange={(e) => setDescricao(e.target.value)}
                                        required
                                        maxLength={120}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>CEP</label>
                                    <input
                                        type="text"
                                        className={styles.input}
                                        placeholder="Digite para auto-completar"
                                        value={cep}
                                        name="cep_editar_empreendimento"
                                        autoComplete="new-password"
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(/\D/g, '').substring(0, 8);
                                            setCep(maskCep(raw));
                                        }}
                                        maxLength={9}
                                    />
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Estado</label>
                                    <select
                                        className={styles.select}
                                        value={estadoId}
                                        onChange={handleEstadoChange}
                                        required
                                    >
                                        <option value="">Selecione o estado</option>
                                        {estados.map(est => (
                                            <option key={est.id} value={est.id}>{est.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Cidade</label>
                                    <select
                                        className={styles.select}
                                        value={cidadeId}
                                        onChange={handleCidadeChange}
                                        disabled={!estadoId}
                                        required
                                    >
                                        <option value="">{estadoId ? "Selecione a cidade" : "Selecione o estado primeiro"}</option>
                                        {cidades.map(cid => (
                                            <option key={cid.id} value={cid.id}>{cid.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Bairro</label>
                                    <select
                                        className={styles.select}
                                        value={bairroId}
                                        onChange={(e) => setBairroId(Number(e.target.value))}
                                        disabled={!cidadeId}
                                        required
                                    >
                                        <option value="">{cidadeId ? "Selecione o bairro" : "Selecione a cidade primeiro"}</option>
                                        {bairros.map(b => (
                                            <option key={b.id} value={b.id}>{b.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                <button 
                                    type="submit" 
                                    className={styles.btnPrimary}
                                    disabled={!descricao || !estadoId || !cidadeId || !bairroId || loading}
                                >
                                    {loading ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Alterações'}
                                </button>
                            </form>
                        )}
                    </div>

                    {!isInitialLoad.current && id && (
                        <div className={styles.formContainer} style={{ marginTop: '2rem' }}>
                            <div className={styles.formHeader} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                <div>
                                    <h2 className={styles.formTitle}>Fotos do Empreendimento</h2>
                                    <p className={styles.formSubtitle}>Gerencie as fotos da fachada e áreas comuns do empreendimento.</p>
                                </div>
                                <button
                                    type="button"
                                    className={isReordering ? styles.btnPrimary : styles.btnSecondary}
                                    style={{ padding: '8px 16px', fontSize: '0.875rem', borderRadius: '8px', cursor: 'pointer', margin: 0, width: 'auto' }}
                                    onClick={() => setIsReordering(!isReordering)}
                                >
                                    {isReordering ? "Concluir Reordenação" : "Reordenar Fotos"}
                                </button>
                            </div>
                            
                            <PhotoManager
                                imovelId={Number(id)}
                                initialPhotos={[]}
                                isReordering={isReordering}
                                apiPath={`/api/property/empreendimentos/${id}/photos`}
                            />
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
