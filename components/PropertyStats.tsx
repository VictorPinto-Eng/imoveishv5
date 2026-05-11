'use client'

import React from 'react';
import styles from './propertyStats.module.css';
import { Bed, Bath, Car, Maximize, DoorOpen } from 'lucide-react';

interface PropertyStatsProps {
    area?: number | string;
    bedrooms?: number;
    suites?: number;
    bathrooms?: number;
    lavabos?: number;
    parking?: number;
}

export default function PropertyStats({ area, bedrooms, suites, bathrooms, lavabos, parking }: PropertyStatsProps) {
    return (
        <div className={styles.statsContainer}>
            {area && (
                <div className={styles.statItem}>
                    <Maximize size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{area} m²</span>
                        <span className={styles.label}>Área total</span>
                    </div>
                </div>
            )}

            {bedrooms && (
                <div className={styles.statItem}>
                    <Bed size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{bedrooms}</span>
                        <span className={styles.label}>Dormitório</span>
                    </div>
                </div>
            )}

            {suites && suites > 0 && (
                <div className={styles.statItem}>
                    <DoorOpen size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{suites}</span>
                        <span className={styles.label}>Suíte</span>
                    </div>
                </div>
            )}

            {bathrooms && (
                <div className={styles.statItem}>
                    <Bath size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{bathrooms}</span>
                        <span className={styles.label}>Banheiro</span>
                    </div>
                </div>
            )}

            {lavabos && (
                <div className={styles.statItem}>
                    <Bath size={20} className={styles.icon} style={{ opacity: 0.7 }} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{lavabos}</span>
                        <span className={styles.label}>Lavabo</span>
                    </div>
                </div>
            )}

            {parking && (
                <div className={styles.statItem}>
                    <Car size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{parking}</span>
                        <span className={styles.label}>Vaga</span>
                    </div>
                </div>
            )}
        </div>
    );
}
