'use client'

import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Building2, MapPin, CheckCircle, Loader2, Square } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './empreendimento.module.css';
import { maskCep } from '@/lib/format';
import { fire } from '@/lib/swal';

interface LocationItem {
    id: number;
    nome: string;
}

export default function IncluirEmpreendimentoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [createdId, setCreatedId] = useState<number | null>(null);
    const isCepSearching = useRef(false);

    // Form state
    const [descricao, setDescricao] = useState('');
    const [cep, setCep] = useState('');
    const [estadoId, setEstadoId] = useState<number | ''>('');
    const [cidadeId, setCidadeId] = useState<number | ''>('');
    const [bairroId, setBairroId] = useState<number | ''>('');
    const [paisId] = useState<number>(1); // Default Brasil
    const [possuiCarac, setPossuiCarac] = useState(false);

    // Locations state
    const [estados, setEstados] = useState<LocationItem[]>([]);
    const [cidades, setCidades] = useState<LocationItem[]>([]);
    const [bairros, setBairros] = useState<LocationItem[]>([]);

    useEffect(() => {
        fetch('/api/property/estados')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setEstados(data);
                } else {
                    console.error("API did not return an array for estados:", data);
                    setEstados([]);
                }
            })
            .catch(err => console.error("Erro ao carregar estados:", err));
    }, []);

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
        console.log(`[DEBUG CEP] cleanCep: "${cleanCep}"`);
        if (cleanCep.length === 8) {
            setLoading(true);
            isCepSearching.current = true;
            console.log(`[DEBUG CEP] Triggering ViaCEP fetch for: ${cleanCep}`);
            fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
                .then(res => res.json())
                .then(async data => {
                    console.log(`[DEBUG CEP] ViaCEP response data:`, data);
                    if (data.erro) throw new Error("CEP não encontrado");
                    
                    // 1. Auto-select State
                    const ufViaCep = data.uf.toUpperCase();
                    const estadoEncontrado = estados.find(e => 
                        e.nome.toUpperCase() === ufViaCep || 
                        (e as any).sigla?.toUpperCase() === ufViaCep
                    );
                    
                    const resolvedEstadoId = estadoEncontrado ? estadoEncontrado.id : '';
                    console.log(`[DEBUG CEP] Resolved Estado ID: ${resolvedEstadoId} (${estadoEncontrado?.nome})`);
                    
                    if (resolvedEstadoId) {
                        setEstadoId(resolvedEstadoId);
                        
                        // Fetch cities for this state to find the city
                        try {
                            console.log(`[DEBUG CEP] Fetching cities for estado_id: ${resolvedEstadoId}`);
                            const cidRes = await fetch(`/api/property/cidades?estado_id=${resolvedEstadoId}`);
                            const cidData = await cidRes.json();
                            if (Array.isArray(cidData)) {
                                setCidades(cidData);
                                const cidadeViaCep = data.localidade.toUpperCase();
                                // Clean up accents for better matching
                                const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
                                
                                const cidadeEncontrada = cidData.find(c => normalize(c.nome) === normalize(cidadeViaCep));
                                let resolvedCidadeId = cidadeEncontrada ? cidadeEncontrada.id : '';
                                console.log(`[DEBUG CEP] Resolved Cidade ID: ${resolvedCidadeId} (${cidadeEncontrada?.nome})`);
                                
                                // Auto-register City if not found
                                if (!resolvedCidadeId && data.localidade) {
                                    console.log(`[DEBUG CEP] City not found. Auto-registering: ${data.localidade}`);
                                    const createCid = await fetch('/api/property/cidades', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ descricao: data.localidade, estado_id: resolvedEstadoId })
                                    });
                                    if (createCid.ok) {
                                        const newCid = await createCid.json();
                                        resolvedCidadeId = Number(newCid.id);
                                        console.log(`[DEBUG CEP] Auto-registered City ID: ${resolvedCidadeId}`);
 
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
                                        console.error(`[DEBUG CEP] Failed to register city:`, createCid.status);
                                    }
                                }
                                
                                if (resolvedCidadeId) {
                                    setCidadeId(resolvedCidadeId);
                                    
                                    // Fetch neighborhoods for this city to find the neighborhood
                                    console.log(`[DEBUG CEP] Fetching neighborhoods for cidade_id: ${resolvedCidadeId}`);
                                    const baiRes = await fetch(`/api/property/bairros?cidade_id=${resolvedCidadeId}`);
                                    const baiData = await baiRes.json();
                                    if (Array.isArray(baiData)) {
                                        setBairros(baiData);
                                        const bairroViaCep = (data.bairro || '').toUpperCase();
                                        const bairroEncontrado = baiData.find(b => normalize(b.nome) === normalize(bairroViaCep));
                                        let resolvedBairroId = bairroEncontrado ? bairroEncontrado.id : '';
                                        console.log(`[DEBUG CEP] Resolved Bairro ID: ${resolvedBairroId} (${bairroEncontrado?.nome})`);
                                        
                                        // Auto-register Neighborhood if not found
                                        if (!resolvedBairroId && data.bairro) {
                                            console.log(`[DEBUG CEP] Bairro not found. Auto-registering: ${data.bairro}`);
                                            const createBai = await fetch('/api/property/bairros', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ descricao: data.bairro, cidade_id: resolvedCidadeId, estado_id: resolvedEstadoId })
                                            });
                                            if (createBai.ok) {
                                                const newBai = await createBai.json();
                                                resolvedBairroId = Number(newBai.id);
                                                console.log(`[DEBUG CEP] Auto-registered Bairro ID: ${resolvedBairroId}`);
 
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
                                                console.error(`[DEBUG CEP] Failed to register neighborhood:`, createBai.status);
                                            }
                                        }
                                        
                                        if (resolvedBairroId) {
                                            setBairroId(resolvedBairroId);
                                        }
                                    }
                                }
                            }
                        } catch (err) {
                            console.error("[DEBUG CEP] Erro no auto-preenchimento das cidades/bairros:", err);
                        }
                    }
                })
                .catch(err => {
                    console.error("[DEBUG CEP] Erro na busca do CEP:", err);
                })
                .finally(() => {
                    setLoading(false);
                    // Give a small delay to ensure React state updates finish before removing the lock
                    setTimeout(() => { isCepSearching.current = false; }, 500);
                });
        } else {
            isCepSearching.current = false;
        }
    }, [cep, estados]);;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/property/empreendimentos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao,
                    cep: cep.replace(/\D/g, ''),
                    estado_id: estadoId,
                    cidade_id: cidadeId,
                    bairro_id: bairroId,
                    pais_id: paisId,
                    possui_carac: possuiCarac
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao cadastrar empreendimento');
            }

            const data = await res.json();
            if (data.id) {
                setCreatedId(Number(data.id));
            }
            setSuccess(true);
        } catch (error: any) {
            console.error("Submit error:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <>

                <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <Link href={createdId ? `/meus-imoveis?mode=empreendimentos&empId=${createdId}` : "/meus-imoveis?mode=empreendimentos"} className={styles.backBtn}>
                        <ArrowLeft size={20} />
                        Voltar
                    </Link>
                    <div className={styles.logoIcon}>
                        <Building2 size={24} color="#ffffff" />
                    </div>
                    <h1 className={styles.sidebarTitle}>
                        Cadastro de<br />Empreendimento
                    </h1>
                </aside>
                <main className={styles.mainContent}>
                    <div className={styles.successContainer}>
                        <div className={styles.successIcon}>
                            <CheckCircle size={40} />
                        </div>
                        <h2 className={styles.successTitle}>Empreendimento Cadastrado!</h2>
                        <p className={styles.successText}>
                            O empreendimento <strong>{descricao}</strong> foi adicionado com sucesso ao sistema e já pode ser vinculado a novos imóveis.
                        </p>
                        <div className={styles.successButtons}>
                            <button 
                                className={styles.btnPrimary} 
                                onClick={() => {
                                    setSuccess(false);
                                    setDescricao('');
                                    setCep('');
                                    setEstadoId('');
                                    setCidadeId('');
                                    setBairroId('');
                                    setPossuiCarac(false);
                                }}
                            >
                                Cadastrar Outro
                            </button>
                            <Link href={createdId ? `/meus-imoveis?mode=empreendimentos&empId=${createdId}` : "/meus-imoveis?mode=empreendimentos"} className={styles.btnSecondary}>
                                Ir para Empreendimentos
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
                <Link href="/meus-imoveis?mode=empreendimentos" className={styles.backBtn}>
                    <ArrowLeft size={20} />
                    Voltar
                </Link>
                <div className={styles.logoIcon}>
                    <Square size={60} strokeWidth={2.5} color="#ffffff" />
                </div>
                <h1 className={styles.sidebarTitle}>
                    Cadastro de<br />Empreendimento
                </h1>
            </aside>

            <main className={styles.mainContent}>
                <div className={styles.formContainer}>
                    <div className={styles.formHeader}>
                        <h2 className={styles.formTitle}>Novo Empreendimento</h2>
                        <p className={styles.formSubtitle}>Preencha os dados básicos para registrar um novo projeto no sistema.</p>
                    </div>

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
                                name="cep_novo_empreendimento"
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

                        <div className={styles.formGroup} style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
                            <label className={styles.checkboxCard}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={possuiCarac}
                                    onChange={(e) => setPossuiCarac(e.target.checked)}
                                />
                                <span>Habilitar características do empreendimento</span>
                            </label>
                        </div>

                        <button 
                            type="submit" 
                            className={styles.btnPrimary}
                            disabled={!descricao || !estadoId || !cidadeId || !bairroId || loading}
                        >
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Empreendimento'}
                        </button>
                    </form>
                </div>
            </main>
            </div>
        </>
    );
}
