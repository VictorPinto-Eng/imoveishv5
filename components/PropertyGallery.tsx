'use client'

import React, { useState } from 'react';
import styles from './propertyGallery.module.css';
import { Camera, Image as ImageIcon } from 'lucide-react';

interface PropertyGalleryProps {
    images: string[];
    alt: string;
}

export default function PropertyGallery({ images, alt }: PropertyGalleryProps) {
    const [showAll, setShowAll] = useState(false);

    if (!images || images.length === 0) {
        return (
            <div className={styles.noImage}>
                <ImageIcon size={48} />
                <span>Nenhuma imagem disponível</span>
            </div>
        );
    }

    // Modern 5-image grid layout
    // [ 1 (Large) ] [ 2 ] [ 3 ]
    //               [ 4 ] [ 5 ]

    const displayImages = images.slice(0, 5);
    const hasMore = images.length > 5;

    return (
        <div className={styles.galleryContainer}>
            <div className={styles.grid}>
                {/* Main Large Image */}
                <div className={styles.mainImageWrapper}>
                    <img 
                        src={images[0]} 
                        alt={`${alt} - Principal`} 
                        className={styles.mainImage}
                    />
                    <div className={styles.countBadge}>
                        <Camera size={16} />
                        <span>{images.length} fotos</span>
                    </div>
                </div>

                {/* Smaller Grid Images */}
                <div className={styles.sideGrid}>
                    {displayImages.slice(1).map((img, index) => (
                        <div key={index} className={styles.sideImageWrapper}>
                            <img 
                                src={img} 
                                alt={`${alt} - Foto ${index + 2}`} 
                                className={styles.sideImage}
                            />
                            {index === 3 && hasMore && (
                                <div className={styles.overlayMore}>
                                    <span>+{images.length - 5}</span>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Fill empty slots if less than 5 images */}
                    {displayImages.length < 5 && Array.from({ length: 5 - displayImages.length }).map((_, i) => (
                        <div key={`empty-${i}`} className={styles.emptySlot}>
                            <ImageIcon size={24} color="#e2e8f0" />
                        </div>
                    ))}
                </div>
            </div>

            <button className={styles.viewMoreBtn} onClick={() => console.log('Abrir lightbox')}>
                Ver todas as fotos
            </button>
        </div>
    );
}
