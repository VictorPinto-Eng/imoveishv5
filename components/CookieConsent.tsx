'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';
import styles from './cookieConsent.module.css';

export default function CookieConsent() {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Run only on client to avoid hydration mismatch
        const consent = localStorage.getItem('hv5-cookie-consent');
        if (!consent) {
            setIsVisible(true);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('hv5-cookie-consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className={styles.bannerContainer}>
            <div className={styles.bannerContent}>
                <p className={styles.bannerText}>
                    Utilizamos cookies para melhorar a experiência de navegação, ao continuar você concorda com nossos{' '}
                    <Link href="/termos" className={styles.link}>
                        Termos de uso
                    </Link>{' '}
                    e{' '}
                    <Link href="/politica-de-privacidade" className={styles.link}>
                        Política de Privacidade
                    </Link>.
                </p>
                <button className={styles.acceptBtn} onClick={handleAccept} aria-label="Aceitar cookies">
                    <span>Entendi</span>
                    <X size={16} className={styles.closeIcon} />
                </button>
            </div>
        </div>
    );
}
