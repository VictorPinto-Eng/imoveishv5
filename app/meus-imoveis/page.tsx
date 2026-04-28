
'use client'

import React, { useEffect, useState, Suspense, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
    Home, Plus, Loader2, FileText, Edit2, Trash2, 
    Menu, HelpCircle, Search, MapPin, SlidersHorizontal,
    Image as ImageIcon, PlusCircle, Frown, ChevronDown,
    ArrowLeft, ArrowRight, MoreVertical, Copy, MessageCircle, Mail, Send, Share2,
    FolderPlus, CheckSquare, Grip, X, Check, Users, MessageSquare, Building2
} from 'lucide-react';
import Link from 'next/link';
import NextImage from 'next/image';
import styles from './meus-imoveis.module.css';
import type { Photo } from '@/components/PhotoManager';
const PhotoManager = dynamic(() => import('@/components/PhotoManager'), { 
    ssr: false,
    loading: () => (
        <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="animate-spin text-blue-600" size={40} />
            <p className="text-gray-500 font-medium">Carregando fotos...</p>
        </div>
    )
});
import PropertyPerformance from '@/components/PropertyPerformance';
import FilterModal from '@/components/FilterModal';
import DashboardQuestions from '@/components/DashboardQuestions';
import { generateWhatsAppShareMessage } from '@/lib/share-templates';
import ShareModal from '@/components/ShareModal';
import dynamic from 'next/dynamic';
import type { PropertyMapProps } from '@/components/PropertyMap';

const PropertyMap = dynamic<PropertyMapProps>(() => import('@/components/PropertyMap'), { ssr: false });

interface CustomFields {
    area_total?: number;
    dormitorio?: number;
    dormitorios?: number;
    banheiro?: number;
    banheiros?: number;
    vaga?: number;
    vagas?: number;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    objetivo?: string;
    unidade?: string;
    tipo_imovel?: string;
    finalidade?: string;
    condominio?: number;
    iptu?: number;
    [key: string]: any;
}

interface Imovel {
    id: number;
    nome: string;
    preco_base: number;
    pending_questions?: number | string;
    status: string;
    status_imovel_nome?: string;
    imagens_urls: string[];
    foto_capa?: string;
    total_fotos?: string | number;
    categoria: string;
    descricao: string;
    custom_fields: CustomFields;
    pub_facebook?: boolean;
    pub_instagram?: boolean;
    uf_nome?: string;
    cidade_nome?: string;
    bairro_nome?: string;
    // Location DB Columns
    logradouro: string;
    numero: string;
    complemento: string;
    quadra_torre_bloco: string;
    unidade: string;
    andar: string;
    cep: string;
    estado_id: number;
    cidade_id: number;
    bairro_id: number;
    // Characteristics DB Columns
    dormitorio?: number;
    dormitorios: number;
    suite?: number;
    suites: number;
    varanda?: number;
    varandas?: number;
    banheiro?: number;
    banheiros: number;
    vaga?: number;
    vagas: number;
    areaservico: number;
    quartoservico: number;
    cozinha?: number;
    lavabo?: number;
    sala?: number;
    dimensoes_terreno?: string;
    area_util?: number;
    area_construida?: number;
    area_terreno?: number;
    imbtpoperacao_id?: number;
    imbempreendimento_id?: number;
    operacao_nome?: string;
    tipo_nome?: string;
    latitude?: number | null;
    longitude?: number | null;
    plus_code?: string;
    pub_site?: boolean;
    pub_price?: boolean;
}

