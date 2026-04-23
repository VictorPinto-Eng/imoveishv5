'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import styles from './CustomSelect.module.css'

interface Option {
    id: string | number
    descricao: string
}

interface CustomSelectProps {
    options: Option[]
    value: string | number
    onChange: (value: string) => void
    placeholder?: string
    name?: string
}

export default function CustomSelect({ options, value, onChange, placeholder = 'Selecione', name }: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selectedOption = options.find(opt => opt.id.toString() === value.toString())

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (optionId: string | number) => {
        onChange(optionId.toString())
        setIsOpen(false)
    }

    return (
        <div className={styles.wrapper} ref={containerRef}>
            <button
                type="button"
                className={`${styles.button} ${isOpen ? styles.buttonOpen : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <span style={{ 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    marginRight: '1rem'
                }}>
                    {selectedOption ? selectedOption.descricao : placeholder}
                </span>
                <ChevronDown size={18} className={styles.icon} />
            </button>

            {isOpen && (
                <div className={styles.dropdown}>
                    <div 
                        className={`${styles.option} ${!value ? styles.selectedOption : ''}`}
                        onClick={() => handleSelect('')}
                    >
                        {placeholder === 'Selecione' ? 'Todos' : placeholder}
                        {!value && <Check size={16} style={{ marginLeft: 'auto' }} />}
                    </div>
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className={`${styles.option} ${value.toString() === option.id.toString() ? styles.selectedOption : ''}`}
                            onClick={() => handleSelect(option.id)}
                        >
                            {option.descricao}
                            {value.toString() === option.id.toString() && (
                                <Check size={16} style={{ marginLeft: 'auto' }} />
                            )}
                        </div>
                    ))}
                </div>
            )}
            <input type="hidden" name={name} value={value} />
        </div>
    )
}
