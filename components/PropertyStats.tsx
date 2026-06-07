'use client'

import React from 'react';
import styles from './propertyStats.module.css';
import { Bed, Bath, Car, Maximize, DoorOpen } from 'lucide-react';

interface PropertyStatsProps {
    area?: number | string;
    areaLabel?: string;
    bedrooms?: number;
    suites?: number;
    bathrooms?: number;
    lavabos?: number;
    parking?: number;
}

export default function PropertyStats({ area, areaLabel, bedrooms, suites, bathrooms, lavabos, parking }: PropertyStatsProps) {
    const cleanAreaStr = String(area || '').trim();
    const isZeroOrEmpty = !cleanAreaStr || cleanAreaStr === '0' || cleanAreaStr === '0.00';
    const showArea = area && !isZeroOrEmpty;

    const isPureNumber = !isNaN(Number(cleanAreaStr)) && Number(cleanAreaStr) > 0;

    const numArea = isPureNumber ? Number(cleanAreaStr) : 0;
    const numBedrooms = Number(bedrooms) || 0;
    const numSuites = Number(suites) || 0;
    const numBathrooms = Number(bathrooms) || 0;
    const numLavabos = Number(lavabos) || 0;
    const numParking = Number(parking) || 0;

    return (
        <div className={styles.statsContainer}>
            {showArea && (
                <div className={styles.statItem}>
                    <Maximize size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>
                            {isPureNumber ? `${numArea} m²` : cleanAreaStr}
                        </span>
                        <span className={styles.label}>{areaLabel || 'Área total'}</span>
                    </div>
                </div>
            )}

            {numBedrooms > 0 && (
                <div className={styles.statItem}>
                    <Bed size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{numBedrooms}</span>
                        <span className={styles.label}>Dormitório</span>
                    </div>
                </div>
            )}

            {numSuites > 0 && (
                <div className={styles.statItem}>
                    <DoorOpen size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{numSuites}</span>
                        <span className={styles.label}>Suíte</span>
                    </div>
                </div>
            )}

            {numBathrooms > 0 && (
                <div className={styles.statItem}>
                    <Bath size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{numBathrooms}</span>
                        <span className={styles.label}>Banheiro</span>
                    </div>
                </div>
            )}

            {numLavabos > 0 && (
                <div className={styles.statItem}>
                    <Bath size={20} className={styles.icon} style={{ opacity: 0.7 }} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{numLavabos}</span>
                        <span className={styles.label}>Lavabo</span>
                    </div>
                </div>
            )}

            {numParking > 0 && (
                <div className={styles.statItem}>
                    <Car size={20} className={styles.icon} />
                    <div className={styles.texts}>
                        <span className={styles.value}>{numParking}</span>
                        <span className={styles.label}>Vaga</span>
                    </div>
                </div>
            )}
        </div>
    );
}
