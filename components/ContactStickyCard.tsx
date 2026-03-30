'use client';

import React, { useState } from 'react';
import styles from './contactStickyCard.module.css';
import { Phone, MessageCircle, Info, Mail } from 'lucide-react';
import WhatsAppLink from './WhatsAppLink';
import ContactModal from './ContactModal';

interface ContactStickyCardProps {
    price: string;
    condominium?: string;
    iptu?: string;
    propertyName: string;
    propertyLocation: string;
    propertyId: string;
    pub_price?: boolean;
}

export default function ContactStickyCard({ 
    price, 
    condominium, 
    iptu, 
    propertyName,
    propertyLocation,
    propertyId,
    pub_price = true,
    isRental = false
}: ContactStickyCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className={styles.stickyContainer}>
            <div className={styles.card}>
                <div className={styles.priceSection}>
                    <span 
                        className={`${styles.priceValue} ${pub_price === false ? styles.priceValueMasked : ''}`}
                        style={pub_price === false ? {
                            textAlign: 'center',
                            width: '100%',
                            display: 'block',
                            color: '#c52222',
                            fontSize: '1.5rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            marginBottom: '1rem'
                        } : {}}
                    >
                        {pub_price === false ? 'CONSULTAR PREÇO' : price}
                    </span>
                    
                    {(condominium || iptu) && (
                        <div className={styles.extraCosts}>
                            {condominium && (
                                <div className={styles.costItem}>
                                    <span>Condomínio</span>
                                    <span>{condominium}</span>
                                </div>
                            )}
                            {iptu && (
                                <div className={styles.costItem}>
                                    <span>IPTU</span>
                                    <span>{iptu}</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className={styles.actions}>
                    <button 
                        className={styles.primaryBtn}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Contatar <Mail size={18} />
                    </button>
                    
                    <WhatsAppLink
                        messageOrImovel={propertyName}
                        className={styles.whatsappBtn}
                        produto_servico_id={Number(propertyId)}
                    >
                        <MessageCircle size={18} />
                        Falar com anunciante
                    </WhatsAppLink>
                </div>

                <div className={styles.footer}>
                    <span>Ao enviar você está aceitando os <a href="#">termos de uso</a></span>
                </div>
            </div>

            <ContactModal 
                propertyId={propertyId}
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                propertyTitle={propertyName}
                propertyLocation={propertyLocation}
                isRental={isRental}
            />
        </div>
    );
}