function MeusImoveisContent() {
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [selectedImovel, setSelectedImovel] = useState<Imovel | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [activeTab, setActiveTab] = useState('detalhes');
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [isReordering, setIsReordering] = useState(false);
    const [showActions, setShowActions] = useState(false);
    const [isGalleryActionsOpen, setIsGalleryActionsOpen] = useState(false);
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
    const [isFabOpen, setIsFabOpen] = useState(false);
    const [listMode, setListMode] = useState<'imoveis' | 'empreendimentos'>('imoveis');
    const [isListModeDropdownOpen, setIsListModeDropdownOpen] = useState(false);
    const [selectedEmpreendimento, setSelectedEmpreendimento] = useState<any>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [shareUrl, setShareUrl] = useState('');
    const [photosCache, setPhotosCache] = useState<Record<number, Photo[]>>({});
    const actionsMenuRef = useRef<HTMLDivElement>(null);
    const listModeRef = useRef<HTMLDivElement>(null);
    const fabRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent | TouchEvent) {
            if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
                setShowActions(false);
            }
            if (listModeRef.current && !listModeRef.current.contains(event.target as Node)) {
                setIsListModeDropdownOpen(false);
            }
            if (fabRef.current && !fabRef.current.contains(event.target as Node)) {
                setIsFabOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const updatePropertyField = async (propertyId: number, field: string, value: any) => {
        if (!selectedImovel) return;

        // Optimistic update
        const updatedImovel = { ...selectedImovel, [field]: value };
        setSelectedImovel(updatedImovel);
        setImoveis(prev => prev.map(img => img.id === propertyId ? updatedImovel : img));

        try {
            const res = await fetch(`/api/property/${propertyId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value })
            });

            if (!res.ok) {
                throw new Error('Failed to update property');
            }
        } catch (error) {
            console.error('Error updating property field:', error);
            // Revert on error (optional, but good practice)
            alert('Erro ao atualizar campo do imóvel. Tente novamente.');
            fetchMyImoveis(); // Refresh list to sync with DB
        }
    };

    const togglePubSite = () => {
        if (!selectedImovel) return;
        const newValue = !selectedImovel.pub_site;
        updatePropertyField(selectedImovel.id, 'pub_site', newValue);
    };

    const togglePubPrice = () => {
        if (!selectedImovel) return;
        const newValue = !selectedImovel.pub_price;
        updatePropertyField(selectedImovel.id, 'pub_price', newValue);
    };

    const togglePubFacebook = () => {
        if (!selectedImovel) return;
        const newValue = !selectedImovel.pub_facebook;
        updatePropertyField(selectedImovel.id, 'pub_facebook', newValue);
    };

    const togglePubInstagram = () => {
        if (!selectedImovel) return;
        const newValue = !selectedImovel.pub_instagram;
        updatePropertyField(selectedImovel.id, 'pub_instagram', newValue);
    };
    const [empreendimentos, setEmpreendimentos] = useState<{ id: number; descricao: string }[]>([]);
    const [activities, setActivities] = useState<any[]>([]);
    const [loadingActivities, setLoadingActivities] = useState(false);
    
    // Quick Search & Filters State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [activeFilters, setActiveFilters] = useState<any>({
        operacao: '',
        finalidade: '',
        tipo: '',
        minPrice: '',
        maxPrice: '',
        dormitorios: undefined,
        suites: undefined,
        vagas: undefined,
        banheiros: undefined,
        minArea: '',
        maxArea: '',
        status: 'ativo',
        empreendimento: undefined
    });
    const searchParams = useSearchParams();
    const router = useRouter();

    const fetchMyImoveis = async (returnId?: string | null) => {
        try {
            const res = await fetch(`/api/user/imoveis?t=${Date.now()}`);
            if (res.ok) {
                const data = await res.json();
                const list = data.imoveis || [];
                console.log('>>> MY IMOVEIS LIST UPDATED:', list.map((i: any) => ({ id: i.id, pending: i.pending_questions })));
                setImoveis(list);
                setImageErrors({}); // <- Reset image error state whenever data updates
                
                if (returnId) {
                    const target = list.find((i: Imovel) => i.id.toString() === returnId);
                    console.log('>>> TENTANDO PRE-SELECIONAR URL ID:', returnId, 'ENCONTRADO:', !!target);
                    if (target) {
                        setSelectedImovel(target);
                        return; // Prioriza a pré-seleção
                    }
                }
                
                // Keep selection synchronized if it exists
                if (selectedImovel) {
                    const updated = list.find((i: Imovel) => i.id === selectedImovel.id);
                    if (updated) setSelectedImovel(updated);
                } else if (list.length > 0) {
                    setSelectedImovel(list[0]);
                }
            }
        } catch (error) {
            console.error('Error fallback reload:', error);
        }
    };

    useEffect(() => {
        if (imoveis.length > 0) {
            const ids = imoveis.map(i => i.id);
            fetch('/api/analytics/impressions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids })
            }).catch(err => console.error('Error recording impressions:', err));
        }
    }, [imoveis]);

    // Prefetch photos for selected property
    useEffect(() => {
        if (selectedImovel && !photosCache[selectedImovel.id]) {
            fetch(`/api/property/${selectedImovel.id}/photos`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setPhotosCache(prev => ({ ...prev, [selectedImovel.id]: data.photos }));
                    }
                })
                .catch(err => console.error('Error prefetching photos:', err));
        }
    }, [selectedImovel?.id]);

    useEffect(() => {
        // Close property actions menu when selection changes
        setShowActions(false);
    }, [selectedImovel?.id]);

    useEffect(() => {
        if (selectedImovel && activeTab === 'atividades') {
            const loadActivities = async () => {
                setLoadingActivities(true);
                try {
                    const res = await fetch(`/api/property/${selectedImovel.id}/activities`);
                    if (res.ok) {
                        const data = await res.json();
                        if (data.success) {
                            setActivities(data.activities || []);
                        }
                    } else {
                         setActivities([]);
                    }
                } catch (err) {
                    console.error('Fetch activities error:', err);
                } finally {
                    setLoadingActivities(false);
                }
            };
            loadActivities();
        }
    }, [selectedImovel?.id, activeTab]);

    useEffect(() => {
        const init = async () => {
            try {
                // Fetch empreendimentos once
                fetch('/api/property/empreendimentos')
                    .then(res => res.json())
                    .then(data => setEmpreendimentos(data.empreendimentos || []))
                    .catch(err => console.error('Error fetching empreendimentos:', err));

                const returnId = searchParams.get('id');
                console.log('>>> INIT: PARÂMETRO DA URL CAPTURADO ?id=', returnId);

                const meRes = await fetch('/api/auth/me');
                const authData = await meRes.json();
                if (!authData.authenticated) {
                    router.push('/');
                    return;
                }
                setIsAuthenticated(true);
                await fetchMyImoveis(returnId);
            } catch (error) {
                console.error('Init error:', error);
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    if (!isAuthenticated) return null;

    return (
        <main className="min-h-screen bg-white pt-[80px]">
            <Header />
            <div className={styles.pageWrapper}>
                {/* SIDEBAR */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarHeader}>
                        {isSearchOpen ? (
                            <div className={styles.quickSearchBox}>
                                <ArrowLeft 
                                    size={20} 
                                    className="cursor-pointer text-blue-600" 
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setSearchTerm('');
                                    }} 
                                />
                                <input 
                                    type="text" 
                                    placeholder="Pesquisar..." 
                                    className={styles.quickSearchInput}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <div className={styles.sidebarTopRow}>
                                <div className={styles.sidebarHeaderLeft}>
                                    <Menu size={20} className="cursor-pointer" />
                                    <div 
                                        className={styles.sidebarTitleRow} 
                                        style={{ position: 'relative', cursor: 'pointer' }}
                                        onClick={() => setIsListModeDropdownOpen(!isListModeDropdownOpen)}
                                        ref={listModeRef}
                                    >
                                        <h2 className={styles.sidebarTitle}>
                                            {listMode === 'imoveis' ? 'Imóveis' : 'Empreendimentos'}
                                        </h2>
                                        <ChevronDown size={18} style={{ transform: isListModeDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                                        {isListModeDropdownOpen && (
                                            <div style={{
                                                position: 'absolute', top: '100%', left: 0, zIndex: 100,
                                                background: 'white', borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                                minWidth: '180px', padding: '4px 0', marginTop: '4px'
                                            }}>
                                                <button
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: listMode === 'imoveis' ? '#f0f4ff' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: listMode === 'imoveis' ? 600 : 400 }}
                                                    onClick={(e) => { e.stopPropagation(); setListMode('imoveis'); setIsListModeDropdownOpen(false); setSelectedEmpreendimento(null); }}
                                                >
                                                    <Home size={16} /> Imóveis
                                                </button>
                                                <button
                                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '10px 16px', background: listMode === 'empreendimentos' ? '#f0f4ff' : 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: listMode === 'empreendimentos' ? 600 : 400 }}
                                                    onClick={(e) => { e.stopPropagation(); setListMode('empreendimentos'); setIsListModeDropdownOpen(false); setSelectedImovel(null); }}
                                                >
                                                    <Building2 size={16} /> Empreendimentos
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className={`${styles.sidebarHeaderRight} ${styles.sidebarIcons}`}>
                                    {listMode === 'imoveis' && (
                                        <>
                                            <Search size={20} onClick={() => setIsSearchOpen(true)} className="cursor-pointer" />
                                            <MapPin size={20} className="cursor-pointer" onClick={() => alert('Mapa em breve!')} />
                                            <SlidersHorizontal size={20} className="cursor-pointer" onClick={() => setIsFilterOpen(true)} />
                                        </>
                                    )}
                                    {listMode === 'empreendimentos' && (
                                        <Link href="/meus-imoveis/empreendimentos/incluir" title="Novo Empreendimento">
                                            <Plus size={20} className="cursor-pointer" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={styles.propertyCountBar}>
                        {listMode === 'imoveis'
                            ? `${imoveis.length} ${imoveis.length === 1 ? 'imóvel' : 'imóveis'}`
                            : `${empreendimentos.length} ${empreendimentos.length === 1 ? 'empreendimento' : 'empreendimentos'}`
                        }
                    </div>

                    {listMode === 'imoveis' && (
                    <div className={styles.propertyList}>
                        {imoveis
                            .filter(imovel => {
                                // 1. Search Term Filter
                                if (searchTerm) {
                                    const search = searchTerm.toLowerCase();
                                    const matchesSearch = 
                                        imovel.id.toString().includes(search) ||
                                        imovel.nome.toLowerCase().includes(search) ||
                                        imovel.logradouro?.toLowerCase().includes(search) ||
                                        imovel.custom_fields?.bairro?.toLowerCase().includes(search) ||
                                        imovel.tipo_nome?.toLowerCase().includes(search) ||
                                        imovel.operacao_nome?.toLowerCase().includes(search);
                                    if (!matchesSearch) return false;
                                }

                                // 2. Advanced Filters
                                if (activeFilters.operacao && imovel.imbtpoperacao_id?.toString() !== activeFilters.operacao) return false;
                                if (activeFilters.finalidade && imovel.categoria !== activeFilters.finalidade) return false;
                                
                                if (activeFilters.minPrice && imovel.preco_base < Number(activeFilters.minPrice)) return false;
                                if (activeFilters.maxPrice && imovel.preco_base > Number(activeFilters.maxPrice)) return false;
                                
                                if (activeFilters.dormitorios && (imovel.dormitorios || 0) < activeFilters.dormitorios) return false;
                                if (activeFilters.vagas && (imovel.vagas || 0) < activeFilters.vagas) return false;
                                if (activeFilters.banheiros && (imovel.banheiros || 0) < activeFilters.banheiros) return false;
                                if (activeFilters.suites && (imovel.suites || 0) < activeFilters.suites) return false;
                                
                                if (activeFilters.minArea && (imovel.area_util || 0) < Number(activeFilters.minArea)) return false;
                                if (activeFilters.maxArea && (imovel.area_util || 0) > Number(activeFilters.maxArea)) return false;

                                if (activeFilters.empreendimento && imovel.imbempreendimento_id?.toString() !== activeFilters.empreendimento.toString()) return false;

                                return true;
                            })
                            .map((imovel) => {
                                const cf = imovel.custom_fields || {};
                                const isActive = selectedImovel?.id === imovel.id;
                                return (
                                    <div 
                                        key={imovel.id} 
                                        className={`${styles.cardCompact} ${isActive ? styles.cardCompactActive : ''}`}
                                        onClick={() => setSelectedImovel(imovel)}
                                    >
                                        <div className={styles.cardCompactImage}>
                                            {(imovel.foto_capa || (imovel.imagens_urls && imovel.imagens_urls.length > 0)) && !imageErrors[imovel.id] ? (
                                                <NextImage
                                                    src={imovel.foto_capa || imovel.imagens_urls[0]}
                                                    alt=""
                                                    fill
                                                    unoptimized={true}
                                                    className={styles.propertyImage}
                                                    onError={() => setImageErrors(prev => ({...prev, [imovel.id]: true}))}
                                                />
                                            ) : (
                                                <div className={styles.cardCompactPlaceholder}>
                                                    <span style={{ fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>Ops! Sem foto</span>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className={styles.cardCompactContent}>
                                            <div className={styles.cardCompactIdRow}>
                                                <div className={styles.cardCompactId}>Cód {imovel.id}</div>
                                                {Number(imovel.pending_questions) > 0 && (
                                                    <div className={styles.pendingBadge} title={`${imovel.pending_questions} pergunta(s) pendente(s)`}>
                                                        <MessageSquare size={12} fill="white" />
                                                        <span>{imovel.pending_questions}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <h3 className={styles.cardCompactTitle}>
                                                {imovel.operacao_nome ? `${imovel.operacao_nome} - ` : ''}
                                                {imovel.tipo_nome || (imovel.categoria === 'Imovel' ? 'Apartamento' : imovel.categoria)}
                                            </h3>
                                            
                                            <div className={styles.cardCompactAddress}>
                                                {imovel.logradouro ? `${imovel.logradouro}${imovel.numero ? ', ' + imovel.numero : ''}` : 'Localização não informada'}
                                            </div>
                                            <div className={styles.cardCompactAddress}>
                                                {imovel.custom_fields?.bairro || 'Boa Viagem'}
                                                {imovel.custom_fields?.cidade ? `, ${imovel.custom_fields.cidade}` : ', Recife'}
                                            </div>
    
                                            <div className={styles.cardCompactPrice}>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(imovel.preco_base)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                    )}

                    {/* EMPREENDIMENTOS LIST */}
                    {listMode === 'empreendimentos' && (
                        <div className={styles.propertyList}>
                            {empreendimentos.length === 0 ? (
                                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#94a3b8' }}>
                                    <Building2 size={40} strokeWidth={1} style={{ margin: '0 auto 12px' }} />
                                    <p style={{ fontSize: '14px' }}>Nenhum empreendimento cadastrado.</p>
                                    <Link href="/meus-imoveis/empreendimentos/incluir" style={{ color: '#6366f1', fontSize: '13px', marginTop: '8px', display: 'inline-block' }}>+ Adicionar Empreendimento</Link>
                                </div>
                            ) : (
                                empreendimentos.map((emp: any) => (
                                    <div
                                        key={emp.id}
                                        className={`${styles.cardCompact} ${selectedEmpreendimento?.id === emp.id ? styles.cardCompactActive : ''}`}
                                        onClick={() => setSelectedEmpreendimento(emp)}
                                    >
                                        <div className={styles.cardCompactImage}>
                                            <div className={styles.cardCompactPlaceholder} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Building2 size={24} color="#94a3b8" />
                                            </div>
                                        </div>
                                        <div className={styles.cardCompactContent}>
                                            <div className={styles.cardCompactId}>Cód {emp.id}</div>
                                            <h3 className={styles.cardCompactTitle}>{emp.descricao}</h3>
                                            <div className={styles.cardCompactAddress}>
                                                {emp.bairro_nome ? `${emp.bairro_nome}, ` : ''}{emp.cidade_nome || ''}
                                            </div>
                                            {emp.estado_sigla && (
                                                <div className={styles.cardCompactAddress}>{emp.estado_sigla}</div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* SPEED DIAL FAB */}
                    <div className={styles.fabContainer} ref={fabRef}>
                        <div className={`${styles.fabMenu} ${isFabOpen ? styles.fabMenuOpen : ''}`}>
                            <Link href="/meus-imoveis/incluir" className={styles.fabMenuItem} title="Adicionar Imóvel">
                                <span className={styles.fabMenuLabel}>Imóvel</span>
                                <div className={styles.fabMenuIcon}><Home size={18} /></div>
                            </Link>
                            <Link href="/meus-imoveis/empreendimentos/incluir" className={styles.fabMenuItem} title="Adicionar Empreendimento">
                                <span className={styles.fabMenuLabel}>Empreendimento</span>
                                <div className={styles.fabMenuIcon}><Building2 size={18} /></div>
                            </Link>
                        </div>
                        <button 
                            className={`${styles.fab} ${isFabOpen ? styles.fabActive : ''}`}
                            onClick={() => setIsFabOpen(!isFabOpen)}
                            title="Adicionar"
                        >
                            <Plus className={styles.fabIcon} />
                        </button>
                    </div>
                </aside>

                {/* MAIN CONTENT AREA */}
                <section className={styles.mainSection}>
                    {/* EMPREENDIMENTO DETAIL VIEW */}
                    {listMode === 'empreendimentos' && selectedEmpreendimento && (
                        <div style={{ padding: '32px', maxWidth: '700px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                                <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Building2 size={28} color="white" />
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '2px' }}>Cód {selectedEmpreendimento.id}</p>
                                    <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', margin: 0 }}>{selectedEmpreendimento.descricao}</h2>
                                </div>
                            </div>

                            <div style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                {selectedEmpreendimento.bairro_nome && (
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Bairro</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedEmpreendimento.bairro_nome}</p>
                                    </div>
                                )}
                                {selectedEmpreendimento.cidade_nome && (
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Cidade</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedEmpreendimento.cidade_nome}</p>
                                    </div>
                                )}
                                {selectedEmpreendimento.estado_nome && (
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Estado</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedEmpreendimento.estado_nome} ({selectedEmpreendimento.estado_sigla})</p>
                                    </div>
                                )}
                                {selectedEmpreendimento.cep && (
                                    <div>
                                        <p style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>CEP</p>
                                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b' }}>{selectedEmpreendimento.cep}</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {listMode === 'empreendimentos' && !selectedEmpreendimento && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94a3b8', gap: '12px' }}>
                            <Building2 size={56} strokeWidth={1} />
                            <p style={{ fontSize: '16px' }}>Selecione um empreendimento para ver os detalhes</p>
                        </div>
                    )}

                    {listMode === 'imoveis' && selectedImovel ? (
                        <>
                            <div className={styles.detailHeader}>
                                <div className={styles.detailImageArea} onClick={() => {
                                    setIsGalleryOpen(true);
                                    setIsReordering(false);
                                }}>
                                    {(selectedImovel.foto_capa || (selectedImovel.imagens_urls && selectedImovel.imagens_urls.length > 0)) && !imageErrors[selectedImovel.id] ? (
                                        <NextImage
                                            src={selectedImovel.foto_capa || selectedImovel.imagens_urls[0]}
                                            alt=""
                                            fill
                                            priority
                                            unoptimized={true}
                                            className={styles.detailImage}
                                            onError={() => setImageErrors(prev => ({...prev, [selectedImovel.id]: true}))}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full h-full bg-slate-100">
                                            <ImageIcon size={64} className={styles.emptyStateIcon} strokeWidth={1} />
                                            <span className={styles.emptyStateText} style={{ color: '#64748b' }}>Adicionar fotos neste imóvel</span>
                                        </div>
                                    )}

                                    <div className={styles.actionOverlay}>
                                        {/* Action Button (Top Right Discreet) */}
                                        <div style={{ position: 'absolute', top: '1rem', right: '0.5rem', pointerEvents: 'auto' }} ref={actionsMenuRef}>
                                            <button 
                                                className={styles.actionButton}
                                                style={{ background: 'transparent', boxShadow: 'none', color: 'white' }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowActions(!showActions);
                                                }}
                                            >
                                                <MoreVertical size={24} />
                                            </button>

                                            {showActions && (
                                                <div 
                                                    className={styles.dropdownMenu} 
                                                    style={{ top: '100%', right: 0, pointerEvents: 'auto' }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <Link 
                                                        href={`/meus-imoveis/editar/${selectedImovel?.id}`} 
                                                        className={styles.dropdownItem}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <Edit2 size={16} />
                                                        <span>Editar</span>
                                                    </Link>
                                                    <button 
                                                        className={styles.dropdownItem} 
                                                        onClick={async (e) => { 
                                                            e.stopPropagation(); 
                                                            if (selectedImovel) {
                                                                try {
                                                                    const res = await fetch(`/api/property/${selectedImovel.id}/clone`, {
                                                                        method: 'POST'
                                                                    });
                                                                    if (res.ok) {
                                                                        const data = await res.json();
                                                                        setShowActions(false);
                                                                        await fetchMyImoveis();
                                                                        alert('Imóvel clonado com sucesso!');
                                                                    } else {
                                                                        const data = await res.json();
                                                                        alert(`Erro ao clonar: ${data.error || 'Erro desconhecido'}`);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Clone error:', err);
                                                                    alert('Erro de conexão ao clonar o imóvel.');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Copy size={16} />
                                                        <span>Clonar</span>
                                                    </button>
                                                    
                                                    <div className={styles.dropdownDivider} />
                                                                                                        <button className={styles.dropdownItem} onClick={(e) => { 
                                                         e.stopPropagation(); 
                                                         if (selectedImovel) {
                                                             const msg = generateWhatsAppShareMessage({
                                                                 id: selectedImovel.id,
                                                                 title: selectedImovel.nome,
                                                                 type: selectedImovel.tipo_nome,
                                                                 operation: selectedImovel.operacao_nome,
                                                                 price: selectedImovel.preco_base,
                                                                 area: selectedImovel.area_util || selectedImovel.area_terreno,
                                                                 rooms: selectedImovel.dormitorios,
                                                                 suites: selectedImovel.suites,
                                                                 parking: selectedImovel.vagas,
                                                                 bairro: selectedImovel.custom_fields?.bairro,
                                                                 cidade: selectedImovel.custom_fields?.cidade
                                                             });
                                                             const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
                                                             window.open(url, '_blank');
                                                             setShowActions(false);
                                                         }
                                                     }}>
                                                         <MessageCircle size={16} />
                                                         <span>Compartilhar por WhatsApp</span>
                                                     </button>
                                                    <button className={styles.dropdownItem} onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (selectedImovel) {
                                                            const subject = encodeURIComponent(`Interesse no imóvel: ${selectedImovel.nome}`);
                                                            const body = encodeURIComponent(`Olá, veja este imóvel no portal HV5:\n\n${window.location.origin}/imovel/${selectedImovel.id}`);
                                                            window.location.href = `mailto:?subject=${subject}&body=${body}`;
                                                            setShowActions(false);
                                                        }
                                                    }}>
                                                        <Mail size={16} />
                                                        <span>Compartilhar por Email</span>
                                                    </button>
                                                    
                                                    <div className={styles.dropdownDivider} />
                                                    
                                                    <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Gerando Carta Oferta...'); }}>
                                                        <FileText size={16} />
                                                        <span>Gerar Carta Oferta</span>
                                                    </button>
                                                    <button className={styles.dropdownItem} onClick={(e) => { e.stopPropagation(); alert('Solicitando revisão...'); }}>
                                                        <Send size={16} />
                                                        <span>Solicitar revisão ao proprietário</span>
                                                    </button>
                                                    
                                                    <div className={styles.dropdownDivider} />
                                                    
                                                    <button className={styles.dropdownItem} onClick={(e) => { 
                                                        e.stopPropagation(); 
                                                        if (selectedImovel) {
                                                            const shareUrl = `${window.location.origin}/imovel/${selectedImovel.id}`;
                                                            setShareUrl(shareUrl);
                                                            setIsShareModalOpen(true);
                                                            setShowActions(false);
                                                        }
                                                    }}>
                                                        <Share2 size={16} />
                                                        <span>Compartilhar Link</span>
                                                    </button>
                                                    <button 
                                                        className={`${styles.dropdownItem} ${styles.dropdownItemDelete}`} 
                                                        onClick={async (e) => { 
                                                            e.stopPropagation(); 
                                                            if (selectedImovel && confirm(`Deseja realmente excluir o imóvel "${selectedImovel.nome}"? Esta ação não pode ser desfeita.`)) {
                                                                try {
                                                                    const res = await fetch(`/api/property/${selectedImovel.id}`, {
                                                                        method: 'DELETE'
                                                                    });
                                                                    if (res.ok) {
                                                                        setShowActions(false);
                                                                        setSelectedImovel(null);
                                                                        await fetchMyImoveis();
                                                                    } else {
                                                                        const data = await res.json();
                                                                        alert(`Erro ao excluir: ${data.error || 'Erro desconhecido'}`);
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Delete error:', err);
                                                                    alert('Erro de conexão ao excluir o imóvel.');
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                        <span>Excluir</span>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Photos Count Badge (Bottom Right Discreet) */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '5.5rem',
                                            right: '1rem',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.4rem',
                                            color: 'white',
                                            background: 'rgba(0,0,0,0.5)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                                            fontWeight: '600',
                                            fontSize: '0.9rem',
                                            zIndex: 100,
                                            pointerEvents: 'none'
                                        }}>
                                            <ImageIcon size={18} strokeWidth={2.5} />
                                            <span>{selectedImovel?.total_fotos || 0} Fotos</span>
                                        </div>
                                    </div>
                                </div>

                                <nav className={styles.tabBar}>
                                    <div 
                                        className={`${styles.tabItem} ${activeTab === 'detalhes' ? styles.tabItemActive : ''}`}
                                        onClick={() => setActiveTab('detalhes')}
                                    >
                                        Detalhes
                                    </div>
                                    <div 
                                        className={`${styles.tabItem} ${activeTab === 'atividades' ? styles.tabItemActive : ''}`}
                                        onClick={() => setActiveTab('atividades')}
                                    >
                                        Atividades
                                    </div>
                                    <div 
                                        className={`${styles.tabItem} ${activeTab === 'desempenho' ? styles.tabItemActive : ''}`}
                                        onClick={() => setActiveTab('desempenho')}
                                    >
                                        Desempenho
                                    </div>
                                    <div 
                                        className={`${styles.tabItem} ${activeTab === 'perguntas' ? styles.tabItemActive : ''}`}
                                        onClick={() => setActiveTab('perguntas')}
                                    >
                                        Perguntas
                                    </div>
                                </nav>
                            </div>

                            <div className={styles.detailContent}>
                                <div className={styles.detailTitleRow}>
                                    <h1 className={styles.detailMainTitle}>
                                        {selectedImovel?.operacao_nome ? `${selectedImovel.operacao_nome} - ` : ''}
                                        {selectedImovel?.tipo_nome || (selectedImovel?.categoria === 'Imovel' ? 'Apartamento' : selectedImovel?.categoria)}
                                    </h1>
                                    <p className={styles.detailSubTitle}>{selectedImovel?.nome}</p>
                                    <div style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                                        Cód: {selectedImovel?.id}
                                    </div>
                                    <div className={styles.statusBadge}>
                                        {(selectedImovel?.status_imovel_nome || selectedImovel?.status || '').toUpperCase()}
                                    </div>
                                </div>

                                <div className={styles.priceCard}>
                                    <div className={styles.priceLabel}>{selectedImovel?.operacao_nome || selectedImovel?.custom_fields?.objetivo || 'Venda'}</div>
                                    <div className={styles.priceValue}>
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(selectedImovel?.preco_base || 0)}
                                    </div>
                                </div>

                                <div className={styles.sectionDivider} />

                                {activeTab === 'detalhes' && (
                                    <>
                                        {/* Localização Detalhada */}
                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Localização</h3>
                                            <p className={styles.addressText}>
                                                {selectedImovel.logradouro ? `${selectedImovel.logradouro}, ${selectedImovel.numero}` : 'Endereço não informado'}
                                                {selectedImovel.complemento ? ` - ${selectedImovel.complemento}` : ''}
                                                <br />
                                                {selectedImovel.custom_fields?.bairro || '-'}, {selectedImovel.custom_fields?.cidade || '-'} - {selectedImovel.custom_fields?.uf || '-'}
                                                <br />
                                                CEP: {selectedImovel.cep || '-'}
                                            </p>
                                            
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Empreendimento</span>
                                                    <span className={styles.detailsValue}>
                                                        {empreendimentos.find(e => e.id === Number(selectedImovel.imbempreendimento_id))?.descricao || 'Não informado'}
                                                    </span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Unidade / Andar</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.unidade || '-'} / {selectedImovel.andar ? selectedImovel.andar + 'º' : '-'}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Quadra / Torre</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.quadra_torre_bloco || 'Não informada'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.sectionDivider} />

                                        {/* Áreas */}
                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Dimensionamento</h3>
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Área Útil</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.area_util || 0} m²</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Área Const.</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.area_construida || 0} m²</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Área Terreno</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.area_terreno || 0} m²</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Dim. Terreno</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.dimensoes_terreno || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.sectionDivider} />

                                        {/* Características */}
                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Características</h3>
                                            <div className={styles.detailsGrid}>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Dormitório</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.dormitorios || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Suíte</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.suites || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Banheiro</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.banheiros || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Vaga</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.vagas || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Varanda</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.varandas || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Sala</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.sala || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Área Serv.</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.areaservico || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Quarto Serv.</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.quartoservico || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Cozinha</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.cozinha || 0}</span>
                                                </div>
                                                <div className={styles.detailsItem}>
                                                    <span className={styles.detailsLabel}>Lavabo</span>
                                                    <span className={styles.detailsValue}>{selectedImovel.lavabo || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={styles.sectionDivider} />

                                        <div className={styles.docsSection}>
                                            <div className={styles.docsHeader}>
                                                <h3 className={styles.docsTitle}>Documentos & Anexos</h3>
                                                <PlusCircle size={24} className="text-green-600 cursor-pointer" />
                                            </div>
                                            <div className={styles.emptyDocs}>
                                                <Frown size={48} className="text-gray-300" />
                                                <p>Ops! Não encontramos nenhum documento. Clique em + para adicionar</p>
                                            </div>
                                        </div>

                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Localização no Mapa</h3>
                                            <PropertyMap 
                                                latitude={selectedImovel.latitude} 
                                                longitude={selectedImovel.longitude} 
                                                address={selectedImovel.logradouro ? `${selectedImovel.logradouro}, ${selectedImovel.numero} - ${selectedImovel.bairro_nome}, ${selectedImovel.cidade_nome}` : undefined}
                                            />
                                        </div>

                                        {/* VINCULOS SECTION */}
                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Vínculos</h3>
                                            <div className={styles.vinculoCard}>
                                                <div className={styles.avatarCircle}>V</div>
                                                <div className={styles.vinculoInfo}>
                                                    <div className={styles.vinculoName}>Victor Pinto</div>
                                                    <div className={styles.vinculoRole}>Captador</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* DIVULGACAO SECTION */}
                                        <div className={styles.infoSection}>
                                            <h3 className={styles.infoSectionTitle}>Divulgação no site</h3>
                                            <div className={styles.divulgacaoRow}>
                                                <span className={styles.divulgacaoLabel}>Publicar no Site (Página Inicial)</span>
                                                <div 
                                                    className={`${styles.premiumSwitch} ${selectedImovel.pub_site ? styles.premiumSwitchActive : ''}`}
                                                    onClick={togglePubSite}
                                                >
                                                    <div className={styles.premiumSwitchIndicator}></div>
                                                </div>
                                            </div>
                                            <div className={styles.divulgacaoRow}>
                                                <span className={styles.divulgacaoLabel}>Exibir preço no site</span>
                                                <div 
                                                    className={`${styles.premiumSwitch} ${selectedImovel.pub_price ? styles.premiumSwitchActive : ''}`}
                                                    onClick={togglePubPrice}
                                                >
                                                    <div className={styles.premiumSwitchIndicator}></div>
                                                </div>
                                            </div>
                                            <div className={styles.divulgacaoRow}>
                                                <span className={styles.divulgacaoLabel}>Publicar no Facebook</span>
                                                <div 
                                                    className={`${styles.premiumSwitch} ${selectedImovel.pub_facebook ? styles.premiumSwitchActive : ''}`}
                                                    onClick={togglePubFacebook}
                                                >
                                                    <div className={styles.premiumSwitchIndicator}></div>
                                                </div>
                                            </div>
                                            <div className={styles.divulgacaoRow}>
                                                <span className={styles.divulgacaoLabel}>Publicar no Instagram</span>
                                                <div 
                                                    className={`${styles.premiumSwitch} ${selectedImovel.pub_instagram ? styles.premiumSwitchActive : ''}`}
                                                    onClick={togglePubInstagram}
                                                >
                                                    <div className={styles.premiumSwitchIndicator}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {activeTab === 'atividades' && (
                                    <div className={styles.atividadesContainer}>
                                        {loadingActivities ? (
                                            <div className="flex justify-center p-10"><Loader2 className="animate-spin text-red-600" /></div>
                                        ) : activities.length === 0 ? (
                                            <div className="p-12 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                                <p>Nenhuma atividade registrada para este imóvel ainda.</p>
                                            </div>
                                        ) : (
                                            <div className={styles.timeline}>
                                                {activities.map((act, idx) => (
                                                    <div key={idx} className={styles.timelineItem}>
                                                        <div className={styles.timelineIcon}>
                                                            {act.type === 'CRIACAO' && <Plus size={14} />}
                                                            {act.type === 'ATUALIZACAO' && <Edit2 size={14} />}
                                                            {act.type === 'CLONAGEM' && <Copy size={14} />}
                                                            {(act.type === 'click_whatsapp' || act.type === 'lead_received') && <MessageCircle size={14} />}
                                                            {act.type === 'click_phone' && <Mail size={14} />}
                                                        </div>
                                                        <div className={styles.timelineContent}>
                                                            <div className={styles.timelineHeader}>
                                                                <span className={styles.timelineType}>
                                                                    {act.type === 'CRIACAO' && 'Registro Criado'}
                                                                    {act.type === 'ATUALIZACAO' && 'Informações Atualizadas'}
                                                                    {act.type === 'CLONAGEM' && 'Imóvel Clonado'}
                                                                    {act.type === 'lead_received' && 'Novo Lead Recebido'}
                                                                    {act.type === 'click_whatsapp' && 'Clique no WhatsApp'}
                                                                    {act.type === 'click_phone' && 'Clique no Telefone'}
                                                                </span>
                                                                <span className={styles.timelineDate}>
                                                                    {new Date(act.created_at).toLocaleString('pt-BR', {
                                                                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                                    })}
                                                                </span>
                                                            </div>
                                                            <div className={styles.timelineUser}>
                                                                Por: {act.user_name || 'Visitante'}
                                                            </div>
                                                            {act.details?.changes && (
                                                                <div className={styles.timelineChanges}>
                                                                    {Object.entries(act.details.changes).map(([field, delta]: [string, any], i) => {
                                                                        const formatValue = (val: any) => {
                                                                            if (val === 'vazio' || val === null || val === undefined) return <span style={{ opacity: 0.4 }}>∅</span>;
                                                                            if (field === 'Preço' && !isNaN(Number(val))) {
                                                                                return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
                                                                            }
                                                                            return val;
                                                                        };
                                                                        return (
                                                                            <div key={i} className={styles.changeItem}>
                                                                                <span className={styles.changeField}>{field}:</span>
                                                                                <span className={styles.changeOld}>{formatValue(delta.old)}</span>
                                                                                <ArrowRight size={10} className="mx-1 text-slate-400" />
                                                                                <span className={styles.changeNew}>{formatValue(delta.new)}</span>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                 ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'perguntas' && selectedImovel && (
                                    <div className={styles.perguntasDashboard}>
                                        <DashboardQuestions 
                                            propertyId={selectedImovel.id} 
                                            onAnswer={() => fetchMyImoveis()}
                                        />
                                    </div>
                                )}

                                {activeTab === 'desempenho' && (
                                    <PropertyPerformance propertyId={selectedImovel.id} />
                                )}
                            </div>

                        </>
                    ) : listMode === 'imoveis' ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-10">
                            <Home size={64} className="mb-4" />
                            <p>Selecione um imóvel para ver os detalhes</p>
                        </div>
                    ) : null}
                </section>
            </div>

            {/* GALLeria OVERLAY */}
            {isGalleryOpen && selectedImovel && (
                <div className={styles.galleryOverlay}>
                    <div className={styles.galleryHeader}>
                        {!isReordering && (
                            <>
                                <div className={styles.galleryHeaderLeft}>
                                    <ArrowLeft size={24} className="cursor-pointer" onClick={() => setIsGalleryOpen(false)} />
                                    <h2 className={styles.galleryTitle}>Galeria</h2>
                                </div>
                                <div className={styles.galleryHeaderRight}>
                                    <Plus size={24} className="cursor-pointer" onClick={() => {
                                        const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                                        if(fileInput) fileInput.click();
                                    }} />
                                    <div style={{ position: 'relative' }}>
                                        <MoreVertical 
                                            size={24} 
                                            className="cursor-pointer" 
                                            onClick={() => setIsGalleryActionsOpen(!isGalleryActionsOpen)}
                                        />
                                        {isGalleryActionsOpen && (
                                            <div className={styles.dropdownMenu} style={{ right: 0, top: '40px' }}>
                                                <button className={styles.dropdownItem} onClick={() => { setIsGalleryActionsOpen(false); alert('Criar categoria') }}>
                                                    <FolderPlus size={16} />
                                                    <span>Criar categoria</span>
                                                </button>
                                                <button className={styles.dropdownItem} onClick={() => { setIsGalleryActionsOpen(false); alert('Selecionar') }}>
                                                    <CheckSquare size={16} />
                                                    <span>Selecionar</span>
                                                </button>
                                                <button className={styles.dropdownItem} onClick={() => { setIsGalleryActionsOpen(false); setIsReordering(true); }}>
                                                    <Grip size={16} />
                                                    <span>Alterar posição</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </>
                        )}
                        {isReordering && (
                            <>
                                <div className={styles.galleryHeaderLeft}>
                                    <X size={24} className="cursor-pointer" onClick={() => setIsReordering(false)} />
                                    <h2 className={styles.galleryTitle}>Alterar posição</h2>
                                </div>
                                <div className={styles.galleryHeaderRight}>
                                    <CheckSquare size={24} className="cursor-pointer" onClick={() => setIsReordering(false)} />
                                </div>
                            </>
                        )}
                    </div>
                    <div className={styles.galleryContent}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Fotos</h3>
                        </div>
                        <PhotoManager 
                            imovelId={selectedImovel.id} 
                            initialPhotos={photosCache[selectedImovel.id] || []} 
                            onUpdate={() => {
                                // Clear cache to force refresh on next fetch if needed, 
                                // or better, fetch again to update cache
                                fetch(`/api/property/${selectedImovel.id}/photos`)
                                    .then(res => res.json())
                                    .then(data => {
                                        if (data.success) {
                                            setPhotosCache(prev => ({ ...prev, [selectedImovel.id]: data.photos }));
                                        }
                                    });
                                fetchMyImoveis();
                            }}
                            isReordering={isReordering}
                        />
                    </div>
                </div>
            )}

            <FilterModal 
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                onApply={(filters) => setActiveFilters(filters)}
                initialFilters={activeFilters}
            />

            <ShareModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                shareUrl={shareUrl}
                title={selectedImovel?.nome}
            />
            <Footer />
        </main>
    );
}

export default function MeusImoveisPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        }>
            <MeusImoveisContent />
        </Suspense>
    );
}
