'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import styles from './ImovelFilters.module.css'
import { SlidersHorizontal, Search } from 'lucide-react'
import LocationSearch from './LocationSearch'
import FilterModal from './FilterModal'

import CustomSelect from './CustomSelect'

export default function ImovelFilters() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [categories, setCategories] = useState<any[]>([])
    const [propertyTypes, setPropertyTypes] = useState<any[]>([])

    const [filters, setFilters] = useState({
        cidade: searchParams.get('cidade') || '',
        bairro: searchParams.get('bairro') || '',
        tipo: searchParams.get('tipo') || '',
        finalidade: searchParams.get('finalidade') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        operacao: searchParams.get('operacao') || '',
        dormitorios: searchParams.get('dormitorios') ? Number(searchParams.get('dormitorios')) : undefined,
        suites: searchParams.get('suites') ? Number(searchParams.get('suites')) : undefined,
        vagas: searchParams.get('vagas') ? Number(searchParams.get('vagas')) : undefined,
        banheiros: searchParams.get('banheiros') ? Number(searchParams.get('banheiros')) : undefined,
        minArea: searchParams.get('minArea') || '',
        maxArea: searchParams.get('maxArea') || '',
        status: searchParams.get('status') || 'ativo'
    })

    useEffect(() => {
        fetch('/api/property/categories')
            .then(res => res.json())
            .then(data => setCategories(data))
    }, [])

    useEffect(() => {
        const url = filters.finalidade 
            ? `/api/property/types?category_id=${filters.finalidade}`
            : '/api/property/types'
            
        fetch(url)
            .then(res => res.json())
            .then(data => setPropertyTypes(data))
    }, [filters.finalidade])

    const handleLocationChange = (city: string, neighborhood?: string) => {
        setFilters(prev => ({
            ...prev,
            cidade: city,
            bairro: neighborhood || ''
        }))
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFilters(prev => ({ ...prev, [name]: value }))
    }

    const handleCustomChange = (name: string, value: string) => {
        setFilters(prev => ({ ...prev, [name]: value }))
    }

    const applyFilters = (newFilters: any) => {
        setFilters(newFilters)
        const params = new URLSearchParams()
        Object.entries(newFilters).forEach(([key, val]) => {
            if (val !== undefined && val !== null && val !== '') {
                params.set(key, val.toString())
            }
        })
        router.push(`/imoveis?${params.toString()}`)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        applyFilters(filters)
    }

    return (
        <>
            <form onSubmit={handleSubmit} className={styles.filterContainer}>
                <div className={styles.filterGroup}>
                    <label className={styles.label}>Cidade ou Bairro</label>
                    <LocationSearch 
                        value={filters.cidade || filters.bairro} 
                        defaultValue={filters.bairro || filters.cidade}
                        onChange={handleLocationChange} 
                        placeholder="Onde você quer morar?"
                    />
                </div>
                
                <div className={styles.filterGroup}>
                    <label className={styles.label}>Finalidade</label>
                    <CustomSelect
                        options={categories}
                        value={filters.finalidade}
                        onChange={(val) => handleCustomChange('finalidade', val)}
                        placeholder="Todas"
                        name="finalidade"
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.label}>Tipo</label>
                    <CustomSelect
                        options={propertyTypes}
                        value={filters.tipo}
                        onChange={(val) => handleCustomChange('tipo', val)}
                        placeholder="Todos"
                        name="tipo"
                    />
                </div>

                <div className={styles.filterGroup}>
                    <label className={styles.label}>Preço Máx.</label>
                    <input
                        type="number"
                        name="maxPrice"
                        placeholder="R$ 0,00"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        className={styles.input}
                    />
                </div>

                <div className={styles.actions}>
                    <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
                        <Search size={20} />
                        Buscar
                    </button>
                    <button 
                        type="button" 
                        onClick={() => setIsModalOpen(true)}
                        className={styles.modalBtn}
                        title="Mais filtros"
                    >
                        <SlidersHorizontal size={20} />
                    </button>
                </div>
            </form>

            <FilterModal 
                isOpen={isModalOpen}
                initialFilters={filters}
                onClose={() => setIsModalOpen(false)}
                onApply={applyFilters}
            />
        </>
    )
}
