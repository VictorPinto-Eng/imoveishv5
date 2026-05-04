'use client'

import React, { useState, useEffect } from 'react'
import { X, Check } from 'lucide-react'
import styles from './FilterModal.module.css'
import SearchableSelect from './SearchableSelect'

interface FilterModalProps {
    isOpen: boolean
    onClose: () => void
    onApply: (filters: any) => void
    initialFilters: any
}

export default function FilterModal({ isOpen, onClose, onApply, initialFilters }: FilterModalProps) {
    const [filters, setFilters] = useState(initialFilters)
    const [categories, setCategories] = useState<any[]>([])
    const [propertyTypes, setPropertyTypes] = useState<any[]>([])
    const [empreendimentos, setEmpreendimentos] = useState<any[]>([])
    const [statuses, setStatuses] = useState<any[]>([])

    useEffect(() => {
        setFilters(initialFilters)
    }, [initialFilters, isOpen])

    useEffect(() => {
        fetch('/api/property/categories')
            .then(res => res.ok ? res.json() : [])
            .then(data => setCategories(Array.isArray(data) ? data : []))
            .catch(() => setCategories([]))

        fetch('/api/property/empreendimentos')
            .then(res => res.json())
            .then(data => setEmpreendimentos(data.empreendimentos || []))
            .catch(() => setEmpreendimentos([]))

        fetch('/api/property/status')
            .then(res => res.json())
            .then(data => setStatuses(Array.isArray(data) ? data : []))
            .catch(() => setStatuses([]))
    }, [])

    useEffect(() => {
        const url = filters.finalidade 
            ? `/api/property/types?category_id=${filters.finalidade}`
            : '/api/property/types'
            
        fetch(url)
            .then(res => res.ok ? res.json() : [])
            .then(data => setPropertyTypes(Array.isArray(data) ? data : []))
            .catch(() => setPropertyTypes([]))
    }, [filters.finalidade])

    if (!isOpen) return null

    const handleToggle = (name: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [name]: prev[name] === value ? undefined : value }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFilters((prev: any) => ({ ...prev, [name]: value }))
    }

    const handleApply = () => {
        onApply(filters)
        onClose()
    }

    const handleClear = () => {
        setFilters({
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
        })
    }

    const renderButtonGroup = (name: string, label: string) => (
        <div className={styles.filterSection}>
            <label className={styles.sectionLabel}>{label}</label>
            <div className={styles.buttonGroup}>
                {['Todos', '1+', '2+', '3+', '4+', '5+'].map((opt, idx) => {
                    const val = idx === 0 ? undefined : idx
                    const isActive = filters[name] === val
                    return (
                        <button 
                            key={opt}
                            type="button"
                            className={`${styles.groupBtn} ${isActive ? styles.btnActive : ''}`}
                            onClick={() => setFilters((prev: any) => ({ ...prev, [name]: val }))}
                        >
                            {opt}
                        </button>
                    )
                })}
            </div>
        </div>
    )

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <X size={24} className={styles.closeIcon} onClick={onClose} />
                        <h2 className={styles.title}>Filtrar</h2>
                        <Check size={24} className={styles.applyIcon} onClick={handleApply} />
                    </div>
                </header>

                <div className={styles.content}>
                    {/* Operation Tabs */}
                    <div className={styles.tabs}>
                        {[
                            { id: '1', label: 'VENDA' },
                            { id: '2', label: 'LOCAÇÃO' },
                            { id: '3', label: 'TEMPORADA' }
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                className={`${styles.tab} ${filters.operacao === tab.id ? styles.tabActive : ''}`}
                                onClick={() => setFilters((prev: any) => ({ ...prev, operacao: tab.id }))}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.scrollArea}>
                        {/* Basic Selects */}
                        <div className={styles.grid2}>
                            <div className={styles.field}>
                                <label>Finalidade</label>
                                <select name="finalidade" value={filters.finalidade} onChange={handleChange}>
                                    <option value="">Todas</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.descricao}</option>)}
                                </select>
                            </div>
                            {filters.finalidade && (
                                <div className={styles.field}>
                                    <label>Tipo</label>
                                    <select name="tipo" value={filters.tipo} onChange={handleChange}>
                                        <option value="">Todos</option>
                                        {propertyTypes.map(t => <option key={t.id} value={t.id}>{t.descricao}</option>)}
                                    </select>
                                </div>
                            )}
                            <div className={styles.field}>
                                <label>Status</label>
                                <select name="status" value={filters.status} onChange={handleChange}>
                                    <option value="">Todos</option>
                                    {statuses.map(s => <option key={s.id} value={s.id.toString()}>{s.nome}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Empreendimento Searchable Filter */}
                        <div className={styles.filterSection}>
                            <label className={styles.sectionLabel}>Empreendimento</label>
                            <SearchableSelect 
                                options={empreendimentos}
                                value={filters.empreendimento || ''}
                                onChange={(val) => setFilters((prev: any) => ({ ...prev, empreendimento: val }))}
                                placeholder="Buscar empreendimento..."
                            />
                        </div>

                        {/* Price Range */}
                        <div className={styles.filterSection}>
                            <label className={styles.sectionLabel}>Valor</label>
                            <div className={styles.rangeRow}>
                                <input 
                                    type="number" 
                                    name="minPrice" 
                                    placeholder="R$ Mín" 
                                    value={filters.minPrice} 
                                    onChange={handleChange} 
                                />
                                <span className={styles.rangeDivider}>até</span>
                                <input 
                                    type="number" 
                                    name="maxPrice" 
                                    placeholder="R$ Máx" 
                                    value={filters.maxPrice} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        {/* Area Range */}
                        <div className={styles.filterSection}>
                            <label className={styles.sectionLabel}>Área Útil (m²)</label>
                            <div className={styles.rangeRow}>
                                <input 
                                    type="number" 
                                    name="minArea" 
                                    placeholder="Mín" 
                                    value={filters.minArea} 
                                    onChange={handleChange} 
                                />
                                <span className={styles.rangeDivider}>até</span>
                                <input 
                                    type="number" 
                                    name="maxArea" 
                                    placeholder="Máx" 
                                    value={filters.maxArea} 
                                    onChange={handleChange} 
                                />
                            </div>
                        </div>

                        {/* Button Groups */}
                        {renderButtonGroup('dormitorios', 'Dormitórios')}
                        {renderButtonGroup('suites', 'Suítes')}
                        {renderButtonGroup('vagas', 'Vagas')}
                        {renderButtonGroup('banheiros', 'Banheiros')}

                        {/* Toggles */}
                        <div className={styles.filterSection}>
                            <div className={styles.toggleRow} onClick={() => handleToggle('alto_padrao', 'true')}>
                                <span>Alto Padrão</span>
                                <div className={`${styles.toggle} ${filters.alto_padrao === 'true' ? styles.toggleActive : ''}`}></div>
                            </div>
                            <div className={styles.toggleRow} onClick={() => handleToggle('exclusividade', 'true')}>
                                <span>Exclusividade</span>
                                <div className={`${styles.toggle} ${filters.exclusividade === 'true' ? styles.toggleActive : ''}`}></div>
                            </div>
                        </div>
                    </div>
                </div>

                <footer className={styles.footer}>
                    <button className={styles.btnClear} onClick={handleClear}>Limpar Filtros</button>
                    <button className={styles.btnApply} onClick={handleApply}>Aplicar Filtros</button>
                </footer>
            </div>
        </div>
    )
}
