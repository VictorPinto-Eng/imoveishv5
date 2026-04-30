'use client'

import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import styles from './imageLightbox.module.css';

interface ImageLightboxProps {
    images: string[];
    currentIndex: number;
    onClose: () => void;
    onNext: () => void;
    onPrev: () => void;
}

export default function ImageLightbox({ images, currentIndex, onClose, onNext, onPrev }: ImageLightboxProps) {
    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowRight') onNext();
            if (e.key === 'ArrowLeft') onPrev();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            document.body.style.overflow = 'auto';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose, onNext, onPrev]);

    if (!images || images.length === 0) return null;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.container} onClick={(e) => e.stopPropagation()}>
                {/* Header Actions */}
                <div className={styles.header}>
                    <div className={styles.counter}>
                        {currentIndex + 1} / {images.length}
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Main Content */}
                <div className={styles.content}>
                    <button className={styles.navBtn} onClick={onPrev}>
                        <ChevronLeft size={32} />
                    </button>

                    <div className={styles.imageWrapper}>
                        {/* Blurred background layer */}
                        <div 
                            className={styles.blurBg} 
                            style={{ backgroundImage: `url(${images[currentIndex]})` }} 
                        />
                        
                        <img 
                            src={images[currentIndex]} 
                            alt={`Foto ${currentIndex + 1}`} 
                            className={styles.mainImage}
                        />
                    </div>

                    <button className={styles.navBtn} onClick={onNext}>
                        <ChevronRight size={32} />
                    </button>
                </div>

                {/* Thumbnails Strip */}
                <div className={styles.thumbnails}>
                    {images.map((img, idx) => (
                        <div 
                            key={idx} 
                            className={`${styles.thumb} ${idx === currentIndex ? styles.activeThumb : ''}`}
                            onClick={() => {/* Implement jump to index if needed */}}
                            style={{ backgroundImage: `url(${img})` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
