'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Square, ArrowLeft, Loader2, Camera, Home as HomeIcon, CheckCircle, Building2, X, Milestone, Info, ChevronRight, MessageCircle, Phone, Sparkles, DollarSign, Ruler, Map, MapPin, Navigation } from 'lucide-react';
import styles from './incluir.module.css';
import Link from 'next/link';
import { maskCurrencyInput, formatCurrency, completeCurrencyWithZeros, maskIntegerInput, maskCep } from '@/lib/format';
import { sanitizeLocationName } from '@/lib/sanitize-location';

type SearchMode = 'CEP' | 'Endereço';

interface PropertyData {
    address: string;
    cep: string;
    number: string;
    complement: string;
    quadra_torre_bloco: string;
    unidade: string;
    andar: string;
    objective: string;
    acceptsPets: boolean;
    relationship: string;
    finalidade: string;
    type: string;
    rooms: string;
    bathrooms: string;
    suites: string;
    parking: string;
    area: string;
    area_construida: string;
    area_terreno: string;
    varandas: string;
    areaservico: string;
    quartoservico: string;
    cozinha: string;
    lavabo: string;
    sala: string;
    dimensoes_terreno: string;
    title: string;
    description: string;
    price: string;
    condoFee: string;
    iptuValue: string;
    hasIptu: boolean;
    status: string;
    uf: string;
    cidade: string;
    bairro: string;
    imbtpoperacao_id?: number;
    imbfinalidade_id?: number;
    imbtpimovel_id?: number;
    statusimovel?: number;
}

