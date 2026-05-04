'use client';

import { createPortal } from 'react-dom';
import { X, Copy, Facebook, Mail, MessageCircle, Instagram } from 'lucide-react';
import styles from './ShareModal.module.css';
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    propertyId?: string;
    propertyTitle?: string;
    shareUrl?: string;
    title?: string;
}

export default function ShareModal({ 
    isOpen, 
    onClose, 
    propertyId, 
    propertyTitle,
    shareUrl: directShareUrl,
    title: directTitle
}: ShareModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !mounted) return null;

    // Determine final URL and Title
    const finalShareUrl = directShareUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/imovel/${propertyId}`;
    const finalTitle = directTitle || propertyTitle || 'Confira este imóvel';

    const encodedUrl = encodeURIComponent(finalShareUrl);
    const encodedTitle = encodeURIComponent(`Confira este imóvel: ${finalTitle}`);

    const copyToClipboard = async (silent = false) => {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(finalShareUrl);
            } else {
                const textArea = document.createElement("textarea");
                textArea.value = finalShareUrl;
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                textArea.remove();
            }

            if (!silent) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 2000,
                    title: 'Link copiado!',
                    icon: 'success',
                });
            }
            return true;
        } catch (err) {
            console.error('Failed to copy:', err);
            return false;
        }
    };

    const handleInstagramShare = async (e: React.MouseEvent) => {
        e.preventDefault();
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: finalTitle,
                    text: `Confira este imóvel: ${finalTitle}`,
                    url: finalShareUrl
                });
                return;
            } catch (err) {
                console.log('Native share canceled or failed');
            }
        }

        await copyToClipboard(true);
        Swal.fire({
            title: 'Instagram',
            text: 'Link copiado! Agora você pode colá-lo nos seus Stories ou enviar por Direct.',
            icon: 'info',
            confirmButtonText: 'Abrir Instagram',
            showCancelButton: true,
            cancelButtonText: 'Fechar'
        }).then((result) => {
            if (result.isConfirmed) {
                window.open('https://www.instagram.com', '_blank');
            }
        });
    };

    const shareOptions = [
        {
            name: 'WhatsApp',
            icon: <MessageCircle size={24} />,
            color: '#25D366',
            url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`
        },
        {
            name: 'Instagram',
            icon: <Instagram size={24} />,
            color: '#E4405F',
            onClick: handleInstagramShare
        },
        {
            name: 'Facebook',
            icon: <Facebook size={24} />,
            color: '#1877F2',
            url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
        },
        {
            name: 'E-mail',
            icon: <Mail size={24} />,
            color: '#EA4335',
            url: `mailto:?subject=${encodedTitle}&body=Vi este imóvel no portal e achei interessante: ${encodedUrl}`
        }
    ];

    const modalContent = (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2>Compartilhar Imóvel</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className={styles.optionsGrid}>
                    {shareOptions.map((option) => (
                        option.onClick ? (
                            <button 
                                key={option.name}
                                onClick={option.onClick}
                                className={styles.optionCardBtn}
                            >
                                <div className={styles.iconWrapper} style={{ backgroundColor: option.color }}>
                                    {option.icon}
                                </div>
                                <span>{option.name}</span>
                            </button>
                        ) : (
                            <a 
                                key={option.name}
                                href={option.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={styles.optionCard}
                            >
                                <div className={styles.iconWrapper} style={{ backgroundColor: option.color }}>
                                    {option.icon}
                                </div>
                                <span>{option.name}</span>
                            </a>
                        )
                    ))}
                </div>

                <div className={styles.copySection}>
                    <p>Ou copie o link direto:</p>
                    <div className={styles.copyBox}>
                        <input type="text" readOnly value={finalShareUrl} className={styles.urlInput} />
                        <button className={styles.copyBtn} onClick={() => copyToClipboard()}>
                            <Copy size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
}
