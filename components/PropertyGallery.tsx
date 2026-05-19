'use client'

import React, { useState, useRef } from 'react';
import styles from './propertyGalleryMobileFixed.module.css';
import { Camera, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface PropertyGalleryProps {
    images: string[];
    alt: string;
}

export default function PropertyGallery({ images, alt }: PropertyGalleryProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    const openLightbox = (index: number) => {
        setCurrentIndex(index);
        setIsLightboxOpen(true);
    };

    const nextImage = () => setCurrentIndex((prev) => (prev + 1) % images.length);
    const prevImage = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!images || images.length === 0) {
        return (
            <div className={styles.noImage}>
                <ImageIcon size={48} />
                <span>Nenhuma imagem disponível</span>
            </div>
        );
    }

    // Modern 5-image grid layout
    const displayImages = images.slice(0, 5);

    return (
        <div className={styles.galleryContainer}>
            <div className={styles.grid} ref={scrollRef}>
                {/* Main Image (Large) */}
                <div className={styles.mainImageWrapper} onClick={() => openLightbox(0)}>
                    <img 
                        src={images[0]} 
                        alt={`${alt} - Principal`} 
                        className={styles.mainImage}
                    />
                    <div className={styles.imageOverlay} />
                </div>

                {/* Grid Images (Side) */}
                {images.slice(1, 5).map((img, index) => (
                    <div 
                        key={index} 
                        className={`${styles.sideImageWrapper}`}
                        onClick={() => openLightbox(index + 1)}
                    >
                        <img 
                            src={img} 
                            alt={`${alt} - Foto ${index + 2}`} 
                            className={styles.sideImage}
                        />
                        <div className={styles.imageOverlay} />
                        
                        {index === 3 && images.length > 5 && (
                            <div className={styles.overlayMore}>
                                <span>+{images.length - 5}</span>
                                <small>fotos</small>
                            </div>
                        )}
                    </div>
                ))}
                
                {/* Fill empty slots */}
                {images.length < 5 && Array.from({ length: 5 - images.length }).map((_, i) => (
                    <div key={`empty-${i}`} className={styles.emptySlot}>
                        <ImageIcon size={24} color="#e2e8f0" />
                    </div>
                ))}
            </div>

            {/* Navigation Arrows (Mobile Only via CSS) */}
            <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={() => scroll('left')}>
                <ChevronLeft size={24} />
            </button>
            <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={() => scroll('right')}>
                <ChevronRight size={24} />
            </button>

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
                    onSelect={setCurrentIndex}
                />
            )}
        </div>
    );
}
