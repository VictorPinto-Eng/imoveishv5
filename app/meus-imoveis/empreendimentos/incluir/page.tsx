'use client'

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Building2, MapPin, CheckCircle, Loader2, Square } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import styles from './empreendimento.module.css';

interface LocationItem {
    id: number;
    nome: string;
}

export default function IncluirEmpreendimentoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Form state
    const [descricao, setDescricao] = useState('');
    const [estadoId, setEstadoId] = useState<number | ''>('');
    const [cidadeId, setCidadeId] = useState<number | ''>('');
    const [bairroId, setBairroId] = useState<number | ''>('');
    const [paisId] = useState<number>(1); // Default Brasil

    // Locations state
    const [estados, setEstados] = useState<LocationItem[]>([]);
    const [cidades, setCidades] = useState<LocationItem[]>([]);
    const [bairros, setBairros] = useState<LocationItem[]>([]);

    useEffect(() => {
        fetch('/api/property/estados')
            .then(res => res.json())
            .then(data => setEstados(data))
            .catch(err => console.error("Erro ao carregar estados:", err));
    }, []);

    useEffect(() => {
        if (estadoId) {
            fetch(`/api/property/cidades?estado_id=${estadoId}`)
                .then(res => res.json())
                .then(data => {
                    setCidades(data);
                    setCidadeId('');
                    setBairroId('');
                })
                .catch(err => console.error("Erro ao carregar cidades:", err));
        } else {
            setCidades([]);
            setBairros([]);
        }
    }, [estadoId]);

    useEffect(() => {
        if (cidadeId) {
            fetch(`/api/property/bairros?cidade_id=${cidadeId}`)
                .then(res => res.json())
                .then(data => {
                    setBairros(data);
                    setBairroId('');
                })
                .catch(err => console.error("Erro ao carregar bairros:", err));
        } else {
            setBairros([]);
        }
    }, [cidadeId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/property/empreendimentos/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    descricao,
                    estado_id: estadoId,
                    cidade_id: cidadeId,
                    bairro_id: bairroId,
                    pais_id: paisId
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao cadastrar empreendimento');
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
            <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <Link href="/meus-imoveis" className={styles.backBtn}>
                        <ArrowLeft size={20} />
                        Voltar para Meus Imóveis
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
                                    setEstadoId('');
                                    setCidadeId('');
                                    setBairroId('');
                                }}
                            >
                                Cadastrar Outro
                            </button>
                            <Link href="/meus-imoveis" className={styles.btnSecondary}>
                                Ir para Meus Imóveis
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <aside className={styles.sidebar}>
                <Link href="/meus-imoveis" className={styles.backBtn}>
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
                            <label className={styles.label}>Estado</label>
                            <select
                                className={styles.select}
                                value={estadoId}
                                onChange={(e) => setEstadoId(Number(e.target.value))}
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
                                onChange={(e) => setCidadeId(Number(e.target.value))}
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
                            {loading ? <Loader2 size={24} className="animate-spin" /> : 'Salvar Empreendimento'}
                        </button>
                    </form>
                </div>
            </main>
        </div>
    );
}
