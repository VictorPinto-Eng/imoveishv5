'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Check, Share2, MessageCircle, Mail } from 'lucide-react';
import styles from './share-modal.module.css';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    shareUrl: string;
    title?: string;
}

export default function ShareModal({ isOpen, onClose, shareUrl, title }: ShareModalProps) {
    const [copied, setCopied] = useState(false);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl).then(() => {
            setCopied(true);
        });
    };

    const shareWhatsApp = () => {
        const msg = encodeURIComponent(`Veja este imóvel no portal HV5: ${shareUrl}`);
        window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
    };

    const shareEmail = () => {
        const subject = encodeURIComponent(`Interesse no imóvel: ${title || 'HV5'}`);
        const body = encodeURIComponent(`Olá, veja este imóvel no portal HV5:\n\n${shareUrl}`);
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal} ref={modalRef}>
                <div className={styles.header}>
                    <div className={styles.titleArea}>
                        <Share2 size={20} className={styles.titleIcon} />
                        <h2 className={styles.title}>Compartilhar</h2>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.content}>
                    <p className={styles.subtitle}>Compartilhe o link direto deste imóvel</p>
                    
                    <div className={styles.inputWrapper}>
                        <input 
                            type="text" 
                            className={styles.input} 
                            value={shareUrl} 
                            readOnly 
                        />
                        <button 
                            className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
                            onClick={handleCopy}
                        >
                            {copied ? <Check size={18} /> : <Copy size={18} />}
                            <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                        </button>
                    </div>

                    <div className={styles.divider}>
                        <span>ou compartilhe via</span>
                    </div>

                    <div className={styles.socialGrid}>
                        <button className={styles.socialBtn} onClick={shareWhatsApp}>
                            <div className={`${styles.socialIcon} ${styles.whatsapp}`}>
                                <MessageCircle size={20} />
                            </div>
                            <span>WhatsApp</span>
                        </button>
                        <button className={styles.socialBtn} onClick={shareEmail}>
                            <div className={`${styles.socialIcon} ${styles.email}`}>
                                <Mail size={20} />
                            </div>
                            <span>E-mail</span>
                        </button>
                    </div>
                </div>

                <div className={styles.footer}>
                    <button className={styles.cancelBtn} onClick={onClose}>
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}
