'use client'

import React, { useState, useRef } from 'react';
import styles from './propertyGalleryMobileFixed.module.css';
import { Camera, Image as ImageIcon, ChevronLeft, ChevronRight, Heart, Share2 } from 'lucide-react';
import ImageLightbox from './ImageLightbox';

interface PropertyGalleryProps {
    images: string[];
    alt: string;
}

export default function PropertyGallery({ images, alt }: PropertyGalleryProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFavorited, setIsFavorited] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            const favorites = JSON.parse(localStorage.getItem('hv5_favorites') || '[]');
            setIsFavorited(favorites.includes(window.location.pathname));
        }
    }, []);

    const toggleFavorite = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
            const path = window.location.pathname;
            let favorites = JSON.parse(localStorage.getItem('hv5_favorites') || '[]');
            if (favorites.includes(path)) {
                favorites = favorites.filter((p: string) => p !== path);
                setIsFavorited(false);
            } else {
                favorites.push(path);
                setIsFavorited(true);
            }
            localStorage.setItem('hv5_favorites', JSON.stringify(favorites));
        }
    };

    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (typeof window !== 'undefined') {
            const shareData = {
                title: alt,
                text: `Confira este imóvel no HV5: ${alt}`,
                url: window.location.href,
            };

            if (navigator.share) {
                try {
                    await navigator.share(shareData);
                } catch (err) {
                    console.log('Error sharing:', err);
                }
            } else {
                try {
                    await navigator.clipboard.writeText(window.location.href);
                    alert('Link do imóvel copiado para a área de transferência!');
                } catch (err) {
                    console.log('Error copying link:', err);
                }
            }
        }
    };

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
            <div className={styles.topActions}>
                <button 
                    className={`${styles.actionBtn} ${isFavorited ? styles.favorited : ''}`} 
                    onClick={toggleFavorite}
                    title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
                >
                    <Heart size={12} className={isFavorited ? styles.heartFilled : ''} />
                </button>
                <button 
                    className={styles.actionBtn} 
                    onClick={handleShare}
                    title="Compartilhar imóvel"
                >
                    <Share2 size={12} />
                </button>
            </div>
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
            <button 
                className={`${styles.navBtn} ${styles.prevBtn}`} 
                onClick={() => scroll('left')}
                style={{ width: '24px', height: '24px', minWidth: '24px' }}
            >
                <ChevronLeft size={10} />
            </button>
            <button 
                className={`${styles.navBtn} ${styles.nextBtn}`} 
                onClick={() => scroll('right')}
                style={{ width: '24px', height: '24px', minWidth: '24px' }}
            >
                <ChevronRight size={10} />
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
                    onSelect={(index) => setCurrentIndex(index)}
                />
            )}
        </div>
    );
}
