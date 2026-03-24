'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import LocationSearch from './LocationSearch'
import FilterModal from './FilterModal'

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
            <form onSubmit={handleSubmit} style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1.2fr auto',
                gap: '1rem',
                backgroundColor: 'white',
                padding: '1.5rem',
                borderRadius: '1rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                marginBottom: '2rem',
                alignItems: 'end',
                width: '100%'
            }}>
                <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Cidade ou Bairro</label>
                    <LocationSearch 
                        value={filters.cidade || filters.bairro} 
                        defaultValue={filters.bairro || filters.cidade}
                        onChange={handleLocationChange} 
                        placeholder="Onde você quer morar?"
                    />
                </div>
                
                <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Finalidade</label>
                    <select
                        name="finalidade"
                        value={filters.finalidade}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', appearance: 'none', background: 'white' }}
                    >
                        <option value="">Todas</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.descricao}</option>
                        ))}
                    </select>
                </div>

                <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Tipo</label>
                    <select
                        name="tipo"
                        value={filters.tipo}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0', appearance: 'none', background: 'white' }}
                    >
                        <option value="">Todos</option>
                        {propertyTypes.map(tp => (
                            <option key={tp.id} value={tp.id}>{tp.descricao}</option>
                        ))}
                    </select>
                </div>

                <div style={{ minWidth: 0 }}>
                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.025em' }}>Preço Máx.</label>
                    <input
                        type="number"
                        name="maxPrice"
                        placeholder="R$ 0,00"
                        value={filters.maxPrice}
                        onChange={handleChange}
                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 700, fontSize: '1rem' }}>
                        Buscar
                    </button>
                </div>

                <button 
                    type="button" 
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #e2e8f0',
                        background: 'white',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <SlidersHorizontal size={20} />
                </button>
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
