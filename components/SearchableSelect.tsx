'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { ChevronDown, Check, Search, X } from 'lucide-react'
import styles from './SearchableSelect.module.css'

interface Option {
    id: string | number
    descricao: string
}

interface SearchableSelectProps {
    options: Option[]
    value: string | number
    onChange: (value: number | undefined) => void
    placeholder?: string
    name?: string
}

export default function SearchableSelect({ options, value, onChange, placeholder = 'Selecione...', name }: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedOption = useMemo(() => 
        options.find(opt => opt.id.toString() === value?.toString()),
    [options, value])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
        if (!isOpen) {
            setSearchTerm('')
        }
    }, [isOpen])

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options
        const term = searchTerm.toLowerCase()
        return options.filter(opt => 
            opt.descricao.toLowerCase().includes(term)
        )
    }, [options, searchTerm])

    const handleSelect = (optionId: string | number | undefined) => {
        onChange(optionId ? Number(optionId) : undefined)
        setIsOpen(false)
    }

    return (
        <div className={`${styles.wrapper} ${isOpen ? styles.wrapperOpen : ''}`} ref={containerRef}>
            <div
                className={`${styles.button} ${isOpen ? styles.buttonOpen : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className={styles.selectedValue}>
                    {selectedOption ? selectedOption.descricao : <span className={styles.placeholder}>{placeholder}</span>}
                </span>
                <div className={styles.iconContainer}>
                    {value && (
                        <X 
                            size={16} 
                            className={styles.clearIcon} 
                            onClick={(e) => {
                                e.stopPropagation();
                                handleSelect(undefined);
                            }}
                        />
                    )}
                    <ChevronDown size={18} className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div className={styles.searchContainer}>
                        <Search size={16} className={styles.searchIcon} />
                        <input
                            ref={inputRef}
                            type="text"
                            className={styles.searchInput}
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className={styles.optionsList}>
                        <div 
                            className={`${styles.option} ${!value ? styles.selectedOption : ''}`}
                            onClick={() => handleSelect(undefined)}
                        >
                            Nenhum
                            {!value && <Check size={16} className={styles.checkIcon} />}
                        </div>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option) => (
                                <div
                                    key={option.id}
                                    className={`${styles.option} ${value?.toString() === option.id.toString() ? styles.selectedOption : ''}`}
                                    onClick={() => handleSelect(option.id)}
                                >
                                    {option.descricao}
                                    {value?.toString() === option.id.toString() && (
                                        <Check size={16} className={styles.checkIcon} />
                                    )}
                                </div>
                            ))
                        ) : (
                            <div className={styles.noOptions}>Nenhum resultado encontrado</div>
                        )}
                    </div>
                </div>
            )}
            <input type="hidden" name={name} value={value || ''} />
        </div>
    )
}
