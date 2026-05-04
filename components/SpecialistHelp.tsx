'use client'

import React, { useState } from 'react';
import { MessageCircle, X, Phone } from 'lucide-react';
import WhatsAppLink from './WhatsAppLink';
import styles from './SpecialistHelp.module.css';

export default function SpecialistHelp() {
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);

    return (
        <>
            {/* Specialist Help Floating Button */}
            <button
                className={styles.floatingHelpBtn}
                onClick={() => setIsHelpModalOpen(true)}
                title="Ajuda de especialista"
            >
                <MessageCircle size={32} />
            </button>

            {/* Specialist Help Modal */}
            {isHelpModalOpen && (
                <div className={styles.modalOverlay} onClick={() => setIsHelpModalOpen(false)}>
                    <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.modalHeader}>
                            <h2 className={styles.modalTitle}>Ajuda de especialista</h2>
                            <button className={styles.modalCloseBtn} onClick={() => setIsHelpModalOpen(false)}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <p className={styles.modalText}>
                                Temos especialistas à disposição para cadastrar o imóvel junto com você.
                            </p>

                            <WhatsAppLink 
                                messageOrImovel="Olá, preciso de ajuda com o cadastro do meu imóvel na HV5"
                                isFullMessage={true}
                                className={`${styles.contactBtn} ${styles.contactBtnWhatsApp}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <MessageCircle size={20} />
                                Conversar por WhatsApp
                            </WhatsAppLink>

                            <a 
                                href="tel:+5581999529391"
                                className={`${styles.contactBtn} ${styles.contactBtnPhone}`}
                                style={{ textDecoration: 'none' }}
                            >
                                <Phone size={20} />
                                Conversar por telefone
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
