'use client'
// Force Turbopack CSS rebuild trigger: 2

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import { ArrowLeft, Building2, CheckCircle, Loader2, Square, Sparkles } from 'lucide-react';
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
    const [possuiCarac, setPossuiCarac] = useState(false);
    const [carac, setCarac] = useState<Record<string, any>>({
        parque_aquatico: 0,
        salao_festas: 0,
        espaco_gourmet: 0,
        espaco_zen: 0,
        coworking: 0,
        piquenique: 0,
        espaco_grill: 0,
        pet_park: 0,
        supermarket: 0,
        espaco_gamer: 0,
        salao_jogos: 0,
        sala_cinema: 0,
        playground: 0,
        sala_yoga: 0,
        redario: 0,
        horta: 0,
        area_convivencia: 0,
        academia: 0,
        sala_funcional: 0,
        quadra_poliesportiva: 0,
        quadra_beach_tennis: 0,
        campo_futebol_society: 0,
        quadra_volei_praia: 0,
        quadra_tenis: 0,
        ciclovia: 0,
        pista_cooper: 0,
        controle_acesso_automatizado: 0,
        sala_encomendas_delivery: 0,
        wi_fi_areas_comuns: 0
    });

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
                        setPossuiCarac(emp.possui_carac === true || emp.possui_carac === 'true');
                        setCarac({
                            parque_aquatico: emp.parque_aquatico || 0,
                            salao_festas: emp.salao_festas || 0,
                            espaco_gourmet: emp.espaco_gourmet || 0,
                            espaco_zen: emp.espaco_zen || 0,
                            coworking: emp.coworking || 0,
                            piquenique: emp.piquenique || 0,
                            espaco_grill: emp.espaco_grill || 0,
                            pet_park: emp.pet_park || 0,
                            supermarket: emp.supermarket || 0,
                            espaco_gamer: emp.espaco_gamer || 0,
                            salao_jogos: emp.salao_jogos || 0,
                            sala_cinema: emp.sala_cinema || 0,
                            playground: emp.playground || 0,
                            sala_yoga: emp.sala_yoga || 0,
                            redario: emp.redario || 0,
                            horta: emp.horta || 0,
                            area_convivencia: emp.area_convivencia || 0,
                            academia: emp.academia || 0,
                            sala_funcional: emp.sala_funcional || 0,
                            quadra_poliesportiva: emp.quadra_poliesportiva || 0,
                            quadra_beach_tennis: emp.quadra_beach_tennis || 0,
                            campo_futebol_society: emp.campo_futebol_society || 0,
                            quadra_volei_praia: emp.quadra_volei_praia || 0,
                            quadra_tenis: emp.quadra_tenis || 0,
                            ciclovia: emp.ciclovia || 0,
                            pista_cooper: emp.pista_cooper || 0,
                            controle_acesso_automatizado: emp.controle_acesso_automatizado || 0,
                            sala_encomendas_delivery: emp.sala_encomendas_delivery || 0,
                            wi_fi_areas_comuns: emp.wi_fi_areas_comuns || 0
                        });

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
                    pais_id: paisId,
                    possui_carac: possuiCarac,
                    ...carac
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

                                <div className={styles.formGroup} style={{ marginTop: '1.5rem', marginBottom: '1.5rem', width: '100%' }}>
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

                                {possuiCarac && (
                                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #e2e8f0', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Sparkles size={16} style={{ color: '#7F34E6' }} />
                                            Área Comum e Lazer do Empreendimento
                                        </h3>
                                        
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social</h4>
                                            <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.parque_aquatico} onChange={(e) => setCarac({...carac, parque_aquatico: e.target.checked})} />
                                                    <span>Parque Aquático</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.salao_festas} onChange={(e) => setCarac({...carac, salao_festas: e.target.checked})} />
                                                    <span>Salão de Festas</span>
                                                </label>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', height: '56px', boxSizing: 'border-box' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#475569' }}>Espaço Gourmet (Qtd):</span>
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        style={{ width: '50px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', textAlign: 'right', marginLeft: 'auto' }} 
                                                        value={carac.espaco_gourmet ?? 0} 
                                                        onChange={(e) => setCarac({...carac, espaco_gourmet: parseInt(e.target.value) || 0})}
                                                        onFocus={(e) => e.target.select()}
                                                    />
                                                </div>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.espaco_zen} onChange={(e) => setCarac({...carac, espaco_zen: e.target.checked})} />
                                                    <span>Espaço Zen</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.coworking} onChange={(e) => setCarac({...carac, coworking: e.target.checked})} />
                                                    <span>Coworking</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.piquenique} onChange={(e) => setCarac({...carac, piquenique: e.target.checked})} />
                                                    <span>Piquenique</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.espaco_grill} onChange={(e) => setCarac({...carac, espaco_grill: e.target.checked})} />
                                                    <span>Espaço Grill</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.pet_park} onChange={(e) => setCarac({...carac, pet_park: e.target.checked})} />
                                                    <span>Pet Park</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.supermarket} onChange={(e) => setCarac({...carac, supermarket: e.target.checked})} />
                                                    <span>Supermercado</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.espaco_gamer} onChange={(e) => setCarac({...carac, espaco_gamer: e.target.checked})} />
                                                    <span>Espaço Gamer</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.salao_jogos} onChange={(e) => setCarac({...carac, salao_jogos: e.target.checked})} />
                                                    <span>Salão de Jogos</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.sala_cinema} onChange={(e) => setCarac({...carac, sala_cinema: e.target.checked})} />
                                                    <span>Sala de Cinema</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.playground} onChange={(e) => setCarac({...carac, playground: e.target.checked})} />
                                                    <span>Playground</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bem-Estar</h4>
                                            <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.sala_yoga} onChange={(e) => setCarac({...carac, sala_yoga: e.target.checked})} />
                                                    <span>Sala de Yoga</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.redario} onChange={(e) => setCarac({...carac, redario: e.target.checked})} />
                                                    <span>Redário</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.horta} onChange={(e) => setCarac({...carac, horta: e.target.checked})} />
                                                    <span>Horta</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.area_convivencia} onChange={(e) => setCarac({...carac, area_convivencia: e.target.checked})} />
                                                    <span>Área de Convivência</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Esportes</h4>
                                            <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.academia} onChange={(e) => setCarac({...carac, academia: e.target.checked})} />
                                                    <span>Academia</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.sala_funcional} onChange={(e) => setCarac({...carac, sala_funcional: e.target.checked})} />
                                                    <span>Sala Funcional</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.quadra_poliesportiva} onChange={(e) => setCarac({...carac, quadra_poliesportiva: e.target.checked})} />
                                                    <span>Quadra Poliesportiva</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.quadra_beach_tennis} onChange={(e) => setCarac({...carac, quadra_beach_tennis: e.target.checked})} />
                                                    <span>Quadra Beach Tennis</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.campo_futebol_society} onChange={(e) => setCarac({...carac, campo_futebol_society: e.target.checked})} />
                                                    <span>Campo Futebol Society</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.quadra_volei_praia} onChange={(e) => setCarac({...carac, quadra_volei_praia: e.target.checked})} />
                                                    <span>Quadra Vôlei de Praia</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.quadra_tenis} onChange={(e) => setCarac({...carac, quadra_tenis: e.target.checked})} />
                                                    <span>Quadra de Tênis</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.ciclovia} onChange={(e) => setCarac({...carac, ciclovia: e.target.checked})} />
                                                    <span>Ciclovia</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.pista_cooper} onChange={(e) => setCarac({...carac, pista_cooper: e.target.checked})} />
                                                    <span>Pista de Cooper</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segurança e Conforto</h4>
                                            <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.controle_acesso_automatizado} onChange={(e) => setCarac({...carac, controle_acesso_automatizado: e.target.checked})} />
                                                    <span>Acesso Automatizado</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.sala_encomendas_delivery} onChange={(e) => setCarac({...carac, sala_encomendas_delivery: e.target.checked})} />
                                                    <span>Sala de Encomendas</span>
                                                </label>
                                                <label className={styles.checkboxCard}>
                                                    <input type="checkbox" className={styles.checkbox} checked={!!carac.wi_fi_areas_comuns} onChange={(e) => setCarac({...carac, wi_fi_areas_comuns: e.target.checked})} />
                                                    <span>Wi-Fi Áreas Comuns</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

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
