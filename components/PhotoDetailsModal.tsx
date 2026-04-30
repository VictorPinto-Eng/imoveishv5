
'use client'

import React, { useState, useEffect } from 'react';
import NextImage from 'next/image';
import { X } from 'lucide-react';
import styles from './photoDetailsModal.module.css';

interface Photo {
    id: number;
    url_referencia: string;
    legenda: string | null;
    categoria: string;
    foto_principal: boolean;
    privada: boolean;
}

interface PhotoDetailsModalProps {
    photo: Photo;
    onClose: () => void;
    onSave: (data: { legenda: string; categoria: string; privada: boolean }) => Promise<void>;
}

export default function PhotoDetailsModal({ photo, onClose, onSave }: PhotoDetailsModalProps) {
    const [legenda, setLegenda] = useState(photo.legenda || '');
    const [categoria, setCategoria] = useState(photo.categoria || 'Fotos');
    const [privada, setPrivada] = useState(photo.privada || false);
    const [saving, setSaving] = useState(false);

    // Disable background scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = 'auto'; };
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({ legenda, categoria, privada });
            onClose();
        } catch (error) {
            console.error('Save error:', error);
            alert('Erro ao salvar');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <header className={styles.header}>
                <div className={styles.headerLeft}>
                    <button onClick={onClose} className={styles.closeBtn}>
                        <X size={24} />
                    </button>
                    <span className={styles.title}>Fotos</span>
                </div>
                <button onClick={handleSave} className={styles.saveBtn} disabled={saving}>
                    {saving ? 'Processando...' : 'Avançar'}
                </button>
            </header>

            <div className={styles.content}>
                <div className={styles.previewContainer}>
                    {/* Blurred Background Layer */}
                    <div className={styles.blurredBackground}>
                        <NextImage 
                            src={photo.url_referencia} 
                            alt="" 
                            fill 
                            style={{ objectFit: 'cover' }}
                            unoptimized
                        />
                    </div>
                    {/* Main Image Layer */}
                    <NextImage 
                        src={photo.url_referencia} 
                        alt="Preview" 
                        fill 
                        className={styles.image}
                        unoptimized
                    />
                </div>

                <div className={styles.form}>
                    <div className={styles.inputRow}>
                        <input 
                            type="text" 
                            className={styles.inputField}
                            value={legenda}
                            onChange={(e) => setLegenda(e.target.value)}
                            placeholder="Legenda"
                        />
                    </div>

                    <div className={styles.selectGroup}>
                        <label className={styles.selectLabel}>Categoria</label>
                        <select 
                            className={styles.selectField}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                        >
                            <option value="Fotos">Fotos</option>
                            <option value="Entrada">Entrada / Fachada</option>
                            <option value="Sala">Sala</option>
                            <option value="Quarto">Quartos</option>
                            <option value="Cozinha">Cozinha</option>
                            <option value="Lazer">Área de Lazer</option>
                            <option value="Plantas">Plantas</option>
                        </select>
                    </div>

                    <div className={styles.toggleRow}>
                        <span className={styles.toggleLabel}>Foto privada</span>
                        <div 
                            className={`${styles.toggle} ${privada ? styles.toggleActive : ''}`}
                            onClick={() => setPrivada(!privada)}
                        >
                            <div className={styles.toggleThumb} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
