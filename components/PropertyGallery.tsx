'use client'

import React, { useState } from 'react';
import styles from './propertyGallery.module.css';
import { Camera, Image as ImageIcon } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface PropertyGalleryProps {
    images: string[];
    alt: string;
}

export default function PropertyGallery({ images, alt }: PropertyGalleryProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsLightboxOpen(true);
    };

    const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

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
                {/* Main Image (Large) */}
                <div className={styles.mainImageWrapper} onClick={() => openLightbox(0)}>
                    <img 
                        src={images[0]} 
                        alt={`${alt} - Principal`} 
                        className={styles.mainImage}
                    />
                    <div className={styles.imageOverlay} />
                </div>

                {/* Side Grid (4 images) */}
                <div className={styles.sideGrid}>
                    {images.slice(1, 5).map((img, index) => (
                        <div 
                            key={index} 
                            className={styles.sideImageWrapper}
                            onClick={() => openLightbox(index + 1)}
                        >
                            <img 
                                src={img} 
                                alt={`${alt} - Foto ${index + 2}`} 
                                className={styles.sideImage}
                            />
                            <div className={styles.imageOverlay} />
                            
                            {/* "Show More" overlay on the last image if applicable */}
                            {index === 3 && images.length > 5 && (
                                <div className={styles.overlayMore}>
                                    <span>+{images.length - 5}</span>
                                    <small>fotos</small>
                                </div>
                            )}
                        </div>
                    ))}
                    
                    {/* Fill empty slots with placeholder style if needed */}
                    {images.length < 5 && Array.from({ length: 5 - images.length }).map((_, i) => (
                        <div key={`empty-${i}`} className={styles.emptySlot}>
                            <ImageIcon size={24} color="#e2e8f0" />
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.galleryActions}>
                <div className={styles.countBadge}>
                    <Camera size={16} />
                    <span>{images.length} fotos</span>
                </div>
                <button className={styles.viewMoreBtn} onClick={() => openLightbox(0)}>
                    Ver todas as fotos
                </button>
            </div>

            {isLightboxOpen && (
                <ImageLightbox 
                    images={images}
                    currentIndex={currentIndex}
                    onClose={() => setIsLightboxOpen(false)}
                    onNext={nextImage}
                    onPrev={prevImage}
                />
            )}
        </div>
    );
}
