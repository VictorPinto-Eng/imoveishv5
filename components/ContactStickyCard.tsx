'use client';

import React, { useState } from 'react';
import styles from './contactStickyCard.module.css';
import { Phone, MessageCircle, Info, Mail, FileText } from 'lucide-react';
import WhatsAppLink from './WhatsAppLink';
import ContactModal from './ContactModal';
import ProposalModal from './ProposalModal';

interface ContactStickyCardProps {
    price: string;
    numericPrice: number;
    operacao_nome: string;
    condominium?: string;
    iptu?: string;
    seguroIncendio?: string;
    vrtotal?: string;
    propertyName: string;
    propertyLocation: string;
    propertyId: string;
    pub_price?: boolean;
    isRental?: boolean;
    isEmpreendimento?: boolean;
    totalUnits?: number;
}

export default function ContactStickyCard({ 
    price, 
    numericPrice,
    operacao_nome,
    condominium,
    iptu, 
    seguroIncendio,
    vrtotal,
    propertyName,
    propertyLocation,
    propertyId,
    pub_price = true,
    isRental = false,
    isEmpreendimento = false,
    totalUnits = 0
}: ContactStickyCardProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isProposalOpen, setIsProposalOpen] = useState(false);

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
                        {pub_price === false ? 'CONSULTAR PREÇO' : (
                            isEmpreendimento && totalUnits > 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500, textTransform: 'lowercase' }}>
                                        unidades a partir de
                                    </span>
                                    <strong style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>
                                        {price}{isRental ? ' /mês' : ''}
                                    </strong>
                                </div>
                            ) : isEmpreendimento && totalUnits === 1 ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', textAlign: 'center', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.85rem', color: '#ea580c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        última unidade disponível
                                    </span>
                                    <strong style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800 }}>
                                        {price}{isRental ? ' /mês' : ''}
                                    </strong>
                                </div>
                            ) : (
                                `${price}${isRental ? ' /mês' : ''}`
                            )
                        )}
                    </span>
                    
                    {pub_price !== false && isRental && (
                        <div className={styles.extraCosts}>
                            <div className={styles.costItem}>
                                <span>Aluguel Base</span>
                                <span>{price}</span>
                            </div>
                            {condominium && (
                                <div className={styles.costItem}>
                                    <span>Condomínio</span>
                                    <span>{condominium}</span>
                                </div>
                            )}
                            {iptu && (
                                <div className={styles.costItem}>
                                    <span>IPTU (Mensal)</span>
                                    <span>{iptu}</span>
                                </div>
                            )}
                            {seguroIncendio && (
                                <div className={styles.costItem}>
                                    <span>Seguro Incêndio</span>
                                    <span>{seguroIncendio}</span>
                                </div>
                            )}
                            {vrtotal && (
                                <div className={`${styles.costItem} ${styles.totalCostItem}`}>
                                    <span>Total Mensal</span>
                                    <span>{vrtotal}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {pub_price !== false && !isRental && (condominium || iptu) && (
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

                    <button 
                        className={styles.proposalBtn}
                        onClick={() => setIsProposalOpen(true)}
                    >
                        Enviar Proposta <FileText size={18} />
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

            <ProposalModal
                propertyId={propertyId}
                isOpen={isProposalOpen}
                onClose={() => setIsProposalOpen(false)}
                propertyTitle={propertyName}
                propertyPrice={numericPrice}
                operationType={operacao_nome}
            />
        </div>
    );
}
