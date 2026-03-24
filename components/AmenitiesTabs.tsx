'use client'

import React, { useState } from 'react';
import styles from './amenitiesTabs.module.css';

interface AmenitiesTabsProps {
    tags: string[];
}

export default function AmenitiesTabs({ tags }: AmenitiesTabsProps) {
    const [activeTab, setActiveTab] = useState<'private' | 'common'>('private');

    // Categorize tags (simplified logic for now)
    const commonPrefixes = ['piscina', 'academia', 'salão', 'portaria', 'elevador', 'quadra', 'playground', 'churrasqueira coletiva'];
    
    const commonAreas = tags.filter(tag => 
        commonPrefixes.some(prefix => tag.toLowerCase().includes(prefix))
    );
    
    const privateAreas = tags.filter(tag => !commonAreas.includes(tag));

    return (
        <div className={styles.tabsContainer}>
            <div className={styles.tabHeaders}>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'common' ? styles.active : ''}`}
                    onClick={() => setActiveTab('common')}
                >
                    Áreas comuns
                </button>
                <button 
                    className={`${styles.tabBtn} ${activeTab === 'private' ? styles.active : ''}`}
                    onClick={() => setActiveTab('private')}
                >
                    Áreas privativas
                </button>
            </div>

            <div className={styles.tabContent}>
                <div className={styles.grid}>
                    {(activeTab === 'common' ? commonAreas : privateAreas).map((tag, index) => (
                        <div key={index} className={styles.tagItem}>
                            <div className={styles.dot}></div>
                            <span>{tag}</span>
                        </div>
                    ))}
                    {(activeTab === 'common' ? commonAreas : privateAreas).length === 0 && (
                        <span className={styles.empty}>Nenhuma informação cadastrada nesta categoria.</span>
                    )}
                </div>
            </div>
        </div>
    );
}