export default function IncluirImovelPage() {
    const [step, setStep] = useState(1);
    const [searchMode, setSearchMode] = useState<SearchMode>('CEP'); // Default to CEP as per video/screenshot
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [isAddressFound, setIsAddressFound] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isIptuHelpModalOpen, setIsIptuHelpModalOpen] = useState(false);
    const [isCondoHelpModalOpen, setIsCondoHelpModalOpen] = useState(false);
    const [showBairroCreateModal, setShowBairroCreateModal] = useState(false);
    const [pendingPayload, setPendingPayload] = useState<any | null>(null);
    const [bairroCreateLabel, setBairroCreateLabel] = useState('');
    const [ufs, setUfs] = useState<{ sigla: string; nome: string }[]>([]);
    const [cities, setCities] = useState<string[]>([]);
    const [selectedUf, setSelectedUf] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [activeVerification, setActiveVerification] = useState<'estado' | 'cidade' | 'bairro' | null>(null);
    const [resolvedIds, setResolvedIds] = useState({ estadoId: 0, cidadeId: 0, bairroId: 0 });
    const [locationRefreshTrigger, setLocationRefreshTrigger] = useState(0);
    const abortControllerRef = useRef<AbortController | null>(null);
    const lastSearchedCep = useRef<string>('');
    const debounceTimer = useRef<NodeJS.Timeout | null>(null);

    // Dynamic Categories & Types
    const [categories, setCategories] = useState<{ id: number; descricao: string }[]>([]);
    const [propertyTypesList, setPropertyTypesList] = useState<{ id: number; descricao: string }[]>([]);
    const [operacoes, setOperacoes] = useState<{ id: number; descricao: string }[]>([]);
    const [propertyStatuses, setPropertyStatuses] = useState<{ id: number; nome: string }[]>([]);

    const [formData, setFormData] = useState<PropertyData>({
        address: '',
        cep: '',
        number: '',
        complement: '',
        quadra_torre_bloco: '',
        unidade: '',
        andar: '',
        objective: 'Alugar',
        acceptsPets: true,
        relationship: 'Proprietário',
        finalidade: '',
        type: 'Apartamento',
        rooms: '0',
        bathrooms: '0',
        suites: '0',
        parking: '0',
        area: '',
        area_construida: '',
        area_terreno: '',
        varandas: '0',
        areaservico: '0',
        quartoservico: '0',
        cozinha: '0',
        lavabo: '0',
        sala: '0',
        dimensoes_terreno: '',
        title: '',
        description: '',
        price: '',
        condoFee: '',
        iptuValue: '',
        hasIptu: true,
        status: 'Pendente',
        uf: '',
        cidade: '',
        bairro: '',
        imbtpoperacao_id: undefined,
        imbfinalidade_id: undefined,
        imbtpimovel_id: undefined,
        statusimovel: 2 // Default to Pendente (ID 2)
    });

    // Fetch UFs from IBGE
    useEffect(() => {
        const fetchUfs = async () => {
            try {
                const res = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome');
                const data = await res.json();
                setUfs(data.map((uf: any) => ({ sigla: uf.sigla, nome: uf.nome })));
            } catch (error) {
                console.error('Error fetching UFs:', error);
            }
        };
        fetchUfs();
    }, []);

    // Fetch Cities when UF changes
    useEffect(() => {
        const fetchCities = async () => {
            if (!selectedUf) {
                setCities([]);
                return;
            }
            try {
                const res = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${selectedUf}/municipios?orderBy=nome`);
                const data = await res.json();
                setCities(data.map((c: any) => c.nome.toUpperCase()));
            } catch (error) {
                console.error('Error fetching cities:', error);
            }
        };
        fetchCities();
    }, [selectedUf]);

    // Fetch Categories for Step 3
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
        fetchCategories();
    }, []);
    
    // Fetch Operacoes
    useEffect(() => {
        const fetchOperacoes = async () => {
            try {
                const res = await fetch('/api/property/operacoes');
                const data = await res.json();
                if (Array.isArray(data)) setOperacoes(data);
            } catch (error) {
                console.error('Error fetching operacoes:', error);
            }
        };
        fetchOperacoes();
    }, []);

    // Fetch Statuses
    useEffect(() => {
        const fetchStatuses = async () => {
            try {
                const res = await fetch('/api/property/status');
                const data = await res.json();
                if (Array.isArray(data)) setPropertyStatuses(data);
            } catch (error) {
                console.error('Error fetching statuses:', error);
            }
        };
        fetchStatuses();
    }, []);

    // Fetch Property Types when Finalidade changes
    useEffect(() => {
        const fetchTypes = async () => {
            if (!formData.finalidade) {
                setPropertyTypesList([]);
                return;
            }
            try {
                // Find ID from name
                const category = categories.find(c => c.descricao === formData.finalidade);
                if (!category) return;

                const res = await fetch(`/api/property/types?category_id=${category.id}`);
                const data = await res.json();
                setPropertyTypesList(data);

                // Reset type if it's no longer valid for the new category
                if (data.length > 0 && !data.find((t: any) => t.descricao === formData.type)) {
                    setFormData(prev => ({ ...prev, type: data[0].descricao }));
                }
            } catch (error) {
                console.error('Error fetching property types:', error);
            }
        };
        fetchTypes();
    }, [formData.finalidade, categories]);
    
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

    useEffect(() => {

        const searchAddress = async (signal: AbortSignal) => {
            if (searchMode === 'Endereço' && !isAddressFound) {
                if (formData.address.trim().length >= 3) {
                    setLoading(true);
                    try {
                        // 1. Fetch from Local Database
                        let localTransformed: any[] = [];
                        try {
                            const localRes = await fetchWithTimeout(`/api/imoveis/search-suggestions?q=${encodeURIComponent(formData.address.trim())}`, { signal }, 6000);
                            if (localRes.ok) {
                                const localData = await localRes.json();
                                localTransformed = localData.map((item: any) => ({
                                    properties: {
                                        name: item.label,
                                        street: item.type === 'endereco' ? item.label : '',
                                        district: item.neighborhood || '',
                                        city: item.city,
                                        state: item.uf,
                                        country: 'Brasil',
                                        cep: ''
                                    },
                                    type: item.type,
                                    isLocal: true
                                }));
                            }
                        } catch (err: any) {
                            if (err.name !== 'AbortError') console.error('Local search error:', err);
                        }

                        if (signal.aborted) return;

                        // 2. Fetch from External (ViaCEP or Photon)
                        let externalTransformed: any[] = [];
                        try {
                            if (selectedUf && selectedCity) {
                                const res = await fetchWithTimeout(`https://viacep.com.br/ws/${selectedUf}/${encodeURIComponent(selectedCity)}/${encodeURIComponent(formData.address.trim())}/json/`, { signal }, 10000);
                                const data = await res.json();
                                if (Array.isArray(data)) {
                                    externalTransformed = data.map((item: any) => ({
                                        properties: {
                                            name: item.logradouro,
                                            street: item.logradouro,
                                            district: item.bairro,
                                            city: item.localidade,
                                            state: item.uf,
                                            country: 'Brasil',
                                            cep: item.cep,
                                            complement: item.complemento
                                        },
                                        type: 'endereco'
                                    }));
                                }
                            } else {
                                const res = await fetchWithTimeout(`https://photon.komoot.io/api/?q=${encodeURIComponent(formData.address.trim())}&limit=6&lang=en&bbox=-74.0,-34.0,-28.0,6.0`, { signal }, 8000);
                                const data = await res.json();
                                externalTransformed = (data.features || []).map((f: any) => ({
                                    ...f,
                                    properties: {
                                        ...f.properties,
                                        cep: f.properties.postcode || ''
                                    }
                                }));
                            }
                        } catch (err: any) {
                            if (err.name !== 'AbortError') console.error('External search error:', err);
                        }
                        
                        if (signal.aborted) return;

                        // Merge results (Local first)
                        setSuggestions([...localTransformed, ...externalTransformed]);
                        setSelectedIndex(-1);
                    } catch (error: any) {
                        if (error.name !== 'AbortError') console.error('General search error:', error);
                    } finally {
                        if (!signal.aborted) setLoading(false);
                    }
                }
            } else {
                setSuggestions([]);
            }
        };

        const controller = new AbortController();
        const timeoutId = setTimeout(() => searchAddress(controller.signal), 300);
        return () => {
            clearTimeout(timeoutId);
            controller.abort();
        };
    }, [formData.address, searchMode, isAddressFound, selectedUf, selectedCity]);

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        if (name === 'cep') {
            const cleanCep = value.replace(/\D/g, '').substring(0, 8);
            
            // Format for display: #####-###
            const display = maskCep(cleanCep);
            
            setFormData(prev => ({ ...prev, cep: display }));

            // Reset loading and previous search
            setLoading(false);
            if (debounceTimer.current) clearTimeout(debounceTimer.current);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
                abortControllerRef.current = null;
            }

            if (cleanCep.length === 8 && cleanCep !== lastSearchedCep.current) {
                setLoading(true);
                debounceTimer.current = setTimeout(async () => {
                    const controller = new AbortController();
                    abortControllerRef.current = controller;
                    try {
                        const res = await fetchWithTimeout(`https://viacep.com.br/ws/${cleanCep}/json/`, {
                            signal: controller.signal
                        }, 5000);
                        const data = await res.json();
                        if (!data.erro) {
                            lastSearchedCep.current = cleanCep;
                            setFormData(prev => ({
                                ...prev,
                                address: sanitizeLocationName((data.logradouro || '').split(',')[0].split('-')[0].trim()),
                                uf: sanitizeLocationName(data.uf || ''),
                                cidade: sanitizeLocationName(data.localidade || ''),
                                bairro: sanitizeLocationName(data.bairro || '')
                            }));
                            setSelectedUf(sanitizeLocationName(data.uf || ''));
                            setSelectedCity(sanitizeLocationName(data.localidade || ''));
                            setIsAddressFound(true);
                        }
                    } catch (error: any) {
                        if (error.name !== 'AbortError') {
                            console.error('Error fetching CEP:', error);
                        }
                    } finally {
                        if (abortControllerRef.current === controller) {
                            setLoading(false);
                            abortControllerRef.current = null;
                        }
                    }
                }, 300);
            } else if (cleanCep.length < 8) {
                lastSearchedCep.current = '';
                setIsAddressFound(false);
            }
            return;
        }

        if (name === 'address' && searchMode === 'Endereço') {
            setFormData(prev => ({ ...prev, address: sanitizeLocationName(value, false) }));
            if (isAddressFound) setIsAddressFound(false);
            return;
        }

        const addressFields = ['address', 'number', 'complement', 'quadra_torre_bloco', 'unidade', 'andar', 'bairro', 'cidade', 'uf'];
        const finalValue = addressFields.includes(name) ? sanitizeLocationName(value, false) : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSuggestionSelect = (feature: any) => {
        const props = feature.properties;
        const main = props.street || props.name || '';
        const district = props.district || props.suburb || '';
        const city = props.city || '';
        const state = props.state || '';

        const fullAddress = `${main}${district ? `, ${district}` : ''}${city ? ` - ${city}` : ''}${state ? `, ${state}` : ''}`.toUpperCase();

        setFormData(prev => ({
            ...prev,
            address: sanitizeLocationName(main.split(',')[0].split('-')[0].trim()),
            cep: props.cep ? maskCep(props.cep) : prev.cep,
            uf: sanitizeLocationName(state || ''),
            cidade: sanitizeLocationName(city || ''),
            bairro: sanitizeLocationName(district || ''),
        }));
        setSelectedUf((state || '').toUpperCase());
        setSelectedCity((city || '').toUpperCase());
        setSuggestions([]);
        setIsAddressFound(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent, nextAction?: 'next' | string) => {
        if (suggestions.length > 0 && searchMode === 'Endereço') {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
                return;
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
                return;
            }
            if (e.key === 'Enter' && selectedIndex >= 0) {
                e.preventDefault();
                handleSuggestionSelect(suggestions[selectedIndex]);
                return;
            }
        }

        if (e.key === 'Enter') {
            e.preventDefault();

            // Força formatação se for campo de moeda (completando com zeros se necessário)
            const target = e.target as HTMLInputElement;
            if (['price', 'condoFee', 'iptuValue'].includes(target.name)) {
                const formatted = completeCurrencyWithZeros(target.value, false);
                if (formatted) {
                    setFormData(prev => ({ ...prev, [target.name]: formatted }));
                }
            }

            if (nextAction === 'next') {
                handleNext();
            } else if (nextAction) {
                const element = document.getElementsByName(nextAction)[0] as HTMLElement;
                if (element) {
                    element.focus();
                    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement) {
                        element.select();
                    }
                }
            }
        }
    };

    const handleNext = async () => {
        if (step === 1) {
            // Sequential Verification Chain
            const success = await verifyLocationSequence();
            if (!success) return; 
        }
        setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const verifyLocationSequence = async () => {
        setLoading(true);
        try {
            // 1. Check Estado
            const sigla = formData.uf || selectedUf;
            if (!sigla) {
                alert('UF não informada');
                return false;
            }

            const estRes = await fetch(`/api/property/cidades?uf=${sigla}`); // We can use cidades API to get estadoId
            // Actually, let's use a cleaner way. GET /api/property/estados and find.
            const allEstsRes = await fetch('/api/property/estados');
            const allEsts = await allEstsRes.json();
            const normalizedSigla = sigla.trim().toUpperCase();
            const matchedEst = allEsts.find((e: any) => e.sigla.trim().toUpperCase() === normalizedSigla);

            if (!matchedEst) {
                setBairroCreateLabel(sigla);
                setActiveVerification('estado');
                setShowBairroCreateModal(true);
                return false;
            }
            const estadoId = matchedEst.id;
            setResolvedIds(prev => ({ ...prev, estadoId }));

            // 2. Check Cidade
            const cidadeNome = formData.cidade || selectedCity;
            if (!cidadeNome) {
                alert('Cidade não informada');
                return false;
            }

            const cidRes = await fetch(`/api/property/cidades?estado_id=${estadoId}`);
            const cities = await cidRes.json();
            const normalizedCid = cidadeNome.trim().toUpperCase();
            const matchedCid = cities.find((c: any) => c.nome.trim().toUpperCase() === normalizedCid);

            if (!matchedCid) {
                setBairroCreateLabel(cidadeNome);
                setActiveVerification('cidade');
                setShowBairroCreateModal(true);
                return false;
            }
            const cidadeId = matchedCid.id;
            setResolvedIds(prev => ({ ...prev, cidadeId }));

            // 3. Check Bairro
            const bairroNome = formData.bairro;
            if (!bairroNome) {
                // Neighborhood is optional? In some designs Yes, but here we check it.
                return true; 
            }

            const baiRes = await fetch(`/api/property/bairros?cidade_id=${cidadeId}`);
            const bairros = await baiRes.json();
            const normalizedBai = bairroNome.trim().toUpperCase();
            const matchedBai = bairros.find((b: any) => b.nome.trim().toUpperCase() === normalizedBai);

            if (!matchedBai) {
                setBairroCreateLabel(bairroNome);
                setActiveVerification('bairro');
                setShowBairroCreateModal(true);
                return false;
            }
            setResolvedIds(prev => ({ ...prev, bairroId: matchedBai.id }));

            return true;
        } catch (error) {
            console.error('Error in verification sequence:', error);
            alert('Erro ao verificar localização');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        setStep(step - 1);
        window.scrollTo(0, 0);
    };

    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        // Decimais: area, area_construida, area_terreno, price, condoFee, iptuValue
        const isDecimal = ['area', 'area_construida', 'area_terreno', 'price', 'condoFee', 'iptuValue'].includes(name);
        
        if (isDecimal) {
            setFormData(prev => ({ ...prev, [name]: maskCurrencyInput(value, false) }));
        } else {
            // Inteiros: rooms, bathrooms, suites, parking, varandas, areaservico, quartoservico, cozinha, lavabo
            setFormData(prev => ({ ...prev, [name]: maskIntegerInput(value) }));
        }
    };

    const handleCurrencyBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        const isDecimal = ['area', 'area_construida', 'area_terreno', 'price', 'condoFee', 'iptuValue'].includes(name);
        
        if (isDecimal) {
            setFormData(prev => ({ ...prev, [name]: completeCurrencyWithZeros(value, false) }));
        }
    };

    const [aiLoading, setAiLoading] = useState(false);

    const generateAiTitle = async () => {
        setAiLoading(true);
        try {
            const res = await fetch('/api/property/generate-title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (data.title) {
                setFormData(prev => ({ ...prev, title: data.title.toUpperCase() }));
            }
        } catch (error) {
            console.error('Error with AI title generation:', error);
        } finally {
            setAiLoading(false);
        }
    };

    const buildSubmitPayload = (autoCreateBairro: boolean = false) => ({
        ...formData,
        cep: formData.cep ? formData.cep.replace(/\D/g, '') : '',
        autoCreateBairro,
        uf: formData.uf || selectedUf || '',
        cidade: formData.cidade || selectedCity || '',
        bairro: formData.bairro || '',
        estado_id: resolvedIds.estadoId,
        cidade_id: resolvedIds.cidadeId,
        bairro_id: resolvedIds.bairroId,
        imbtpoperacao_id: formData.imbtpoperacao_id,
        imbfinalidade_id: formData.imbfinalidade_id,
        imbtpimovel_id: formData.imbtpimovel_id,
        statusimovel: formData.statusimovel
    });

    const submitProperty = async (payload: any) => {
        const res = await fetch('/api/property/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        return { res, data };
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = buildSubmitPayload(false);
            const { res, data } = await submitProperty(payload);

            if (res.status === 409 && data?.needsBairroCreation) {
                setPendingPayload({ ...payload, autoCreateBairro: true });
                setBairroCreateLabel(data?.details?.bairroNome || 'bairro informado');
                setShowBairroCreateModal(true);
                return;
            }

            if (data.success) {
                setSuccess(true);
                window.location.href = `/meus-imoveis?id=${data.id}&refresh=${Date.now()}`;
                return;
            }

            alert(data.error || 'Erro ao cadastrar imóvel');
        } catch (error) {
            console.error('Error submitting property:', error);
            alert('Erro ao conectar com o servidor');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCreateBairro = async () => {
        setLoading(true);
        try {
            let res;
            if (activeVerification === 'estado') {
                res = await fetch('/api/property/estados', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sigla: formData.uf || selectedUf, nome: formData.uf || selectedUf })
                });
            } else if (activeVerification === 'cidade') {
                res = await fetch('/api/property/cidades', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao: formData.cidade || selectedCity, estado_id: resolvedIds.estadoId })
                });
            } else if (activeVerification === 'bairro') {
                res = await fetch('/api/property/bairros', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descricao: formData.bairro, cidade_id: resolvedIds.cidadeId, estado_id: resolvedIds.estadoId })
                });
            }

            const data = await res?.json();
            if (data?.success) {
                const newId = Number(data.id);
                if (activeVerification === 'estado') setResolvedIds(prev => ({ ...prev, estadoId: newId }));
                else if (activeVerification === 'cidade') setResolvedIds(prev => ({ ...prev, cidadeId: newId }));
                else if (activeVerification === 'bairro') setResolvedIds(prev => ({ ...prev, bairroId: newId }));

                // Refresh local lists if needed
                setLocationRefreshTrigger(prev => prev + 1);

                setShowBairroCreateModal(false);
                setActiveVerification(null);
                // Return focus to CEP
                const cepInput = document.getElementsByName('cep')[0] || document.getElementsByName('address')[0];
                if (cepInput) (cepInput as HTMLElement).focus();
                return;
            }
            alert(data?.error || 'Erro ao cadastrar');
        } catch (error) {
            console.error('Error registering:', error);
            alert('Erro de conexão');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className={styles.container}>
                <aside className={styles.sidebar}>
                    <div className={styles.logoIcon}>
                        <Square size={60} strokeWidth={2.5} color="#ffffff" />
                    </div>
                    <h1 className={styles.sidebarTitle}>Cadastro de<br />imóvel</h1>
                </aside>
                <main className={`${styles.mainContent} items-center justify-center text-center`}>
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                        <CheckCircle size={48} className="text-green-600" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">Imóvel Cadastrado!</h2>
                    <p className="text-gray-600 mb-8 max-w-md">
                        Seu imóvel foi registrado com sucesso e já está disponível para visualização em "Meus Imóveis".
                    </p>
                    <Link href="/meus-imoveis" className={styles.btnPrimary}>
                        Ver Meus Imóveis
                    </Link>
                </main>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.sidebarNav}>
                    <Link href="/meus-imoveis" className={styles.backLink}>
                        <ArrowLeft size={20} />
                        Voltar para Meus Imóveis
                    </Link>
                </div>

                <div className={styles.logoIcon}>
                    <Square size={60} strokeWidth={2.5} color="#ffffff" />
                </div>
                <h1 className={styles.sidebarTitle}>
                    Cadastro de<br />imóvel
                </h1>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                <div className={styles.stepHeader}>
                    <h2 className={styles.stepTitle}>
                        {step === 1 && 'Dados iniciais'}
                        {step === 2 && 'Sobre seu anúncio'}
                        {step === 3 && 'Detalhes do imóvel'}
                        {step === 4 && 'Condomínio e IPTU'}
                        {step === 5 && 'Finalização'}
                    </h2>
                    <span className={styles.stepIndicator}>Etapa {step} de 5</span>
                </div>

                <div className={styles.divider}></div>

                {step === 1 && (
                    <div className={styles.formContent}>
                        {!isAddressFound ? (
                            <>
                                <div className={styles.toggleContainer}>
                                    <button
                                        className={`${styles.toggleButton} ${searchMode === 'CEP' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                                        onClick={() => setSearchMode('CEP')}
                                    >
                                        CEP
                                    </button>
                                    <button
                                        className={`${styles.toggleButton} ${searchMode === 'Endereço' ? styles.toggleButtonActive : styles.toggleButtonInactive}`}
                                        onClick={() => setSearchMode('Endereço')}
                                    >
                                        Endereço
                                    </button>
                                </div>

                                <h3 className={styles.question}>
                                    {searchMode === 'Endereço' ? 'Qual o endereço do imóvel?' : 'Qual o CEP do imóvel?'}
                                </h3>

                                {searchMode === 'Endereço' && (
                                    <div className={styles.locationGrid}>
                                        <div className={styles.formGroup}>
                                            <p className={styles.subQuestion} style={{ marginBottom: '8px' }}>UF</p>
                                            <select
                                                name="uf-select"
                                                className={styles.select}
                                                value={selectedUf}
                                                onChange={(e) => {
                                                    setSelectedUf(e.target.value);
                                                    setSelectedCity('');
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        address: '',
                                                        uf: e.target.value.toUpperCase(),
                                                        cidade: '',
                                                        bairro: '',
                                                    }));
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && selectedUf) {
                                                        e.preventDefault();
                                                        document.getElementsByName('city-select')[0]?.focus();
                                                    }
                                                }}
                                                style={{ height: '60px', borderRadius: '12px' }}
                                            >
                                                <option value="">UF</option>
                                                {ufs.map(uf => (
                                                    <option key={uf.sigla} value={uf.sigla}>{uf.sigla}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className={styles.formGroup}>
                                            <p className={styles.subQuestion} style={{ marginBottom: '8px' }}>Cidade</p>
                                            <select
                                                name="city-select"
                                                className={styles.select}
                                                value={selectedCity}
                                                onChange={(e) => {
                                                    setSelectedCity(e.target.value);
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        address: '',
                                                        cidade: e.target.value.toUpperCase(),
                                                        uf: selectedUf.toUpperCase(),
                                                    }));
                                                }}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' && selectedCity) {
                                                        e.preventDefault();
                                                        document.getElementsByName('address')[0]?.focus();
                                                    }
                                                }}
                                                disabled={!selectedUf}
                                                style={{ height: '60px', borderRadius: '12px' }}
                                            >
                                                <option value="">Selecione a cidade</option>
                                                {cities.map(city => (
                                                    <option key={city} value={city}>{city}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}


                                <div className={styles.inputWrapper}>
                                    <input
                                        type="text"
                                        name={searchMode === 'CEP' ? 'cep' : 'address'}
                                        className={styles.input}
                                        placeholder={searchMode === 'Endereço' ? 'Exemplo: Rua Girassol' : '00000-000'}
                                        maxLength={searchMode === 'CEP' ? 9 : 255}
                                        value={searchMode === 'CEP' ? formData.cep : formData.address}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, searchMode === 'Endereço' ? undefined : 'next')}
                                        autoFocus
                                        autoComplete="off"
                                        role="combobox"
                                        aria-autocomplete="list"
                                        aria-expanded={suggestions.length > 0}
                                        aria-haspopup="listbox"
                                        disabled={searchMode === 'Endereço' && !selectedCity}
                                    />
                                    {(formData.address || formData.cep) && (
                                        <button
                                            className={styles.inputClear}
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, address: '', cep: '' }));
                                                setSuggestions([]);
                                                setSelectedIndex(-1);
                                            }}
                                        >
                                            <X size={20} />
                                        </button>
                                    )}
                                    {loading && (
                                        <div style={{ 
                                            position: 'absolute', 
                                            right: (formData.address || formData.cep) ? '55px' : '16px', 
                                            top: '50%', 
                                            transform: 'translateY(-50%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            zIndex: 5,
                                            pointerEvents: 'none'
                                        }}>
                                            <span style={{ fontSize: '14px', color: '#2B47C5', fontWeight: 600 }}>Consultando...</span>
                                            <Loader2 className="animate-spin text-blue-600" size={20} />
                                        </div>
                                    )}

                                    {/* Suggestions Dropdown */}
                                    {searchMode === 'Endereço' && suggestions.length > 0 && (
                                        <div className={styles.suggestionList} role="listbox">
                                            {suggestions.map((feature, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`${styles.suggestionItem} ${selectedIndex === idx ? styles.suggestionActive : ''}`}
                                                    onClick={() => handleSuggestionSelect(feature)}
                                                    role="option"
                                                    aria-selected={selectedIndex === idx}
                                                >
                                                    <div className={styles.suggestionIcon}>
                                                        {feature.type === 'cidade' ? <Map size={22} /> : 
                                                         feature.type === 'bairro' ? <Navigation size={22} /> : 
                                                         <MapPin size={22} />}
                                                    </div>
                                                    <div className={styles.suggestionInfo}>
                                                        <span className={styles.suggestionMain}>
                                                            {feature.properties.name || feature.properties.street}
                                                        </span>
                                                        <span className={styles.suggestionSub}>
                                                            {feature.properties.district ? feature.properties.district + ', ' : ''}
                                                            {feature.properties.city} - {feature.properties.state}
                                                            {feature.properties.complement ? ` | ${feature.properties.complement}` : ''}
                                                            {feature.properties.cep ? ` | CEP: ${feature.properties.cep}` : ''}
                                                            {feature.isLocal ? ' • Base' : ' • Brasil'}
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchMode === 'Endereço' && !loading && formData.address.trim().length >= 3 && suggestions.length === 0 && !isAddressFound && (
                                        <div className={styles.suggestionList}>
                                            <div className={styles.noResults}>
                                                <Info size={20} className="text-gray-400" />
                                                <span>Nenhum endereço encontrado para "{formData.address.trim()}"</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {formData.address.length > 5 || (searchMode === 'CEP' && formData.cep.length === 8) ? (
                                    <div className={styles.navigation}>
                                        <button className={styles.btnPrimary} onClick={handleNext}>
                                            Continuar
                                        </button>
                                    </div>
                                ) : (
                                    <p className={styles.hint}>
                                        Informe o {searchMode.toLowerCase()} para continuar
                                    </p>
                                )}
                            </>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <div className={styles.addressConfirmBox}>
                                    <div className={styles.addressInfo}>
                                        <Building2 size={24} className="text-gray-600" />
                                        <div className={styles.addressDetails}>
                                            <span className={styles.addressText}>{formData.address}</span>
                                            {(formData.bairro || formData.cidade) && (
                                                <span className={styles.locationDetailText}>
                                                    {formData.bairro}{formData.bairro && (formData.cidade || formData.uf) ? ', ' : ''}
                                                    {formData.cidade}{formData.cidade && formData.uf ? ` - ${formData.uf}` : formData.uf}
                                                </span>
                                            )}
                                            {formData.cep && <span className={styles.cepText}>CEP: {formData.cep}</span>}
                                        </div>
                                    </div>
                                    <button
                                        className={styles.changeButton}
                                        onClick={() => {
                                            setIsAddressFound(false);
                                            setFormData(prev => ({ ...prev, cep: '', address: '' }));
                                        }}
                                    >
                                        Mudar
                                    </button>
                                </div>

                                <div className={styles.formGroup}>
                                    <h3 className={styles.question}>Número</h3>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="text"
                                            name="number"
                                            className={styles.input}
                                            placeholder="Ex: 555"
                                            value={formData.number}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, 'complement')}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                                    <h3 className={styles.question}>Complemento</h3>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="text"
                                            name="complement"
                                            className={styles.input}
                                            placeholder="Ex: 349 – A"
                                            value={formData.complement}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, 'next')}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                                    <h3 className={styles.question}>Quadra / Torre / Bloco</h3>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="text"
                                            name="quadra_torre_bloco"
                                            className={styles.input}
                                            placeholder="Ex: TORRE A"
                                            value={formData.quadra_torre_bloco}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, 'unidade')}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                                    <h3 className={styles.question}>Unidade</h3>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="text"
                                            name="unidade"
                                            className={styles.input}
                                            placeholder="Ex: 12B"
                                            value={formData.unidade}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, 'andar')}
                                        />
                                    </div>
                                </div>

                                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                                    <h3 className={styles.question}>Andar</h3>
                                    <div className={styles.inputWrapper}>
                                        <input
                                            type="text"
                                            name="andar"
                                            className={styles.input}
                                            placeholder="Ex: 5"
                                            value={formData.andar}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, 'type')}
                                        />
                                    </div>
                                </div>

                                <div className={styles.sectionBox}>
                                    <h3 className={styles.sectionLabel}>Imóvel</h3>
                                    
                                    <div className={styles.formGroup}>
                                        <p className={styles.subQuestion} style={{ marginBottom: '8px' }}>Tipo de Operação</p>
                                        <select
                                            name="imbtpoperacao_id"
                                            className={styles.select}
                                            value={formData.imbtpoperacao_id || ''}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                const opObj = operacoes.find(op => op.id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    imbtpoperacao_id: id || undefined,
                                                    objective: opObj ? opObj.descricao : ''
                                                }));
                                            }}
                                            style={{ marginBottom: '24px' }}
                                        >
                                            <option value="">Selecione...</option>
                                            {operacoes.map(op => (
                                                <option key={op.id} value={op.id}>{op.descricao}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <p className={styles.subQuestion} style={{ marginBottom: '8px' }}>Finalidade</p>
                                        <div className={styles.pillGroup} style={{ marginTop: 0, marginBottom: '24px' }}>
                                            {categories.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    type="button"
                                                    className={`${styles.pillButton} ${formData.imbfinalidade_id === cat.id ? styles.pillButtonActive : ''}`}
                                                    onClick={() => setFormData(prev => ({ 
                                                        ...prev, 
                                                        finalidade: cat.descricao,
                                                        imbfinalidade_id: cat.id 
                                                    }))}
                                                >
                                                    {cat.descricao}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <p className={styles.subQuestion} style={{ marginBottom: '8px' }}>Tipo de Imóvel</p>
                                        <select
                                            name="imbtpimovel_id"
                                            className={styles.select}
                                            value={formData.imbtpimovel_id || ''}
                                            onChange={(e) => {
                                                const id = parseInt(e.target.value);
                                                const typeObj = propertyTypesList.find(t => t.id === id);
                                                setFormData(prev => ({ 
                                                    ...prev, 
                                                    imbtpimovel_id: id || undefined,
                                                    type: typeObj ? typeObj.descricao : ''
                                                }));
                                            }}
                                            disabled={!formData.imbfinalidade_id}
                                            style={{ marginBottom: '24px' }}
                                        >
                                            <option value="">Selecione a finalidade primeiro</option>
                                            {propertyTypesList.map(tp => (
                                                <option key={tp.id} value={tp.id}>{tp.descricao}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Status removed as requested - forced to Pendente by default */}
                                </div>

                                <div className={styles.navigation}>
                                    <button
                                        className={styles.btnPrimary}
                                        onClick={handleNext}
                                        disabled={!formData.number || !formData.imbfinalidade_id || !formData.imbtpimovel_id}
                                    >
                                        Continuar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {step === 2 && (
                    <div className={styles.formContent}>
                        {(formData.objective === 'Alugar' || formData.objective === 'Alugar ou vender') && (
                            <div className={styles.toggleRow}>
                                <div className={styles.toggleLabelGroup}>
                                    <h3 className={styles.question} style={{ marginBottom: 0 }}>Aceito animais de estimação</h3>
                                    <p className={styles.toggleDescription}>Aumenta sua chance de alugar</p>
                                </div>
                                <label className={styles.switch}>
                                    <input
                                        type="checkbox"
                                        checked={formData.acceptsPets}
                                        onChange={(e) => setFormData(prev => ({ ...prev, acceptsPets: e.target.checked }))}
                                    />
                                    <span className={styles.slider}></span>
                                </label>
                            </div>
                        )}

                        <div className={styles.formGroup} style={{ marginTop: '32px' }}>
                            <h3 className={styles.question}>Sua relação com o imóvel</h3>
                            <div className={styles.pillGroup}>
                                {['Proprietário', 'Administrador/Outro'].map((rel) => (
                                    <button
                                        key={rel}
                                        type="button"
                                        className={`${styles.pillButton} ${formData.relationship === rel ? styles.pillButtonActive : ''}`}
                                        onClick={() => setFormData(prev => ({ ...prev, relationship: rel }))}
                                    >
                                        {rel}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className={styles.navigation}>
                            <button className={styles.btnSecondary} onClick={handlePrev}>Voltar</button>
                            <button className={styles.btnPrimary} onClick={handleNext}>Continuar</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className={styles.formContent}>
                        <div className={styles.gridDetails}>
                            <div style={{ gridColumn: 'span 2', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <Ruler size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Área Útil (m²)
                                    </label>
                                    <input
                                        type="text"
                                        name="area"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0,00"
                                        value={formData.area}
                                        onChange={handleCurrencyChange}
                                        onBlur={handleCurrencyBlur}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleKeyDown(e, 'area_construida')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <Ruler size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Área Const. (m²)
                                    </label>
                                    <input
                                        type="text"
                                        name="area_construida"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0,00"
                                        value={formData.area_construida}
                                        onChange={handleCurrencyChange}
                                        onBlur={handleCurrencyBlur}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleKeyDown(e, 'area_terreno')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>
                                        <Ruler size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                        Área Terreno (m²)
                                    </label>
                                    <input
                                        type="text"
                                        name="area_terreno"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0,00"
                                        value={formData.area_terreno}
                                        onChange={handleCurrencyChange}
                                        onBlur={handleCurrencyBlur}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleKeyDown(e, 'rooms')}
                                    />
                                </div>
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Dormitório</label>
                                <input
                                    type="text"
                                    name="rooms"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.rooms}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'suites')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Suíte</label>
                                <input
                                    type="text"
                                    name="suites"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.suites}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'bathrooms')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Banheiro</label>
                                <input
                                    type="text"
                                    name="bathrooms"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.bathrooms}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'parking')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Vaga</label>
                                <input
                                    type="text"
                                    name="parking"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.parking}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'varandas')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Varanda</label>
                                <input
                                    type="text"
                                    name="varandas"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.varandas}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'quartoservico')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Qto Serv.</label>
                                <input
                                    type="text"
                                    name="quartoservico"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.quartoservico}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'cozinha')}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Cozinha</label>
                                <input
                                    type="text"
                                    name="cozinha"
                                    className={`${styles.select} ${styles.rightAlignInput}`}
                                    placeholder="0"
                                    value={formData.cozinha}
                                    onChange={handleCurrencyChange}
                                    onKeyDown={(e) => handleKeyDown(e, 'lavabo')}
                                />
                            </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Lavabo</label>
                                    <input
                                        type="text"
                                        name="lavabo"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0"
                                        value={formData.lavabo}
                                        onChange={handleCurrencyChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'sala')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Sala</label>
                                    <input
                                        type="text"
                                        name="sala"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0"
                                        value={formData.sala}
                                        onChange={handleCurrencyChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'areaservico')}
                                    />
                                </div>
                                <div className={styles.formGroup}>
                                    <label className={styles.label}>Área Serv.</label>
                                    <input
                                        type="text"
                                        name="areaservico"
                                        className={`${styles.select} ${styles.rightAlignInput}`}
                                        placeholder="0"
                                        value={formData.areaservico}
                                        onChange={handleCurrencyChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'dimensoes_terreno')}
                                    />
                                </div>
                                <div className={styles.formGroup} style={{ gridColumn: 'span 2' }}>
                                    <label className={styles.label}>Dim. Terreno</label>
                                    <input
                                        type="text"
                                        name="dimensoes_terreno"
                                        className={styles.select}
                                        placeholder="EX: 10 X 30"
                                        value={formData.dimensoes_terreno}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'next')}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px', lineHeight: '1.2' }}>
                                        Exemplo: TT: 8m; FR 3,95m; LE 18,11m; LD 25m; FD 4,10m
                                    </p>
                                </div>
                            </div>

                        <div className={styles.navigation}>
                            <button className={styles.btnSecondary} onClick={handlePrev}>Voltar</button>
                            <button className={styles.btnPrimary} onClick={handleNext}>Continuar</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className={styles.formContent}>
                        <h2 className={styles.stepTitle} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <DollarSign size={24} /> Valores
                        </h2>
                        <div className={styles.formGroup}>
                            <h3 className={styles.question} style={{ marginBottom: '4px' }}>Preço Base ( R$ )</h3>
                            <div className={styles.currencyInputWrapper}>
                                <input
                                    type="text"
                                    name="price"
                                    className={`${styles.input} ${styles.priceInput} ${!formData.price ? styles.inputError : ''}`}
                                    placeholder="0,00"
                                    value={formData.price}
                                    onChange={handleCurrencyChange}
                                    onBlur={handleCurrencyBlur}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => handleKeyDown(e, 'condoFee')}
                                />
                                {!formData.price && <span className={styles.requiredStatus}>obrigatório</span>}
                            </div>
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: '32px' }}>
                            <h3 className={styles.question} style={{ marginBottom: '4px' }}>Condomínio ( R$ / mês )</h3>
                            <p className={styles.subQuestion} style={{ fontSize: '14px', marginBottom: '16px' }}>
                                Não incluir despesas pontuais (aluguel de salão ou churrasqueira, etc.)
                            </p>
                            <div className={styles.currencyInputWrapper}>
                                <input
                                    type="text"
                                    name="condoFee"
                                    className={`${styles.input} ${styles.rightAlignInput} ${!formData.condoFee ? styles.inputError : ''}`}
                                    placeholder="0,00"
                                    value={formData.condoFee}
                                    onChange={handleCurrencyChange}
                                    onBlur={handleCurrencyBlur}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => handleKeyDown(e, formData.hasIptu ? 'iptuValue' : 'next')}
                                />
                                {!formData.condoFee && <span className={styles.requiredStatus}>obrigatório</span>}
                            </div>
                            {!formData.condoFee && (
                                <p className={styles.errorText}>
                                    <Info size={14} /> Campo obrigatório
                                </p>
                            )}
                            <button
                                className={styles.helpLink}
                                onClick={() => setIsCondoHelpModalOpen(true)}
                                style={{ marginTop: '8px' }}
                            >
                                O que incluir nesse valor?
                            </button>
                        </div>

                        <div className={styles.formGroup} style={{ marginTop: '32px' }}>
                            <h3 className={styles.question}>O imóvel paga IPTU?</h3>
                            <div className={styles.segmentedToggle}>
                                <button
                                    className={`${styles.toggleOpt} ${formData.hasIptu ? styles.toggleOptActive : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, hasIptu: true }))}
                                >
                                    Sim
                                </button>
                                <button
                                    className={`${styles.toggleOpt} ${!formData.hasIptu ? styles.toggleOptActive : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, hasIptu: false }))}
                                >
                                    Não
                                </button>
                            </div>
                        </div>

                        {formData.hasIptu && (
                            <div className={styles.formGroup} style={{ marginTop: '32px' }}>
                                <h3 className={styles.question} style={{ marginBottom: '4px' }}>IPTU ( R$ / total anual )</h3>
                                <div className={styles.currencyInputWrapper}>
                                    <input
                                        type="text"
                                        name="iptuValue"
                                        className={`${styles.input} ${styles.rightAlignInput} ${!formData.iptuValue ? styles.inputError : ''}`}
                                        placeholder="0,00"
                                        value={formData.iptuValue}
                                        onChange={handleCurrencyChange}
                                        onBlur={handleCurrencyBlur}
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => handleKeyDown(e, 'next')}
                                    />
                                    {!formData.iptuValue && <span className={styles.requiredStatus}>obrigatório</span>}
                                </div>
                                {!formData.iptuValue && (
                                    <p className={styles.errorText}>
                                        <Info size={14} /> Campo obrigatório
                                    </p>
                                )}
                                <button
                                    className={styles.helpLink}
                                    onClick={() => setIsIptuHelpModalOpen(true)}
                                    style={{ marginTop: '8px' }}
                                >
                                    Não sabe o valor do IPTU?
                                </button>
                            </div>
                        )}

                        <div className={styles.navigation}>
                            <button className={styles.btnSecondary} onClick={handlePrev}>Voltar</button>
                            <button
                                className={styles.btnPrimary}
                                onClick={handleNext}
                                disabled={!formData.price || !formData.condoFee || (formData.hasIptu && !formData.iptuValue)}
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

                {step === 5 && (
                    <div className={styles.formContent}>
                        <div className={styles.formGroup}>
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
                                name="title"
                                className={`${styles.select} ${styles.titleInput}`} 
                                placeholder="Ex: Lindo apartamento com vista mar" 
                                value={formData.title}
                                onChange={handleChange}
                                onKeyDown={(e) => handleKeyDown(e, 'description')}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Descrição Completa</label>
                            <textarea
                                name="description"
                                className={styles.textarea}
                                placeholder="Fale mais sobre os diferenciais do imóvel..."
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <div className={styles.navigation}>
                            <button className={styles.btnSecondary} onClick={handlePrev}>Voltar</button>
                            <button className={styles.btnPrimary} onClick={handleSubmit} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : 'Finalizar Cadastro'}
                            </button>
                        </div>
                    </div>
                )}

                {showBairroCreateModal && (
                    <div className={styles.modalOverlay} onClick={() => setShowBairroCreateModal(false)}>
                        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>
                                    {activeVerification === 'estado' && 'Estado não cadastrado'}
                                    {activeVerification === 'cidade' && 'Cidade não cadastrada'}
                                    {activeVerification === 'bairro' && 'Bairro não cadastrado'}
                                </h2>
                                <button className={styles.modalCloseBtn} onClick={() => setShowBairroCreateModal(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className={styles.modalContent}>
                                <p className={styles.modalText}>
                                    O {activeVerification === 'estado' ? 'estado' : activeVerification === 'cidade' ? 'município' : 'bairro'} <strong>{bairroCreateLabel}</strong> não existe no cadastro master.
                                    Deseja cadastrar agora para prosseguir?
                                </p>
                                <div className={styles.navigation} style={{ marginTop: '16px' }}>
                                    <button className={styles.btnSecondary} onClick={() => setShowBairroCreateModal(false)}>
                                        Cancelar
                                    </button>
                                    <button className={styles.btnPrimary} onClick={handleConfirmCreateBairro} disabled={loading}>
                                        {loading ? <Loader2 className="animate-spin" /> : 'Cadastrar e continuar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Specialist Help Floating Button */}
                <button
                    className={styles.floatingHelpBtn}
                    onClick={() => setIsHelpModalOpen(true)}
                    title="Ajuda de especialista"
                >
                    <MessageCircle size={32} />
                </button>

                {/* Specialist Help Modal */}
                {isHelpModalOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsHelpModalOpen(false)}>
                        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Ajuda de especialista</h2>
                                <button className={styles.modalCloseBtn} onClick={() => setIsHelpModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className={styles.modalContent}>
                                <p className={styles.modalText}>
                                    Temos especialistas à disposição para cadastrar o imóvel junto com você.
                                </p>

                                <button className={`${styles.contactBtn} ${styles.contactBtnWhatsApp}`}>
                                    <MessageCircle size={20} />
                                    Conversar por WhatsApp
                                </button>

                                <button className={`${styles.contactBtn} ${styles.contactBtnPhone}`}>
                                    <Phone size={20} />
                                    Conversar por telefone
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* IPTU Help Modal */}
                {isIptuHelpModalOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsIptuHelpModalOpen(false)}>
                        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>Não sabe o valor do IPTU?</h2>
                                <button className={styles.modalCloseBtn} onClick={() => setIsIptuHelpModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className={styles.modalContent}>
                                <p className={styles.modalText} style={{ color: '#1a1a1a', fontWeight: '500' }}>
                                    Coloque um valor aproximado e anuncie. Depois que confirmar o valor atual no carnê, é só editar o anúncio. Inclua IPTUs adicionais, se existirem. Como garagem, depósito, etc.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Condo Help Modal */}
                {isCondoHelpModalOpen && (
                    <div className={styles.modalOverlay} onClick={() => setIsCondoHelpModalOpen(false)}>
                        <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.modalHeader}>
                                <h2 className={styles.modalTitle}>O que incluir no condomínio?</h2>
                                <button className={styles.modalCloseBtn} onClick={() => setIsCondoHelpModalOpen(false)}>
                                    <X size={24} />
                                </button>
                            </div>
                            <div className={styles.modalContent}>
                                <p className={styles.modalText} style={{ color: '#1a1a1a', fontWeight: '500', marginBottom: '16px' }}>
                                    Informe o valor do último boleto do condomínio, incluindo obras ou despesas extras.
                                </p>
                                <p className={styles.modalText} style={{ color: '#1a1a1a', fontWeight: '500' }}>
                                    Considere só o que faz parte da cobrança mensal, sem incluir valores pontuais como aluguel de salão de festas e churrasqueira.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
