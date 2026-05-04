'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Building, Building2, X, Loader2 } from 'lucide-react';
import styles from './locationSearch.module.css';

interface Suggestion {
  id: string;
  label: string;
  sublabel: string;
  type: 'cidade' | 'bairro' | 'endereco';
  city: string;
  neighborhood?: string;
  uf: string;
}

interface LocationSearchProps {
  value: string;
  defaultValue?: string;
  onChange: (city: string, neighborhood?: string) => void;
  placeholder?: string;
}

export default function LocationSearch({ value, defaultValue, onChange, placeholder }: LocationSearchProps) {
  const [query, setQuery] = useState(defaultValue || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/imoveis/search-suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (s: Suggestion) => {
    setQuery(s.label);
    setIsOpen(false);
    onChange(s.city, s.neighborhood);
  };

  const handleClear = () => {
    setQuery('');
    onChange('', '');
    setIsOpen(false);
  };

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <div className={styles.inputContainer}>
        <Search className={styles.searchIcon} size={18} />
        <input
          type="text"
          className={styles.input}
          placeholder={placeholder || 'Cidade ou bairro'}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <button type="button" className={styles.clearBtn} onClick={handleClear}>
            <X size={16} />
          </button>
        )}
      </div>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div className={styles.dropdown}>
          {loading ? (
            <div className={styles.loading}>
              <Loader2 className="animate-spin text-primary" size={20} />
              <span>Buscando...</span>
            </div>
          ) : (
            suggestions.map((s) => (
              <div key={s.id} className={styles.suggestionItem} onClick={() => handleSelect(s)}>
                <div className={styles.iconContainer}>
                  {s.type === 'cidade' ? <Building size={20} /> : s.type === 'bairro' ? <Building2 size={20} /> : <MapPin size={20} />}
                </div>
                <div className={styles.textContainer}>
                  <div className={styles.label}>{s.label}</div>
                  {s.sublabel && <div className={styles.sublabel}>{s.sublabel}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
