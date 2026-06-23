'use client'
// Force Turbopack CSS rebuild trigger: 2

import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import NextImage from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SearchableSelect from '@/components/SearchableSelect';
import CompletenessScore from '@/components/CompletenessScore';
import {
    ArrowLeft, Loader2, Save, Home,
    Maximize2, Bed, Bath, Car, MapPin,
    FileText, Building2, DollarSign, Sparkles, Ruler,
    Map as MapIcon, Navigation, Plus, Share2, ShieldCheck, Calendar
} from 'lucide-react';
import styles from './editar.module.css';
import { formatCurrency, maskCurrencyInput, parseCurrencyToNumber, completeCurrencyWithZeros, maskIntegerInput, maskCep } from '@/lib/format';
import { sanitizeLocationName } from '@/lib/sanitize-location';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });
import { fire } from '@/lib/swal';

interface CustomFields {
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    uf?: string;
    cep?: string;
    complemento?: string;
    pub_facebook?: boolean;
    pub_instagram?: boolean;
    tipo_imovel?: string;
    finalidade?: string;
    objetivo?: string;
    condominio?: number;
    iptu?: number;
    [key: string]: any;
}

interface Imovel {
    id: number;
    nome: string;
    preco_base: number;
    descricao: string;
    status: string;
    imagens_urls: string[];
    custom_fields: CustomFields;
    photos: any[];
    // Location DB Columns
    logradouro: string;
    numero: string;
    complemento: string;
    quadra_torre_bloco: string;
    unidade: string;
    andar: string;
    cep: string;
    // Characteristics DB Columns
    dormitorios: number;
    suites: number;
    varandas: number;
    banheiros: number;
    vagas: number;
    areaservico: number;
    quartoservico: number;
    area_util: number;
    area_construida: number;
    area_terreno: number;
    cozinha: number;
    lavabo: number;
    sala: number;
    dimensoes_terreno: string;
    imbtpoperacao_id?: number | null;
    imbfinalidade_id?: number | null;
    imbtpimovel_id?: number | null;
    statusimovel?: number | null;
    empreendimento?: number | null;
    imbtipoanuncio_id?: number;
    estado_id?: number;
    cidade_id?: number;
    bairro_id?: number;
    latitude?: number | null;
    longitude?: number | null;
    plus_code?: string;
    pub_site?: boolean;
    pub_price?: boolean;
    relimovel_id?: number;
    // New fields for Values
    seguro_incendio?: number;
    condominio_incluso?: boolean;
    iptu_incluso?: boolean;
    seguro_incendio_incluso?: boolean;
    periodo_loca_id?: number | null;
    vrtotal?: number | null;
    // Joined field names
    tipo_nome?: string;
    operacao_nome?: string;
    uf_nome?: string;
    cidade_nome?: string;
    bairro_nome?: string;
    // New Boolean characteristics
    parque_aquatico?: boolean;
    salao_festas?: boolean;
    espaco_gourmet?: number;
    espaco_zen?: boolean;
    coworking?: boolean;
    piquenique?: boolean;
    espaco_grill?: boolean;
    pet_park?: boolean;
    supermarket?: boolean;
    espaco_gamer?: boolean;
    salao_jogos?: boolean;
    sala_cinema?: boolean;
    playground?: boolean;
    sala_yoga?: boolean;
    redario?: boolean;
    horta?: boolean;
    area_convivencia?: boolean;
    espacos_gourmet_multiplos?: boolean;
    academia?: boolean;
    sala_funcional?: boolean;
    quadra_poliesportiva?: boolean;
    quadra_beach_tennis?: boolean;
    campo_futebol_society?: boolean;
    quadra_volei_praia?: boolean;
    quadra_tenis?: boolean;
    ciclovia?: boolean;
    pista_cooper?: boolean;
    controle_acesso_automatizado?: boolean;
    sala_encomendas_delivery?: boolean;
    wi_fi_areas_comuns?: boolean;
    [key: string]: any;
}

