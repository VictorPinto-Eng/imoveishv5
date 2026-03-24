'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ImageOff } from 'lucide-react'
import styles from './ImovelCard.module.css'
import { Imovel } from '@/lib/imoveis'
import WhatsAppLink from './WhatsAppLink'
import ContactModal from './ContactModal'

interface ImovelCardProps {
  imovel: Imovel
}

export default function ImovelCard({ imovel }: ImovelCardProps) {
    const { nome, preco_base, custom_fields, imagens_urls, logradouro, numero } = imovel
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const router = useRouter()

  // Format price
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(preco_base)

  // Location logic
  const cf = typeof custom_fields === 'string' ? {} : custom_fields
  const locationTitle = [cf.bairro, cf.cidade].filter(Boolean).join(', ')
  const addressSub = [logradouro, numero].filter(Boolean).join(', ')

  const nextImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev + 1) % (imagens_urls.length || 1))
  }

  const prevImage = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentImageIndex((prev) => (prev - 1 + (imagens_urls.length || 1)) % (imagens_urls.length || 1))
  }

  const isRental = !!imovel.is_locacao

    const handleCardClick = () => {
        router.push(`/imovel/${imovel.id}`)
    }

    return (
        <article className={styles.card} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div className={styles.imageWrapper}>
        {imagens_urls && imagens_urls.length > 0 ? (
            <div onClick={(e) => e.stopPropagation()}>
                <img
                    src={imagens_urls[currentImageIndex]}
                    alt={nome}
                    className={styles.image}
                    onClick={handleCardClick}
                />
            </div>
        ) : (
            <div className={styles.noPhotoPlaceholder} onClick={handleCardClick}>
                <ImageOff size={48} strokeWidth={1} className={styles.noPhotoIcon} />
                <div className={styles.noPhotoText}>
                    <span>FOTOS EM BREVE</span>
                    <p>Solicite fotos deste imóvel</p>
                </div>
            </div>
        )}
        
        {/* New Listing Badge */}
        {(() => {
          if (!imovel.created_at) return null;
          const createdDate = new Date(imovel.created_at);
          const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays <= 30) {
            return <div className={styles.newBadge}>NOVO</div>;
          }
          return null;
        })()}
        
        {imagens_urls.length > 1 && (
          <>
            <button className={`${styles.navBtn} ${styles.prevBtn}`} onClick={prevImage} aria-label="Foto anterior">
              <ChevronLeft size={20} />
            </button>
            <button className={`${styles.navBtn} ${styles.nextBtn}`} onClick={nextImage} aria-label="Próxima foto">
              <ChevronRight size={20} />
            </button>
            <div className={styles.imageCounter}>
              {currentImageIndex + 1}/{imagens_urls.length}
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.headerInfo}>
          <h3 className={styles.propertyTitle}>
            {imovel.operacao_nome ? `${imovel.operacao_nome} - ` : ''}
            {imovel.tipo_nome || (imovel.categoria === 'Imovel' ? 'Apartamento' : imovel.categoria)}
          </h3>
          <p className={styles.locationSubtitle}>{locationTitle || 'Localização não informada'}</p>
        </div>

        {!!(imovel.area_util || imovel.dormitorios || imovel.banheiros || imovel.vagas || imovel.suites) && (
          <div className={styles.featuresRow}>
            {!!imovel.area_util && (
              <div className={styles.featureItem} data-tooltip="Área Útil">
                {/* Custom Area Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <rect x="7" y="3" width="14" height="14" rx="2" strokeDasharray="2 2" />
                </svg>
                <span>{imovel.area_util} m²</span>
              </div>
            )}
            {!!imovel.dormitorios && (
              <div className={styles.featureItem} data-tooltip="Dormitório">
                {/* Modern Bed Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 17h20M2 17v-4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v4M6 11V7c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4M6 11h12" />
                </svg>
                <span>{imovel.dormitorios}</span>
              </div>
            )}
            {!!imovel.suites && (
              <div className={styles.featureItem} data-tooltip="Suíte">
                {/* Modern Suite Icon (Double) */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <path d="M2 17h20M2 17v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M12 5v6" />
                </svg>
                <span>{imovel.suites}</span>
              </div>
            )}
            {!!imovel.banheiros && (
              <div className={styles.featureItem} data-tooltip="Banheiro">
                {/* Clean Bath Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10h18v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-7zM7 21v2M17 21v2M12 2v2M2 10V8a2 2 0 0 1 2-2h2" />
                </svg>
                <span>{imovel.banheiros}</span>
              </div>
            )}
            {!!imovel.vagas && (
              <div className={styles.featureItem} data-tooltip="Vaga">
                {/* Modern Parking Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.7 8.2c-.5-1.4-1.8-2.2-3.3-2.2H8.6c-1.5 0-2.8.8-3.3 2.2L2.5 11.1c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2M5 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2M15 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2" />
                </svg>
                <span>{imovel.vagas}</span>
              </div>
            )}
          </div>
        )}

        {!!addressSub && (
          <p className={styles.addressSub}>{addressSub}</p>
        )}

        <div className={styles.priceContainer}>
          <div className={styles.priceValue}>
            {priceFormatted}{isRental ? '/mês' : ''}
          </div>
        </div>

                <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
                    <button className={styles.phoneBtn} aria-label="Ver telefone" onClick={(e) => e.stopPropagation()}>
                        <Phone size={14} />
                    </button>
                    
                    <WhatsAppLink messageOrImovel={nome} className={styles.whatsappBtnPremium}>
                        WhatsApp <MessageCircle size={14} />
                    </WhatsAppLink>

                    <button 
                        className={styles.contactBtnPremium} 
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsContactModalOpen(true);
                        }}
                    >
                        Contatar <Mail size={14} />
                    </button>
                </div>

                <ContactModal 
                    propertyId={imovel.id}
                    isOpen={isContactModalOpen}
                    onClose={() => setIsContactModalOpen(false)}
                    propertyTitle={nome}
                    propertyLocation={locationTitle}
                />
      </div>
    </article>
  )
}