export default function EditarImovelPage() {
    const { id } = useParams();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [displayValue, setDisplayValue] = useState<string>('');
    const [imovel, setImovel] = useState<Imovel | null>(null);
    const [categories, setCategories] = useState<{ id: number; descricao: string }[]>([]);
    const [propertyTypesList, setPropertyTypesList] = useState<{ id: number; descricao: string }[]>([]);
    const [statuses, setStatuses] = useState<{ id: number; nome: string }[]>([]);
    const [estados, setEstados] = useState<{ id: number; nome: string; sigla: string }[]>([]);
    const [cidades, setCidades] = useState<{ id: number; nome: string }[]>([]);
    const [bairros, setBairros] = useState<{ id: number; nome: string }[]>([]);
    const [empreendimentos, setEmpreendimentos] = useState<{ id: number; descricao: string }[]>([]);
    const [operacoes, setOperacoes] = useState<{ id: number; descricao: string }[]>([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [showBairroCreateModal, setShowBairroCreateModal] = useState(false);
    const [bairroCreateLabel, setBairroCreateLabel] = useState('');
    const [activeVerification, setActiveVerification] = useState<'estado' | 'cidade' | 'bairro' | null>(null);
    const [resolvedIds, setResolvedIds] = useState({ estadoId: 0, cidadeId: 0, bairroId: 0 });
    const [locationRefreshTrigger, setLocationRefreshTrigger] = useState(0);
    const [pendingSavePayload, setPendingSavePayload] = useState<any | null>(null);
    const [isMapOpen, setIsMapOpen] = useState(false);
    const previousBairroValue = useRef<string>('');



    const handleBack = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/meus-imoveis?id=${id}`);
    };

    const calculateVrTotal = (currentImovel: Imovel) => {
        const precoBase = Number(currentImovel.preco_base) || 0;
        const condo = currentImovel.condominio_incluso ? 0 : (Number(currentImovel.custom_fields?.condominio) || 0);
        const iptu = currentImovel.iptu_incluso ? 0 : ((Number(currentImovel.custom_fields?.iptu) || 0) / 12);
        const seguro = currentImovel.seguro_incendio_incluso ? 0 : (Number(currentImovel.seguro_incendio) || 0);
        return precoBase + condo + iptu + seguro;
    };

    const copyEmpreendimentoCarac = (carac: any) => {
        setImovel(prev => {
            if (!prev) return null;
            const updated = { ...prev };
            const keys = [
                'parque_aquatico', 'salao_festas', 'espaco_zen', 'coworking', 
                'piquenique', 'espaco_grill', 'pet_park', 'supermarket', 
                'espaco_gamer', 'salao_jogos', 'sala_cinema', 'playground', 
                'sala_yoga', 'redario', 'horta', 'area_convivencia', 
                'academia', 'sala_funcional', 'quadra_poliesportiva', 
                'quadra_beach_tennis', 'campo_futebol_society', 'quadra_volei_praia', 
                'quadra_tenis', 'ciclovia', 'pista_cooper', 
                'controle_acesso_automatizado', 'sala_encomendas_delivery', 'wi_fi_areas_comuns'
            ];
            
            keys.forEach(key => {
                if (key in carac) {
                    updated[key] = !!carac[key];
                }
            });
            
            // Espaço Gourmet (Numeric field)
            if ('espaco_gourmet' in carac) {
                updated['espaco_gourmet'] = Number(carac.espaco_gourmet) || 0;
            }
            
            return updated;
        });
    };

    const handleEmpreendimentoChange = async (val: any) => {
        setImovel(prev => prev ? ({ ...prev, empreendimento: val ? Number(val) : null }) : null);
        
        if (!val) return;
        
        try {
            const res = await fetch(`/api/property/empreendimentos/${val}`);
            const data = await res.json();
            console.log(">>> Empreendimento carregado:", data);
            if (data.success && data.empreendimento) {
                const emp = data.empreendimento;
                if (emp.possui_carac === true || emp.possui_carac === 1 || emp.possui_carac === 'true') {
                    fire({
                        title: 'Carregar Características?',
                        text: 'Este empreendimento possui características de lazer/comuns cadastradas. Deseja importá-las para este imóvel?',
                        icon: 'question',
                        showCancelButton: true,
                        confirmButtonColor: '#7F34E6',
                        cancelButtonColor: '#cbd5e1',
                        confirmButtonText: 'Sim, importar',
                        cancelButtonText: 'Não'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            copyEmpreendimentoCarac(emp);
                            fire({
                                title: 'Importado!',
                                text: 'Características carregadas com sucesso.',
                                icon: 'success',
                                timer: 1500,
                                showConfirmButton: false
                            });
                        }
                    });
                }
            }
        } catch (err) {
            console.error("Erro ao carregar características do empreendimento:", err);
        }
    };

    useEffect(() => {
        // Remove global body padding from globals.css for this focused page
        const originalPadding = document.body.style.paddingTop;
        document.body.style.paddingTop = '0';
        return () => {
            document.body.style.paddingTop = originalPadding;
        };
    }, []);

    useEffect(() => {
        const idStr = Array.isArray(id) ? id[0] : id;
        if (idStr === 'undefined') {
            router.push('/meus-imoveis');
            return;
        }
        if (!idStr) return;

        const fetchImovel = async () => {
            try {
                const res = await fetch(`/api/property/${idStr}`);
                if (!res.ok) {
                    router.push(`/meus-imoveis?id=${idStr}`);
                    return;
                }
                const data = await res.json();
                const imovelData = data.imovel;
                if (imovelData && imovelData.cep) {
                    imovelData.cep = maskCep(imovelData.cep);
                }
                
                // Ensure custom_fields has location names if they exist in DB
                if (imovelData && !imovelData.custom_fields?.uf && imovelData.uf_nome) {
                    imovelData.custom_fields = {
                        ...imovelData.custom_fields,
                        uf: imovelData.uf_nome,
                        cidade: imovelData.cidade_nome,
                        bairro: imovelData.bairro_nome
                    };
                }

                setImovel(imovelData);
                if (imovelData) {
                    setResolvedIds({
                        estadoId: imovelData.estado_id || 0,
                        cidadeId: imovelData.cidade_id || 0,
                        bairroId: imovelData.bairro_id || 0
                    });
                }
            } catch (error) {
                console.error('Error fetching imovel:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchImovel();
    }, [id, router]);

    const generateAiTitle = async () => {
        if (!imovel) return;
        
        // Get the current descriptive names from state or fallback to existing names
        const currentType = propertyTypesList.find(t => t.id === imovel.imbtpimovel_id)?.descricao || imovel.tipo_nome || 'Imóvel';
        const currentOperation = operacoes.find(o => o.id === imovel.imbtpoperacao_id)?.descricao || imovel.operacao_nome || 'Venda';
        const currentCategory = categories.find(c => c.id === imovel.imbfinalidade_id)?.descricao || imovel.custom_fields.finalidade || '';

        setAiLoading(true);
        try {
            const res = await fetch('/api/property/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: currentType,
                    rooms: imovel.dormitorios,
                    bathrooms: imovel.banheiros,
                    suites: imovel.suites,
                    parking: imovel.vagas,
                    area: imovel.area_util,
                    areaTerreno: imovel.area_terreno,
                    areaConstruida: imovel.area_construida,
                    varandas: imovel.varandas,
                    address: imovel.logradouro,
                    finalidade: currentCategory,
                    objective: currentOperation,
                    condoFee: imovel.custom_fields.condominio,
                    iptuValue: imovel.custom_fields.iptu,
                    price: imovel.preco_base
                })
            });
            
            const data = await res.json();
            
            if (data.title) {
                setImovel(prev => prev ? ({ ...prev, nome: data.title.toUpperCase() }) : null);
                
                fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Título atualizado pela IA!',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
            } else {
                throw new Error(data.error || 'Não foi possível gerar um título');
            }
        } catch (error: any) {
            console.error('Error with AI title generation:', error);
            fire({
                title: 'IA Temporariamente Indisponível',
                text: 'Não conseguimos gerar o título agora. Por favor, tente novamente em instantes.',
                icon: 'warning',
                confirmButtonColor: '#7F34E6'
            });
        } finally {
            setAiLoading(false);
        }
    };

    // Fetch Estados from hv5db
    useEffect(() => {
        const fetchEstados = async () => {
            try {
                const res = await fetch('/api/property/estados');
                const data = await res.json();
                if (Array.isArray(data)) setEstados(data);
            } catch (error) {
                console.error('Error fetching estados:', error);
            }
        };
        fetchEstados();
    }, [locationRefreshTrigger]);

    // Fetch Cidades from hv5db when UF changes
    useEffect(() => {
        const fetchCidades = async () => {
            const uf = imovel?.custom_fields?.uf;
            if (!uf) {
                setCidades([]);
                return;
            }
            try {
                const res = await fetch(`/api/property/cidades?uf=${uf}`);
                const data = await res.json();
                if (Array.isArray(data)) setCidades(data);
            } catch (error) {
                console.error('Error fetching cidades:', error);
            }
        };
        if (imovel?.custom_fields?.uf) {
            fetchCidades();
        }
    }, [imovel?.custom_fields?.uf, locationRefreshTrigger]);

    // Fetch Bairros from hv5db when Cidade (or UF) changes
    useEffect(() => {
        const fetchBairros = async () => {
            const uf = imovel?.custom_fields?.uf;
            const cidade = imovel?.custom_fields?.cidade;
            if (!uf || !cidade) {
                setBairros([]);
                return;
            }
            try {
                const res = await fetch(`/api/property/bairros?uf=${uf}&cidade=${encodeURIComponent(cidade)}`);
                const data = await res.json();
                if (Array.isArray(data)) setBairros(data);
            } catch (error) {
                console.error('Error fetching bairros:', error);
            }
        };
        if (imovel?.custom_fields?.uf && imovel?.custom_fields?.cidade) {
            fetchBairros();
        }
    }, [imovel?.custom_fields?.uf, imovel?.custom_fields?.cidade, locationRefreshTrigger]);

    // Fetch Categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await fetch('/api/property/categories');
                const data = await res.json();
                setCategories(data);
            } catch (error) {
                console.error('Error fetching categories:', error);
            }
        };
        const fetchStatuses = async () => {
            try {
                const res = await fetch('/api/property/status');
                const data = await res.json();
                setStatuses(data);
            } catch (error) {
                console.error('Error fetching statuses:', error);
            }
        };
        const fetchEmpreendimentos = async () => {
            try {
                const res = await fetch('/api/property/empreendimentos');
                const data = await res.json();
                if (data.empreendimentos && Array.isArray(data.empreendimentos)) {
                    setEmpreendimentos(data.empreendimentos);
                } else if (Array.isArray(data)) {
                    setEmpreendimentos(data);
                }
            } catch (error) {
                console.error('Error fetching empreendimentos:', error);
            }
        };
        const fetchOperacoes = async () => {
            try {
                const res = await fetch('/api/property/operacoes');
                const data = await res.json();
                if (Array.isArray(data)) setOperacoes(data);
            } catch (error) {
                console.error('Error fetching operacoes:', error);
            }
        };
        fetchCategories();
        fetchStatuses();
        fetchEmpreendimentos();
        fetchOperacoes();
    }, []);

    useEffect(() => {
        const fetchTypes = async () => {
            if (!imovel?.imbfinalidade_id) {
                setPropertyTypesList([]);
                return;
            }
            try {
                const res = await fetch(`/api/property/types?category_id=${imovel.imbfinalidade_id}`);
                const data = await res.json();
                setPropertyTypesList(data);
            } catch (error) {
                console.error('Error fetching property types:', error);
            }
        };
        if (imovel?.imbfinalidade_id) {
            fetchTypes();
        }
    }, [imovel?.imbfinalidade_id]);


    const handleKeyDown = (e: React.KeyboardEvent, nextField: string, isCustom = false) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const next = document.querySelector(`[name="${nextField}"]`) as HTMLElement;
            if (next) {
                next.focus();
                if (next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement) {
                    next.select();
                }
            }
        }
    };


    const handleCharChange = (field: string, value: string, isCustom = false) => {
        if (!imovel) return;

        // Decimais: area_util, area_construida, area_terreno, preco_base, condominio, iptu, seguro_incendio
        const isDecimal = ['area_util', 'area_construida', 'area_terreno', 'preco_base', 'condominio', 'iptu', 'seguro_incendio'].includes(field);

        let numericValue: number;
        if (isDecimal) {
            const maskedValue = maskCurrencyInput(value, false);
            numericValue = parseCurrencyToNumber(maskedValue);
        } else {
            // Inteiros: apenas dígitos
            const maskedValue = maskIntegerInput(value);
            numericValue = parseInt(maskedValue) || 0;
        }

        if (isCustom) {
            setImovel({
                ...imovel,
                custom_fields: { ...imovel.custom_fields, [field]: numericValue }
            });
        } else {
            setImovel({
                ...imovel,
                [field as keyof Imovel]: numericValue
            });
        }
    };

    const [cepLoading, setCepLoading] = useState(false);
    const [cepData, setCepData] = useState<{ logradouro: string; bairro: string; localidade: string; uf: string; cep: string } | null>(null);
    const [showCepConfirm, setShowCepConfirm] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastSearchedCep = useRef<string>('');
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);
    const originalCepBeforeTyping = useRef<string | null>(null);

    const fetchWithTimeout = async (url: string, options: any = {}, timeout = 5000) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (error) {
            clearTimeout(id);
            throw error;
        }
    };

    const handleCepChange = (value: string) => {
        const cleanCep = value.replace(/\D/g, '').substring(0, 8);
        
        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const display = maskCep(cleanCep);

        if (cleanCep.length === 1 && originalCepBeforeTyping.current === null) {
            originalCepBeforeTyping.current = imovel?.cep || '';
        }

        setImovel(prev => prev ? { ...prev, cep: display } : null);
        setShowCepConfirm(false);
        setCepLoading(false);

        if (cleanCep.length === 0) {
            originalCepBeforeTyping.current = null;
        }

        if (cleanCep.length === 8 && cleanCep !== lastSearchedCep.current) {
            setCepLoading(true);
            debounceTimer.current = setTimeout(async () => {
                const controller = new AbortController();
                abortControllerRef.current = controller;

                try {
                    const res = await fetchWithTimeout(`https://viacep.com.br/ws/${cleanCep}/json/`, {
                        signal: controller.signal
                    }, 4000);
                    const data = await res.json();
                    if (!data.erro) {
                        lastSearchedCep.current = cleanCep;
                        setCepData({ ...data, cep: maskCep(cleanCep) });
                        setShowCepConfirm(true);
                    }
                } catch (error: any) {
                    if (error.name !== 'AbortError') console.error('Error fetching CEP:', error);
                } finally {
                    if (abortControllerRef.current === controller) {
                        setCepLoading(false);
                        abortControllerRef.current = null;
                    }
                }
            }, 300);
        } else if (cleanCep.length < 8) {
            lastSearchedCep.current = '';
            setCepData(null);
        }
    };

    const applyCepData = async () => {
        if (!cepData) return;
        
        const siglaViaCep = (cepData.uf || '').toUpperCase();
        const matchedEstado = estados.find(e => e.sigla.toUpperCase() === siglaViaCep);
        const ufValue = matchedEstado ? matchedEstado.sigla : siglaViaCep;
        
        const logradouro = sanitizeLocationName(cepData.logradouro || '');
        const bairro = sanitizeLocationName(cepData.bairro || '');
        const cidade = sanitizeLocationName(cepData.localidade || '');
        const cepParaAplicar = maskCep(cepData.cep);

        setImovel(prev => {
            if (!prev) return null;
            return {
                ...prev,
                logradouro,
                cep: cepParaAplicar,
                estado_id: undefined,
                cidade_id: undefined,
                bairro_id: undefined,
                custom_fields: {
                    ...prev.custom_fields,
                    bairro,
                    cidade,
                    uf: ufValue,
                }
            };
        });

        setShowCepConfirm(false);
        setCepData(null);
        originalCepBeforeTyping.current = null;
        await verifyLocationSequence(null, true);
    };

    const applyOnlyCep = () => {
        setShowCepConfirm(false);
        setCepData(null);
        lastSearchedCep.current = '';
        originalCepBeforeTyping.current = null;
    };

    const declineCep = () => {
        // Revert to original value if stored
        if (originalCepBeforeTyping.current !== null) {
            const oldValue = originalCepBeforeTyping.current;
            setImovel(prev => prev ? { ...prev, cep: oldValue } : null);
        }
        
        setShowCepConfirm(false);
        setCepData(null);
        lastSearchedCep.current = ''; 
        originalCepBeforeTyping.current = null;
    };


    const handleEnterKey = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const target = e.target as HTMLInputElement;
            // Permitir Enter em textareas para quebra de linha
            if (target.tagName === 'TEXTAREA') return;

            e.preventDefault();

            // Formatação especial para campos de moeda ao apertar Enter
            if (['preco_base', 'condominio', 'iptu', 'seguro_incendio'].includes(target.name)) {
                const completed = completeCurrencyWithZeros(target.value, false);
                const numericValue = parseCurrencyToNumber(completed);

                if (target.name === 'preco_base') {
                    setImovel(prev => prev ? { ...prev, preco_base: numericValue } : null);
                } else if (target.name === 'condominio') {
                    setImovel(prev => prev ? {
                        ...prev,
                        custom_fields: { ...prev.custom_fields, condominio: numericValue }
                    } : null);
                } else if (target.name === 'iptu') {
                    setImovel(prev => prev ? {
                        ...prev,
                        custom_fields: { ...prev.custom_fields, iptu: numericValue }
                    } : null);
                } else if (target.name === 'seguro_incendio') {
                    setImovel(prev => prev ? { ...prev, seguro_incendio: numericValue } : null);
                }
            }

            // Busca o formulário ou container principal
            const form = target.closest('main') || document.body;

            // Seleciona todos os elementos focáveis (pulando checkboxes e rádios para navegação fluida)
            const focusable = Array.from(form.querySelectorAll('input, select, textarea, button'))
                .filter(el => {
                    const htmlEl = el as HTMLInputElement;
                    // Filtra apenas elementos visíveis, habilitados e que não sejam seleções binárias (checkbox/radio)
                    return !htmlEl.disabled &&
                        htmlEl.tabIndex !== -1 &&
                        htmlEl.offsetParent !== null &&
                        htmlEl.type !== 'checkbox' &&
                        htmlEl.type !== 'radio' &&
                        (htmlEl.tagName !== 'BUTTON' || htmlEl.classList.contains(styles.saveBtn));
                });

            const index = focusable.indexOf(target);
            if (index > -1 && index < focusable.length - 1) {
                const nextEl = focusable[index + 1] as HTMLElement;
                nextEl.focus();
                if (nextEl instanceof HTMLInputElement || nextEl instanceof HTMLTextAreaElement) {
                    nextEl.select();
                }
            }
        }
    };

    const handleSave = async () => {
        if (!imovel) return;
        if (!imovel.numero || !imovel.numero.trim()) {
            fire({
                title: 'Atenção!',
                text: 'O número do endereço é obrigatório. Preencha com o número ou S/N.',
                icon: 'warning',
                confirmButtonColor: '#7F34E6'
            });
            return;
        }
        setSaving(true);
        try {
            // 1. Sequential Verification Chain
            const success = await verifyLocationSequence();
            if (!success) {
                setSaving(false);
                return;
            }

            const payload = {
                title: imovel.nome,
                description: imovel.descricao,
                price: imovel.preco_base,
                status: imovel.status,
                custom_fields: {
                    ...imovel.custom_fields,
                    estado_id: resolvedIds.estadoId || imovel.estado_id,
                    cidade_id: resolvedIds.cidadeId || imovel.cidade_id,
                    bairro_id: resolvedIds.bairroId || imovel.bairro_id,
                    cep: imovel.cep ? imovel.cep.replace(/\D/g, '') : '',
                    latitude: imovel.latitude,
                    longitude: imovel.longitude,
                    plus_code: imovel.plus_code,
                },
                estado_id: resolvedIds.estadoId || imovel.estado_id,
                cidade_id: resolvedIds.cidadeId || imovel.cidade_id,
                bairro_id: resolvedIds.bairroId || imovel.bairro_id,
                logradouro: imovel.logradouro,
                numero: imovel.numero,
                complemento: imovel.complemento,
                quadra_torre_bloco: imovel.quadra_torre_bloco,
                unidade: imovel.unidade,
                andar: imovel.andar,
                cep: imovel.cep ? imovel.cep.replace(/\D/g, '') : '',
                latitude: imovel.latitude,
                longitude: imovel.longitude,
                plus_code: imovel.plus_code,
                dormitorio: imovel.dormitorios,
                suite: imovel.suites,
                varanda: imovel.varandas,
                banheiro: imovel.banheiros,
                vaga: imovel.vagas,
                areaservico: imovel.areaservico,
                quartoservico: imovel.quartoservico,
                area_util: imovel.area_util,
                area_construida: imovel.area_construida,
                area_terreno: imovel.area_terreno,
                cozinha: imovel.cozinha,
                lavabo: imovel.lavabo,
                sala: imovel.sala,
                dimensoes_terreno: imovel.dimensoes_terreno,
                imbtpoperacao_id: imovel.imbtpoperacao_id,
                imbfinalidade_id: imovel.imbfinalidade_id,
                imbtpimovel_id: imovel.imbtpimovel_id,
                empreendimento: imovel.empreendimento,
                statusimovel: imovel.statusimovel,
                imbtipoanuncio_id: imovel.imbtipoanuncio_id || 1,
                pub_site: imovel.pub_site,
                pub_price: imovel.pub_price,
                seguro_incendio: imovel.seguro_incendio,
                condominio_incluso: imovel.condominio_incluso,
                iptu_incluso: imovel.iptu_incluso,
                seguro_incendio_incluso: imovel.seguro_incendio_incluso,
                periodo_loca_id: imovel.periodo_loca_id,
                relationship: imovel.relimovel_id === 1 ? 'Proprietário' : imovel.relimovel_id === 2 ? 'Corretor' : 'Administrador/Outro',
                pub_facebook: imovel.custom_fields.pub_facebook,
                pub_instagram: imovel.custom_fields.pub_instagram,
                // Boolean characteristics
                parque_aquatico: imovel.parque_aquatico || false,
                salao_festas: imovel.salao_festas || false,
                espaco_gourmet: Number(imovel.espaco_gourmet) || 0,
                espaco_zen: imovel.espaco_zen || false,
                coworking: imovel.coworking || false,
                piquenique: imovel.piquenique || false,
                espaco_grill: imovel.espaco_grill || false,
                pet_park: imovel.pet_park || false,
                supermarket: imovel.supermarket || false,
                espaco_gamer: imovel.espaco_gamer || false,
                salao_jogos: imovel.salao_jogos || false,
                sala_cinema: imovel.sala_cinema || false,
                playground: imovel.playground || false,
                sala_yoga: imovel.sala_yoga || false,
                redario: imovel.redario || false,
                horta: imovel.horta || false,
                area_convivencia: imovel.area_convivencia || false,
                espacos_gourmet_multiplos: imovel.espacos_gourmet_multiplos || false,
                academia: imovel.academia || false,
                sala_funcional: imovel.sala_funcional || false,
                quadra_poliesportiva: imovel.quadra_poliesportiva || false,
                quadra_beach_tennis: imovel.quadra_beach_tennis || false,
                campo_futebol_society: imovel.campo_futebol_society || false,
                quadra_volei_praia: imovel.quadra_volei_praia || false,
                quadra_tenis: imovel.quadra_tenis || false,
                ciclovia: imovel.ciclovia || false,
                pista_cooper: imovel.pista_cooper || false,
                controle_acesso_automatizado: imovel.controle_acesso_automatizado || false,
                sala_encomendas_delivery: imovel.sala_encomendas_delivery || false,
                wi_fi_areas_comuns: imovel.wi_fi_areas_comuns || false
            };

            const res = await fetch(`/api/property/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();

            if (res.ok && data.success) {
                fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: 'Imóvel atualizado com sucesso.',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            }

            fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: data.error || 'Erro ao atualizar imóvel',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        } catch (error) {
            console.error('Error saving imovel:', error);
            fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Não foi possível salvar as alterações.',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        } finally {
            setSaving(false);
        }
    };

    const verifyLocationSequence = async (overrideImovel?: any, autoCreate = false) => {
        const targetImovel = overrideImovel || imovel;
        if (!targetImovel) return false;
        try {
            // 1. Check Estado
            const sigla = targetImovel.custom_fields?.uf;
            if (!sigla) return true;

            const allEstsRes = await fetchWithTimeout('/api/property/estados', {}, 3000);
            const allEsts = await allEstsRes.json();
            const normalizedSigla = sigla.trim().toUpperCase();
            let matchedEst = allEsts.find((e: any) => e.sigla.trim().toUpperCase() === normalizedSigla);

            let estadoId: number;
            if (!matchedEst) {
                if (autoCreate) {
                    const res = await fetch('/api/property/estados', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ sigla: normalizedSigla, nome: normalizedSigla })
                    });
                    const data = await res.json();
                    if (data.success) {
                        estadoId = Number(data.id);
                        setLocationRefreshTrigger(prev => prev + 1);
                    } else return false;
                } else {
                    setBairroCreateLabel(sigla);
                    setActiveVerification('estado');
                    setShowBairroCreateModal(true);
                    return false;
                }
            } else {
                estadoId = matchedEst.id;
            }
            setResolvedIds(prev => ({ ...prev, estadoId }));

            // 2. Check Cidade
            const cidadeNome = targetImovel.custom_fields?.cidade;
            if (!cidadeNome) return true;

            const cidRes = await fetchWithTimeout(`/api/property/cidades?estado_id=${estadoId}`, {}, 3000);
            const cities = await cidRes.json();
            const normalizedCid = cidadeNome.trim().toUpperCase();
            let matchedCid = cities.find((c: any) => c.nome.trim().toUpperCase() === normalizedCid);

            let cidadeId: number;
            if (!matchedCid) {
                if (autoCreate) {
                    const res = await fetch('/api/property/cidades', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ descricao: cidadeNome, estado_id: estadoId })
                    });
                    const data = await res.json();
                    if (data.success) {
                        cidadeId = Number(data.id);
                        setLocationRefreshTrigger(prev => prev + 1);
                    } else return false;
                } else {
                    setBairroCreateLabel(cidadeNome);
                    setActiveVerification('cidade');
                    setShowBairroCreateModal(true);
                    return false;
                }
            } else {
                cidadeId = matchedCid.id;
            }
            setResolvedIds(prev => ({ ...prev, cidadeId }));

            // 3. Check Bairro
            const bairroNome = targetImovel.custom_fields?.bairro;
            if (!bairroNome) return true;

            const baiRes = await fetchWithTimeout(`/api/property/bairros?cidade_id=${cidadeId}`, {}, 3000);
            const bairrosData = await baiRes.json();
            const normalizedBai = bairroNome.trim().toUpperCase();
            let matchedBai = bairrosData.find((b: any) => b.nome.trim().toUpperCase() === normalizedBai);

            let bairroId: number;
            if (!matchedBai) {
                if (autoCreate) {
                    const res = await fetch('/api/property/bairros', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            descricao: bairroNome,
                            cidade_id: cidadeId,
                            estado_id: estadoId
                        })
                    });
                    const data = await res.json();
                    if (data.success) {
                        bairroId = Number(data.id);
                        setLocationRefreshTrigger(prev => prev + 1);
                    } else return false;
                } else {
                    setBairroCreateLabel(bairroNome);
                    setActiveVerification('bairro');
                    setShowBairroCreateModal(true);
                    return false;
                }
            } else {
                bairroId = matchedBai.id;
            }
            setResolvedIds(prev => ({ ...prev, bairroId }));

            return true;
        } catch (error) {
            console.error('Error verifying sequence:', error);
            return false;
        }
    };

    const handleConfirmCreateBairro = async () => {
        setSaving(true);
        try {
            let res;
            if (activeVerification === 'estado') {
                res = await fetch('/api/property/estados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sigla: bairroCreateLabel, nome: bairroCreateLabel })
                });
            } else if (activeVerification === 'cidade') {
                res = await fetch('/api/property/cidades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao: bairroCreateLabel, estado_id: resolvedIds.estadoId })
                });
            } else if (activeVerification === 'bairro') {
                res = await fetch('/api/property/bairros', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        descricao: bairroCreateLabel,
                        cidade_id: resolvedIds.cidadeId,
                        estado_id: resolvedIds.estadoId
                    })
                });
            }

            const data = await res?.json();
            if (data?.success) {
                const newId = Number(data.id);
                if (activeVerification === 'estado') {
                    setResolvedIds(prev => ({ ...prev, estadoId: newId }));
                    setImovel(prev => prev ? ({ ...prev, custom_fields: { ...prev.custom_fields, uf: bairroCreateLabel } }) : null);
                } else if (activeVerification === 'cidade') {
                    setResolvedIds(prev => ({ ...prev, cidadeId: newId }));
                    setImovel(prev => prev ? ({ ...prev, custom_fields: { ...prev.custom_fields, cidade: bairroCreateLabel } }) : null);
                } else if (activeVerification === 'bairro') {
                    setResolvedIds(prev => ({ ...prev, bairroId: newId }));
                    setImovel(prev => prev ? ({ ...prev, custom_fields: { ...prev.custom_fields, bairro: bairroCreateLabel } }) : null);
                }

                // Force refresh of dropdown lists
                setLocationRefreshTrigger(prev => prev + 1);

                setShowBairroCreateModal(false);
                setActiveVerification(null);
                // Return focus to CEP
                const cepInput = document.getElementsByClassName(styles.cepInput)[0];
                if (cepInput) (cepInput as HTMLElement).focus();
                return;
            }
            fire({
                title: 'Erro!',
                text: data?.error || 'Erro ao cadastrar localidade',
                icon: 'error',
                confirmButtonColor: '#7F34E6'
            });
        } catch (error) {
            console.error('Error confirming registration:', error);
            fire({
                title: 'Erro de Conexão',
                text: 'Não foi possível cadastrar a localidade.',
                icon: 'error',
                confirmButtonColor: '#7F34E6'
            });
        } finally {
            setSaving(false);
        }
    };

    // Add effect to sync resolvedIds back to imovel if they change
    useEffect(() => {
        if (resolvedIds.estadoId || resolvedIds.cidadeId || resolvedIds.bairroId) {
            setImovel(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    estado_id: resolvedIds.estadoId || prev.estado_id,
                    cidade_id: resolvedIds.cidadeId || prev.cidade_id,
                    bairro_id: resolvedIds.bairroId || prev.bairro_id,
                };
            });
        }
    }, [resolvedIds]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    if (!imovel) {
        console.log('>>> ERRO: Imóvel não carregado em Editar');
        return null;
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20" onKeyDown={handleEnterKey}>
            <div className={styles.stickyHeader}>
                <div className={styles.container}>
                    <div className={styles.header}>
                        <div className={styles.headerLeft}>
                            <Link href="/meus-imoveis" className={styles.logo}>
                                <span className={styles.logoText}>HV<span className={styles.logoHighlight}>5</span></span>
                            </Link>
                        </div>
                        <div className={styles.headerActions}>
                            <button
                                onClick={handleSave}
                                className={styles.saveBtn}
                                disabled={saving}
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                <span>Salvar Alterações</span>
                            </button>
                            <button
                                onClick={handleBack}
                                className={styles.backBtn}
                            >
                                <ArrowLeft size={20} />
                                <span>Voltar</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className={styles.container}>
                {imovel && <CompletenessScore imovel={imovel} />}

                {showBairroCreateModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(15, 23, 42, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 2000,
                        }}
                        onClick={() => setShowBairroCreateModal(false)}
                    >
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '520px',
                                background: '#fff',
                                borderRadius: '14px',
                                padding: '20px',
                                boxShadow: '0 18px 48px rgba(0,0,0,0.2)',
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '10px' }}>
                                {activeVerification === 'estado' && 'Estado não cadastrado'}
                                {activeVerification === 'cidade' && 'Cidade não cadastrada'}
                                {activeVerification === 'bairro' && 'Bairro não cadastrado'}
                            </h3>
                            <p style={{ color: '#334155', marginBottom: '12px' }}>
                                Digite o nome do {activeVerification === 'estado' ? 'estado' : activeVerification === 'cidade' ? 'município' : 'bairro'} que deseja incluir na base master:
                            </p>
                            <input 
                                type="text"
                                value={bairroCreateLabel}
                                onChange={(e) => setBairroCreateLabel(e.target.value.toUpperCase())}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '8px',
                                    border: '1px solid #e2e8f0',
                                    marginBottom: '20px',
                                    fontSize: '16px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    background: '#f8fafc'
                                }}
                                autoFocus
                                placeholder="Nome da localidade..."
                            />
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    onClick={() => {
                                        setShowBairroCreateModal(false);
                                        // Restore previous value if cancelling a manual creation
                                        if (activeVerification === 'bairro' && previousBairroValue.current !== undefined) {
                                            setImovel(prev => prev ? ({
                                                ...prev,
                                                custom_fields: { ...prev.custom_fields, bairro: previousBairroValue.current }
                                            }) : null);
                                        }
                                    }}
                                    style={{
                                        padding: '10px 18px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: '1px solid #e2e8f0',
                                        background: '#fff',
                                        color: '#475569',
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleConfirmCreateBairro}
                                    disabled={saving}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        border: 'none',
                                        background: '#4f46e5',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                    }}
                                >
                                    {saving && <Loader2 className="animate-spin" size={16} />}
                                    <span>Cadastrar e continuar</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Loading Overlay/Modal */}
                {saving && !showBairroCreateModal && (
                    <div
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(255, 255, 255, 0.8)',
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 3000,
                        }}
                    >
                        <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-2xl shadow-xl border border-purple-100">
                            <Loader2 className="animate-spin text-purple-600" size={48} />
                            <div className="text-center">
                                <h3 className="text-xl font-bold text-gray-900">Salvando Alterações</h3>
                                <p className="text-gray-500">Aguarde enquanto atualizamos os dados do imóvel...</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className={styles.grid}>
                    {/* Coluna Esquerda: Dados Principais */}
                    <div className={styles.mainColumn}>
                        {/* 1. Localização */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <div className={styles.iconBox}><MapPin size={20} /></div>
                                Localização
                            </h2>

                            {/* -- Endereço (full width) -- */}
                            <div className={styles.formGroupFullWidth}>
                                <h3 className={styles.question}>Endereço</h3>
                                <input
                                    type="text"
                                    value={imovel.logradouro || ''}
                                    onChange={(e) => setImovel({ ...imovel, logradouro: sanitizeLocationName(e.target.value, false) })}
                                    placeholder="Rua, Avenida, Alameda..."
                                />
                            </div>

                            {/* -- Row: Número + Complemento (inline after Endereço) -- */}
                            <div className={styles.featGrid}>
                                <div className={styles.formGroup}>
                                    <h3 className={styles.question}>Número <span style={{ color: '#ef4444' }}>*</span></h3>
                                    <input
                                        type="text"
                                        value={imovel.numero || ''}
                                        onChange={(e) => setImovel({ ...imovel, numero: sanitizeLocationName(e.target.value, false) })}
                                        placeholder="Ex: 555 ou S/N"
                                    />
                                </div>
                                <div className={styles.formGroupWide}>
                                    <h3 className={styles.question}>Complemento</h3>
                                    <input
                                        type="text"
                                        value={imovel.complemento || ''}
                                        onChange={(e) => setImovel({ ...imovel, complemento: sanitizeLocationName(e.target.value, false) })}
                                        placeholder="Ex: APTO 123"
                                    />
                                </div>
                            </div>

                            <div className={styles.featGrid}>
                                {/* -- Unidade -- */}
                                <div className={styles.formGroup}>
                                    <h3 className={styles.question}>Unidade</h3>
                                    <input
                                        type="text"
                                        value={imovel.unidade || ''}
                                        onChange={(e) => setImovel({ ...imovel, unidade: sanitizeLocationName(e.target.value, false) })}
                                        placeholder="Ex: 12B"
                                    />
                                </div>

                                {/* -- Andar -- */}
                                <div className={styles.formGroup}>
                                    <h3 className={styles.question}>Andar</h3>
                                    <input
                                        type="text"
                                        value={imovel.andar || ''}
                                        onChange={(e) => setImovel({ ...imovel, andar: sanitizeLocationName(e.target.value, false) })}
                                        placeholder="Ex: 5"
                                    />
                                </div>
                            </div>

                            <div className={styles.featGrid}>
                                {/* -- Empreendimento -- */}
                                <div className={styles.formGroupWide}>
                                    <h3 className={styles.question}>Empreendimento</h3>
                                    <SearchableSelect
                                        options={empreendimentos}
                                        value={imovel.empreendimento || ''}
                                        onChange={handleEmpreendimentoChange}
                                        placeholder="Selecione um empreendimento..."
                                    />
                                </div>

                                {/* -- Quadra / Torre / Bloco -- */}
                                <div className={`${styles.formGroup} ${styles.quadraSelect}`}>
                                    <h3 className={styles.question}>Quadra / Torre / Bloco</h3>
                                    <input
                                        type="text"
                                        value={imovel.quadra_torre_bloco || ''}
                                        onChange={(e) => setImovel({ ...imovel, quadra_torre_bloco: sanitizeLocationName(e.target.value, false) })}
                                        placeholder="Ex: TORRE A"
                                    />
                                </div>
                            </div>

                            {/* -- Row: Estado + Cidade -- */}
                            <div className={styles.featGrid}>
                                {/* -- Estado (UF) -- */}
                                <div className={`${styles.formGroup} ${styles.estadoSelect}`}>
                                    <h3 className={styles.question}>Estado</h3>
                                    <select
                                        value={imovel.custom_fields.uf || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const matched = estados.find(est => est.sigla === val);
                                            setResolvedIds(prev => ({ ...prev, estadoId: matched?.id || 0, cidadeId: 0, bairroId: 0 }));
                                            setImovel({
                                                ...imovel,
                                                custom_fields: { ...imovel.custom_fields, uf: val, cidade: '', bairro: '' }
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        {estados.map(est => (
                                            <option key={est.id} value={est.sigla}>{est.sigla} — {est.nome}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* -- Cidade -- */}
                                <div className={styles.formGroupWide}>
                                    <h3 className={styles.question}>Cidade</h3>
                                    <select
                                        value={imovel.custom_fields.cidade || ''}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            const matched = cidades.find(cid => cid.nome === val);
                                            setResolvedIds(prev => ({ ...prev, cidadeId: matched?.id || 0, bairroId: 0 }));
                                            setImovel({
                                                ...imovel,
                                                custom_fields: { ...imovel.custom_fields, cidade: sanitizeLocationName(val, false), bairro: '' }
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        {cidades.map(cid => (
                                            <option key={cid.id} value={cid.nome}>{cid.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* -- Row: Bairro + CEP -- */}
                            <div className={styles.featGrid}>
                                <div className={styles.formGroupWide}>
                                    <h3 className={styles.question}>Bairro</h3>
                                    <select
                                        value={imovel.custom_fields.bairro || ''}
                                        onChange={(e) => {
                                            if (e.target.value === 'CREATE_NEW') {
                                                previousBairroValue.current = imovel.custom_fields.bairro || '';
                                                setBairroCreateLabel('');
                                                setActiveVerification('bairro');
                                                setShowBairroCreateModal(true);
                                                return;
                                            }
                                            setImovel({
                                                ...imovel,
                                                custom_fields: { ...imovel.custom_fields, bairro: sanitizeLocationName(e.target.value, false) }
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        <option value="CREATE_NEW" style={{ fontWeight: 'bold', color: '#7F34E6' }}>+ CADASTRAR NOVO BAIRRO</option>
                                        {bairros.map(bai => (
                                            <option key={bai.id} value={bai.nome}>{bai.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <h3 className={styles.question}>CEP</h3>
                                    <div style={{ position: 'relative' }}>
                                        <input
                                            type="text"
                                            className={styles.cepInput}
                                            value={imovel.cep || ''}
                                            onChange={(e) => handleCepChange(e.target.value)}
                                            placeholder="00000-000"
                                            maxLength={9}
                                        />
                                        {cepLoading && (
                                            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>
                                                <Loader2 className="animate-spin text-purple-600" size={18} />
                                            </div>
                                        )}
                                    </div>
                                    {showCepConfirm && cepData && (
                                        <div key={`cep-confirm-${cepData.cep}`} className={styles.cepConfirmBanner}>
                                            <div className={styles.cepConfirmText}>
                                                <MapPin size={18} style={{marginTop: '2px'}} />
                                                <div className={styles.cepConfirmDetails}>
                                                    <span className={styles.cepConfirmStreet}>{(cepData.logradouro || '').split(',')[0].split('-')[0].trim().toUpperCase()}</span>
                                                    <span className={styles.cepConfirmSub}>
                                                        {cepData.bairro ? `${cepData.bairro.toUpperCase()}, ` : ''}
                                                        {(cepData.localidade || '').toUpperCase()} / {(cepData.uf || '').toUpperCase()}
                                                    </span>
                                                    <span className={styles.cepConfirmCep}>CEP: {cepData.cep}</span>
                                                </div>
                                            </div>
                                            <div className={styles.cepConfirmActions}>
                                                <button onClick={applyCepData} className={styles.cepConfirmYes}>Atualizar campos</button>
                                                <button onClick={applyOnlyCep} className={styles.cepConfirmOnly || styles.cepConfirmNo} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>Manter apenas CEP</button>
                                                <button onClick={declineCep} className={styles.cepConfirmNo}>Manter atual</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Map Section - Parity with hv5soft */}
                            <label className={styles.mapLabel}>Ponto de Localização</label>
                            <div className={styles.mapPreviewContainer}>
                                <button 
                                    type="button"
                                    className={styles.mapPreviewBody}
                                    onClick={() => setIsMapOpen(true)}
                                >
                                    {imovel.latitude && imovel.longitude ? (
                                        <div style={{ position: 'relative' }}>
                                            <div className={styles.mapPreviewOverlay}></div>
                                            <iframe 
                                                title="Google Maps" 
                                                src={`https://www.google.com/maps?q=${imovel.latitude},${imovel.longitude}&z=17&output=embed`} 
                                                className={styles.googleMapEmbed} 
                                                loading="lazy" 
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.mapEmptyState}>
                                            <div className={styles.mapIconCircle}>
                                                <MapIcon size={32} />
                                            </div>
                                            <div className={styles.mapEmptyTitle}>Localização não definida</div>
                                            <p className={styles.mapEmptySub}>Clique abaixo para definir o ponto exato no mapa</p>
                                            <div className={styles.btnDefinirMapa}>
                                                <Plus size={14} strokeWidth={3} />
                                                Definir no Mapa
                                            </div>
                                        </div>
                                    )}
                                </button>

                                <div className={styles.mapFooter}>
                                    <div className={styles.mapFooterLeft}>
                                        {imovel.latitude && imovel.longitude && (
                                            <a 
                                                href={`https://www.google.com/maps?q=${imovel.latitude},${imovel.longitude}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.btnTracarRota}
                                            >
                                                TRAÇAR ROTA
                                            </a>
                                        )}
                                        <div className={styles.plusCodeInfo}>
                                            <span className={styles.plusCodeLabel}>Plus Code</span>
                                            <span className={styles.plusCodeValue}>{imovel.plus_code || "Não gerado"}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <MapPicker 
                                isOpen={isMapOpen}
                                onClose={() => setIsMapOpen(false)}
                                onSelect={(lat, lng, pc) => {
                                    setImovel(prev => prev ? ({
                                        ...prev,
                                        latitude: lat,
                                        longitude: lng,
                                        plus_code: pc
                                    }) : null);
                                }}
                                initialLat={imovel.latitude}
                                initialLng={imovel.longitude}
                                addressContext={`${imovel.logradouro}${imovel.numero ? `, ${imovel.numero}` : ''}, ${imovel.custom_fields.bairro}, ${imovel.custom_fields.cidade} - ${imovel.custom_fields.uf}${imovel.cep ? `, ${imovel.cep}` : ''}`}
                                addressData={{
                                    street: imovel.logradouro,
                                    number: imovel.numero,
                                    neighborhood: imovel.custom_fields.bairro,
                                    city: imovel.custom_fields.cidade,
                                    state: imovel.custom_fields.uf,
                                    postalCode: imovel.cep
                                }}
                            />
                        </section>

                        {/* 2. Imóvel */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <div className={styles.iconBox}><Building2 size={20} /></div>
                                Imóvel
                            </h2>
                            <div className={styles.featGrid}>
                                <div className={styles.formGroup}>
                                    <label>Tipo de Operação</label>
                                    <select
                                        value={imovel.imbtpoperacao_id || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            const opObj = operacoes.find(op => op.id === val);
                                            setImovel({
                                                ...imovel,
                                                imbtpoperacao_id: isNaN(val) ? null : val,
                                                custom_fields: { ...imovel.custom_fields, objetivo: opObj ? opObj.descricao : '' }
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        {operacoes.map(op => (
                                            <option key={op.id} value={op.id}>{op.descricao}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tipo de Anúncio</label>
                                    <select
                                        value={imovel.imbtipoanuncio_id || 1}
                                        onChange={(e) => {
                                            const id = parseInt(e.target.value);
                                            setImovel({
                                                ...imovel,
                                                imbtipoanuncio_id: id
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value={1}>Unidade Individual</option>
                                        <option value={2}>Empreendimento</option>
                                    </select>
                                </div>
                            </div>
                            <div className={styles.featGrid}>
                                <div className={styles.formGroupLarge}>
                                    <label>Finalidade</label>
                                    <select
                                        value={imovel.imbfinalidade_id || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            const cat = categories.find(c => c.id === val);
                                            setImovel({
                                                ...imovel,
                                                imbfinalidade_id: isNaN(val) ? null : val,
                                                imbtpimovel_id: isNaN(val) ? null : imovel.imbtpimovel_id,
                                                custom_fields: {
                                                    ...imovel.custom_fields,
                                                    finalidade: cat ? cat.descricao : '',
                                                    tipo_imovel: isNaN(val) ? '' : imovel.custom_fields.tipo_imovel
                                                }
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.descricao}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Tipo de Imóvel</label>
                                    <select
                                        value={imovel.imbtpimovel_id || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            const typeObj = propertyTypesList.find(t => t.id === val);
                                            setImovel({
                                                ...imovel,
                                                imbtpimovel_id: isNaN(val) ? null : val,
                                                custom_fields: { ...imovel.custom_fields, tipo_imovel: typeObj ? typeObj.descricao : '' }
                                            });
                                        }}
                                        className={styles.select}
                                        disabled={!imovel.imbfinalidade_id}
                                    >
                                        <option value="">Selecione...</option>
                                        {propertyTypesList.map(tp => (
                                            <option key={tp.id} value={tp.id}>{tp.descricao}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroupFull}>
                                    <label>Status do Imóvel</label>
                                    <select
                                        value={imovel.statusimovel || ''}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value);
                                            setImovel({
                                                ...imovel,
                                                statusimovel: isNaN(val) ? null : val
                                            });
                                        }}
                                        className={styles.select}
                                    >
                                        <option value="">Selecione...</option>
                                        {statuses.map(st => (
                                            <option key={st.id} value={st.id}>{st.nome}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                             <div className={styles.featGrid} style={{ marginTop: '24px' }}>
                                <div className={styles.formGroupFullWidth}>
                                    <label>Sua relação com o imóvel</label>
                                    <select
                                        value={imovel.relimovel_id || ''}
                                        className={styles.select}
                                        onChange={(e) => setImovel({ ...imovel, relimovel_id: parseInt(e.target.value) || 3 })}
                                        style={{ width: '270px' }}
                                    >
                                        <option value="1">Sou o Proprietário</option>
                                        <option value="2">Sou o Corretor</option>
                                        <option value="3">Administrador / Outro</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* 3. Características */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <div className={styles.iconBox}><Home size={20} /></div>
                                Características
                            </h2>
                            <div className={styles.featGrid}>
                                {/* Linha 1: Dormitório, Suíte, Banheiro, Sala */}
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', width: '100%' }}>
                                    <div className={styles.formGroup}>
                                        <label><Bed size={14} /> Dormitório</label>
                                        <input
                                            type="number"
                                            value={imovel.dormitorios ?? ''}
                                            onChange={(e) => handleCharChange('dormitorios', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Bed size={14} /> Suíte</label>
                                        <input
                                            type="number"
                                            value={imovel.suites ?? ''}
                                            onChange={(e) => handleCharChange('suites', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Bath size={14} /> Banheiro</label>
                                        <input
                                            type="number"
                                            value={imovel.banheiros ?? ''}
                                            onChange={(e) => handleCharChange('banheiros', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Home size={14} /> Sala</label>
                                        <input
                                            type="number"
                                            value={imovel.sala ?? 0}
                                            onChange={(e) => handleCharChange('sala', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>

                                {/* Linha 2: Cozinha, Lavabo, Varanda, Área Serv, Qto Serv */}
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '24px', width: '100%', marginTop: '12px' }}>
                                    <div className={styles.formGroup}>
                                        <label><Home size={14} /> Cozinha</label>
                                        <input
                                            type="number"
                                            value={imovel.cozinha ?? 0}
                                            onChange={(e) => handleCharChange('cozinha', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Bath size={14} /> Lavabo</label>
                                        <input
                                            type="number"
                                            value={imovel.lavabo ?? 0}
                                            onChange={(e) => handleCharChange('lavabo', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Maximize2 size={14} /> Varanda</label>
                                        <input
                                            type="number"
                                            value={imovel.varandas ?? ''}
                                            onChange={(e) => handleCharChange('varandas', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Sparkles size={14} /> Área Serv.</label>
                                        <input
                                            type="number"
                                            value={imovel.areaservico ?? 0}
                                            onChange={(e) => handleCharChange('areaservico', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Bed size={14} /> Qto Serv.</label>
                                        <input
                                            type="number"
                                            value={imovel.quartoservico ?? ''}
                                            onChange={(e) => handleCharChange('quartoservico', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                </div>

                                {/* Linha 3: Vaga, Área Útil, Área Const, Área Terreno */}
                                <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', width: '100%', marginTop: '12px' }}>
                                    <div className={styles.formGroup}>
                                        <label><Car size={14} /> Vaga</label>
                                        <input
                                            type="number"
                                            value={imovel.vagas ?? ''}
                                            onChange={(e) => handleCharChange('vagas', e.target.value)}
                                            placeholder="0"
                                            className={styles.rightAlignInput}
                                            min="0"
                                            onFocus={(e) => e.target.select()}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Ruler size={14} /> Área Útil (m²)</label>
                                        <input
                                            type="text"
                                            value={activeField === 'area_util' ? displayValue : formatCurrency(imovel.area_util, false, false, 2)}
                                            onChange={(e) => {
                                                const masked = maskCurrencyInput(e.target.value, false);
                                                setDisplayValue(masked);
                                                handleCharChange('area_util', masked);
                                            }}
                                            onFocus={(e) => {
                                                setActiveField('area_util');
                                                setDisplayValue(formatCurrency(imovel.area_util, false, false, 0));
                                                setTimeout(() => e.target.select(), 0);
                                            }}
                                            onBlur={(e) => {
                                                const completed = completeCurrencyWithZeros(e.target.value);
                                                handleCharChange('area_util', completed);
                                                setActiveField(null);
                                            }}
                                            placeholder="0,00"
                                            className={styles.rightAlignInput}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Ruler size={14} /> Área Const. (m²)</label>
                                        <input
                                            type="text"
                                            value={activeField === 'area_construida' ? displayValue : formatCurrency(imovel.area_construida, false, false, 2)}
                                            onChange={(e) => {
                                                const masked = maskCurrencyInput(e.target.value, false);
                                                setDisplayValue(masked);
                                                handleCharChange('area_construida', masked);
                                            }}
                                            onFocus={(e) => {
                                                setActiveField('area_construida');
                                                setDisplayValue(formatCurrency(imovel.area_construida, false, false, 0));
                                                setTimeout(() => e.target.select(), 0);
                                            }}
                                            onBlur={(e) => {
                                                const completed = completeCurrencyWithZeros(e.target.value);
                                                handleCharChange('area_construida', completed);
                                                setActiveField(null);
                                            }}
                                            placeholder="0,00"
                                            className={styles.rightAlignInput}
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label><Ruler size={14} /> Área Terreno (m²)</label>
                                        <input
                                            type="text"
                                            value={activeField === 'area_terreno' ? displayValue : formatCurrency(imovel.area_terreno, false, false, 2)}
                                            onChange={(e) => {
                                                const masked = maskCurrencyInput(e.target.value, false);
                                                setDisplayValue(masked);
                                                handleCharChange('area_terreno', masked);
                                            }}
                                            onFocus={(e) => {
                                                setActiveField('area_terreno');
                                                setDisplayValue(formatCurrency(imovel.area_terreno, false, false, 0));
                                                setTimeout(() => e.target.select(), 0);
                                            }}
                                            onBlur={(e) => {
                                                const completed = completeCurrencyWithZeros(e.target.value);
                                                handleCharChange('area_terreno', completed);
                                                setActiveField(null);
                                            }}
                                            placeholder="0,00"
                                            className={styles.rightAlignInput}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroupFullWidth} style={{ marginTop: '12px' }}>
                                    <label><Ruler size={14} /> Dim. Terreno</label>
                                    <input
                                        type="text"
                                        value={imovel.dimensoes_terreno || ''}
                                        onChange={(e) => setImovel(prev => prev ? ({ ...prev, dimensoes_terreno: e.target.value }) : null)}
                                        placeholder="EX: 10 X 30"
                                        className={styles.input}
                                        onFocus={(e) => e.target.select()}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', lineHeight: '1.2' }}>
                                        Exemplo: TT: 8m; FR 3,95m; LE 18,11m; LD 25m; FD 4,10m
                                    </p>
                                </div>
                            </div>

                            {/* Área Comum / Lazer */}
                            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px dashed #e2e8f0' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Sparkles size={16} style={{ color: '#7F34E6' }} />
                                    Área Comum e Lazer (Condomínio / Empreendimento)
                                </h3>
                                
                                {/* Subgrupo: Social */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Social</h4>
                                    <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.parque_aquatico} onChange={(e) => setImovel({...imovel, parque_aquatico: e.target.checked})} />
                                            <span>Parque Aquático</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.salao_festas} onChange={(e) => setImovel({...imovel, salao_festas: e.target.checked})} />
                                            <span>Salão de Festas</span>
                                        </label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.5rem 1rem', borderRadius: '0.75rem', border: '1px solid #e2e8f0', background: '#f8fafc', height: '56px', boxSizing: 'border-box' }}>
                                            <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#334155' }}>Espaço Gourmet (Qtd):</span>
                                            <input 
                                                type="number" 
                                                min="0"
                                                style={{ width: '50px', padding: '2px 6px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.875rem', textAlign: 'right', marginLeft: 'auto' }} 
                                                value={imovel.espaco_gourmet ?? 0} 
                                                onChange={(e) => handleCharChange('espaco_gourmet', e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                            />
                                        </div>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.espaco_zen} onChange={(e) => setImovel({...imovel, espaco_zen: e.target.checked})} />
                                            <span>Espaço Zen</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.coworking} onChange={(e) => setImovel({...imovel, coworking: e.target.checked})} />
                                            <span>Coworking</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.piquenique} onChange={(e) => setImovel({...imovel, piquenique: e.target.checked})} />
                                            <span>Piquenique</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.espaco_grill} onChange={(e) => setImovel({...imovel, espaco_grill: e.target.checked})} />
                                            <span>Espaço Grill</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.pet_park} onChange={(e) => setImovel({...imovel, pet_park: e.target.checked})} />
                                            <span>Pet Park</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.supermarket} onChange={(e) => setImovel({...imovel, supermarket: e.target.checked})} />
                                            <span>Supermercado</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.espaco_gamer} onChange={(e) => setImovel({...imovel, espaco_gamer: e.target.checked})} />
                                            <span>Espaço Gamer</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.salao_jogos} onChange={(e) => setImovel({...imovel, salao_jogos: e.target.checked})} />
                                            <span>Salão de Jogos</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.sala_cinema} onChange={(e) => setImovel({...imovel, sala_cinema: e.target.checked})} />
                                            <span>Sala de Cinema</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.playground} onChange={(e) => setImovel({...imovel, playground: e.target.checked})} />
                                            <span>Playground</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Subgrupo: Bem-Estar */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bem-Estar</h4>
                                    <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.sala_yoga} onChange={(e) => setImovel({...imovel, sala_yoga: e.target.checked})} />
                                            <span>Sala de Yoga</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.redario} onChange={(e) => setImovel({...imovel, redario: e.target.checked})} />
                                            <span>Redário</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.horta} onChange={(e) => setImovel({...imovel, horta: e.target.checked})} />
                                            <span>Horta</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.area_convivencia} onChange={(e) => setImovel({...imovel, area_convivencia: e.target.checked})} />
                                            <span>Área de Convivência</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Subgrupo: Esportes */}
                                <div style={{ marginBottom: '20px' }}>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Esportes</h4>
                                    <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.academia} onChange={(e) => setImovel({...imovel, academia: e.target.checked})} />
                                            <span>Academia</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.sala_funcional} onChange={(e) => setImovel({...imovel, sala_funcional: e.target.checked})} />
                                            <span>Sala Funcional</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.quadra_poliesportiva} onChange={(e) => setImovel({...imovel, quadra_poliesportiva: e.target.checked})} />
                                            <span>Quadra Poliesportiva</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.quadra_beach_tennis} onChange={(e) => setImovel({...imovel, quadra_beach_tennis: e.target.checked})} />
                                            <span>Quadra Beach Tennis</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.campo_futebol_society} onChange={(e) => setImovel({...imovel, campo_futebol_society: e.target.checked})} />
                                            <span>Campo Futebol Society</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.quadra_volei_praia} onChange={(e) => setImovel({...imovel, quadra_volei_praia: e.target.checked})} />
                                            <span>Quadra Vôlei de Praia</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.quadra_tenis} onChange={(e) => setImovel({...imovel, quadra_tenis: e.target.checked})} />
                                            <span>Quadra de Tênis</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.ciclovia} onChange={(e) => setImovel({...imovel, ciclovia: e.target.checked})} />
                                            <span>Ciclovia</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.pista_cooper} onChange={(e) => setImovel({...imovel, pista_cooper: e.target.checked})} />
                                            <span>Pista de Cooper</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Subgrupo: Segurança e Conforto */}
                                <div>
                                    <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#64748b', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Segurança e Conforto</h4>
                                    <div className={styles.checkboxGrid} data-checkbox-grid="true">
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.controle_acesso_automatizado} onChange={(e) => setImovel({...imovel, controle_acesso_automatizado: e.target.checked})} />
                                            <span>Acesso Automatizado</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.sala_encomendas_delivery} onChange={(e) => setImovel({...imovel, sala_encomendas_delivery: e.target.checked})} />
                                            <span>Sala de Encomendas</span>
                                        </label>
                                        <label className={styles.checkboxCard}>
                                            <input type="checkbox" className={styles.checkbox} checked={!!imovel.wi_fi_areas_comuns} onChange={(e) => setImovel({...imovel, wi_fi_areas_comuns: e.target.checked})} />
                                            <span>Wi-Fi Áreas Comuns</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. Valores */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <div className={styles.iconBox}><DollarSign size={20} /></div>
                                Valores
                            </h2>
                            
                            <div className={styles.valoresPremiumContainer}>
                                {/* Período de Locação */}
                                {imovel.imbtpoperacao_id === 2 && (
                                    <div className={styles.valorCard}>
                                        <div className={styles.valorLeft}>
                                            <div className={styles.valorIcon}><Calendar size={24} /></div>
                                            <div className={styles.valorInfo}>
                                                <label>Período de Locação</label>
                                                <select
                                                    name="periodo_loca_id"
                                                    value={imovel.periodo_loca_id || 3}
                                                    className={styles.valorInput}
                                                    onChange={(e) => setImovel({ ...imovel, periodo_loca_id: parseInt(e.target.value) })}
                                                    style={{ border: 'none', background: 'transparent', outline: 'none', cursor: 'pointer', paddingRight: '20px' }}
                                                >
                                                    <option value={1}>Semanal</option>
                                                    <option value={2}>Quinzenal</option>
                                                    <option value={3}>Mensal</option>
                                                    <option value={4}>Semestral</option>
                                                    <option value={5}>Anual</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Preço Base */}
                                <div className={styles.valorCard}>
                                    <div className={styles.valorLeft}>
                                        <div className={styles.valorIcon}><DollarSign size={24} /></div>
                                        <div className={styles.valorInfo}>
                                            <label>Preço Base</label>
                                            <input
                                                type="text"
                                                name="preco_base"
                                                value={activeField === 'preco_base' ? displayValue : formatCurrency(imovel.preco_base, false, false)}
                                                className={`${styles.valorInput} ${styles.valorInputPrice}`}
                                                onChange={(e) => {
                                                    const masked = maskCurrencyInput(e.target.value, false);
                                                    setDisplayValue(masked);
                                                    setImovel({ ...imovel, preco_base: parseCurrencyToNumber(masked) });
                                                }}
                                                onFocus={(e) => {
                                                    setActiveField('preco_base');
                                                    setDisplayValue(formatCurrency(imovel.preco_base, false, false, 0));
                                                    setTimeout(() => e.target.select(), 0);
                                                }}
                                                onBlur={(e) => {
                                                    const completed = completeCurrencyWithZeros(e.target.value);
                                                    setImovel({ ...imovel, preco_base: parseCurrencyToNumber(completed) });
                                                    setActiveField(null);
                                                }}
                                                onKeyDown={handleEnterKey}
                                            />
                                        </div>
                                    </div>
                                    <div className={styles.valorRight}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>BRL</span>
                                    </div>
                                </div>

                                {/* Condomínio */}
                                <div className={styles.valorCard}>
                                    <div className={styles.valorLeft}>
                                        <div className={styles.valorIcon}><Building2 size={24} /></div>
                                        <div className={styles.valorInfo}>
                                            <label>Condomínio</label>
                                            <input
                                                type="text"
                                                name="condominio"
                                                className={styles.valorInput}
                                                value={activeField === 'condominio' ? displayValue : formatCurrency(imovel.custom_fields.condominio || 0, false, false)}
                                                onChange={(e) => {
                                                    const masked = maskCurrencyInput(e.target.value, false);
                                                    setDisplayValue(masked);
                                                    setImovel({
                                                        ...imovel,
                                                        custom_fields: { ...imovel.custom_fields, condominio: parseCurrencyToNumber(masked) }
                                                    });
                                                }}
                                                onFocus={(e) => {
                                                    setActiveField('condominio');
                                                    setDisplayValue(formatCurrency(imovel.custom_fields.condominio || 0, false, false, 0));
                                                    setTimeout(() => e.target.select(), 0);
                                                }}
                                                onBlur={(e) => {
                                                    const completed = completeCurrencyWithZeros(e.target.value);
                                                    setImovel({
                                                        ...imovel,
                                                        custom_fields: { ...imovel.custom_fields, condominio: parseCurrencyToNumber(completed) }
                                                    });
                                                    setActiveField(null);
                                                }}
                                                onKeyDown={handleEnterKey}
                                            />
                                        </div>
                                    </div>
                                    {imovel.imbtpoperacao_id === 2 && (
                                        <div className={styles.valorRight}>
                                            <label className={`${styles.toggleLabel} ${imovel.condominio_incluso ? styles.toggleActive : ''}`}>
                                                <span>Incluso</span>
                                                <div className={styles.switch}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!imovel.condominio_incluso}
                                                        onChange={(e) => setImovel({...imovel, condominio_incluso: e.target.checked})}
                                                    />
                                                    <span className={styles.slider}></span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* IPTU */}
                                <div className={styles.valorCard}>
                                    <div className={styles.valorLeft}>
                                        <div className={styles.valorIcon}><FileText size={24} /></div>
                                        <div className={styles.valorInfo}>
                                            <label>IPTU Anual</label>
                                            <input
                                                type="text"
                                                name="iptu"
                                                className={styles.valorInput}
                                                value={activeField === 'iptu' ? displayValue : formatCurrency(imovel.custom_fields.iptu || 0, false, false)}
                                                onChange={(e) => {
                                                    const masked = maskCurrencyInput(e.target.value, false);
                                                    setDisplayValue(masked);
                                                    setImovel({
                                                        ...imovel,
                                                        custom_fields: { ...imovel.custom_fields, iptu: parseCurrencyToNumber(masked) }
                                                    });
                                                }}
                                                onFocus={(e) => {
                                                    setActiveField('iptu');
                                                    setDisplayValue(formatCurrency(imovel.custom_fields.iptu || 0, false, false, 0));
                                                    setTimeout(() => e.target.select(), 0);
                                                }}
                                                onBlur={(e) => {
                                                    const completed = completeCurrencyWithZeros(e.target.value);
                                                    setImovel({
                                                        ...imovel,
                                                        custom_fields: { ...imovel.custom_fields, iptu: parseCurrencyToNumber(completed) }
                                                    });
                                                    setActiveField(null);
                                                }}
                                                onKeyDown={handleEnterKey}
                                            />
                                        </div>
                                    </div>
                                    {imovel.imbtpoperacao_id === 2 && (
                                        <div className={styles.valorRight}>
                                            <label className={`${styles.toggleLabel} ${imovel.iptu_incluso ? styles.toggleActive : ''}`}>
                                                <span>Incluso</span>
                                                <div className={styles.switch}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!imovel.iptu_incluso}
                                                        onChange={(e) => setImovel({...imovel, iptu_incluso: e.target.checked})}
                                                    />
                                                    <span className={styles.slider}></span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Seguro Incêndio */}
                                <div className={styles.valorCard}>
                                    <div className={styles.valorLeft}>
                                        <div className={styles.valorIcon}><ShieldCheck size={24} /></div>
                                        <div className={styles.valorInfo}>
                                            <label>Seguro Incêndio</label>
                                            <input
                                                type="text"
                                                name="seguro_incendio"
                                                className={styles.valorInput}
                                                value={activeField === 'seguro_incendio' ? displayValue : formatCurrency(imovel.seguro_incendio || 0, false, false)}
                                                onChange={(e) => {
                                                    const masked = maskCurrencyInput(e.target.value, false);
                                                    setDisplayValue(masked);
                                                    setImovel({ ...imovel, seguro_incendio: parseCurrencyToNumber(masked) });
                                                }}
                                                onFocus={(e) => {
                                                    setActiveField('seguro_incendio');
                                                    setDisplayValue(formatCurrency(imovel.seguro_incendio || 0, false, false, 0));
                                                    setTimeout(() => e.target.select(), 0);
                                                }}
                                                onBlur={(e) => {
                                                    const completed = completeCurrencyWithZeros(e.target.value);
                                                    setImovel({ ...imovel, seguro_incendio: parseCurrencyToNumber(completed) });
                                                    setActiveField(null);
                                                }}
                                                onKeyDown={handleEnterKey}
                                            />
                                        </div>
                                    </div>
                                    {imovel.imbtpoperacao_id === 2 && (
                                        <div className={styles.valorRight}>
                                            <label className={`${styles.toggleLabel} ${imovel.seguro_incendio_incluso ? styles.toggleActive : ''}`}>
                                                <span>Incluso</span>
                                                <div className={styles.switch}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={!!imovel.seguro_incendio_incluso}
                                                        onChange={(e) => setImovel({...imovel, seguro_incendio_incluso: e.target.checked})}
                                                    />
                                                    <span className={styles.slider}></span>
                                                </div>
                                            </label>
                                        </div>
                                    )}
                                </div>

                                {/* Total de Locação */}
                                {imovel.imbtpoperacao_id === 2 && (
                                    <div className={styles.valorCard} style={{ background: '#f5f3ff', borderColor: '#7F34E6', marginTop: '16px' }}>
                                        <div className={styles.valorLeft}>
                                            <div className={styles.valorIcon} style={{ background: '#7F34E6', color: '#ffffff' }}><DollarSign size={24} /></div>
                                            <div className={styles.valorInfo}>
                                                <label style={{ color: '#7F34E6' }}>Valor Total Aluguel</label>
                                                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#7F34E6' }}>
                                                    {formatCurrency(calculateVrTotal(imovel), false, true)}
                                                </div>
                                            </div>
                                        </div>
                                        <div className={styles.valorRight}>
                                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7F34E6' }}>
                                                {imovel.periodo_loca_id === 1 ? 'SEMANAL' :
                                                 imovel.periodo_loca_id === 2 ? 'QUINZENAL' :
                                                 imovel.periodo_loca_id === 4 ? 'SEMESTRAL' :
                                                 imovel.periodo_loca_id === 5 ? 'ANUAL' : 'MENSAL'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* 5. Divulgação no site */}
                        <section className={styles.section}>
                            <h2 className={styles.sectionTitle}>
                                <div className={styles.iconBox}><Share2 size={20} /></div>
                                Divulgação no site
                            </h2>
                            <div className={styles.featGrid}>
                                <div className={styles.formGroup}>
                                    <label>Status do Anúncio</label>
                                    <select
                                        name="status"
                                        value={imovel.status}
                                        className={styles.select}
                                        onChange={(e) => setImovel({ ...imovel, status: e.target.value })}
                                        style={{ width: '270px' }}
                                    >
                                        <option value="ativo">Ativo - Visível no Site</option>
                                        <option value="pausado">Pausado - Oculto Temporariamente</option>
                                        <option value="vendido">Vendido / Alugado</option>
                                    </select>
                                </div>
                            </div>



                             <div className={styles.formGroupFullWidth}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                    <label className={styles.label} style={{ margin: 0 }}>Título do Anúncio</label>
                                    <button
                                        className={`${styles.geminiBtn} ${aiLoading ? styles.geminiBtnLoading : ''}`}
                                        onClick={generateAiTitle}
                                        title="atualizar para um título sensacional"
                                        disabled={aiLoading}
                                        type="button"
                                        style={{ padding: '6px', borderRadius: '50%', minWidth: '32px', height: '32px', justifyContent: 'center' }}
                                    >
                                        {aiLoading ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Sparkles size={16} />
                                        )}
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={imovel.nome || ''}
                                    onChange={(e) => setImovel({ ...imovel, nome: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div className={styles.formGroupFullWidth}>
                                <label>Descrição Completa</label>
                                <textarea
                                    value={imovel.descricao || ''}
                                    onChange={(e) => setImovel({ ...imovel, descricao: e.target.value })}
                                    rows={6}
                                />
                            </div>
                        </section>
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}
