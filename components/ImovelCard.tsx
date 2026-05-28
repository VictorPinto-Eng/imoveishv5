'use client';

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, ChevronLeft, ChevronRight, Phone, Mail, MessageCircle, ImageOff, Share2 } from 'lucide-react'
import styles from './ImovelCard.module.css'
import { Imovel } from '@/lib/imoveis'
import Swal from 'sweetalert2'
import WhatsAppLink from './WhatsAppLink'
import ContactModal from './ContactModal'
import LeadCaptureModal from './LeadCaptureModal'
import ShareModal from './ShareModal'


interface ImovelCardProps {
  imovel: Imovel
  showStatus?: boolean
}

export default function ImovelCard({ imovel, showStatus = false }: ImovelCardProps) {
    const { nome, preco_base, custom_fields, imagens_urls, logradouro, numero } = imovel
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [showPhone, setShowPhone] = useState(false)
    const router = useRouter()

    // Touch swipe states and handlers for mobile gallery
    const [touchStartX, setTouchStartX] = useState<number | null>(null)
    const [touchEndX, setTouchEndX] = useState<number | null>(null)
    const MIN_SWIPE_DISTANCE = 50

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStartX(e.targetTouches[0].clientX)
        setTouchEndX(null)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX)
    }

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX) return
        const distance = touchStartX - touchEndX
        const isLeftSwipe = distance > MIN_SWIPE_DISTANCE
        const isRightSwipe = distance < -MIN_SWIPE_DISTANCE

        if (isLeftSwipe) {
            // Swipe para a esquerda (próxima foto)
            setCurrentImageIndex((prev) => (prev + 1) % (imagens_urls.length || 1))
        } else if (isRightSwipe) {
            // Swipe para a direita (foto anterior)
            setCurrentImageIndex((prev) => (prev - 1 + (imagens_urls.length || 1)) % (imagens_urls.length || 1))
        }
    }

  // Format price
  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(preco_base)

  // Location logic
  const uf = imovel.uf_nome || '';
  const cidade = imovel.cidade_nome || '';
  const bairro = imovel.bairro_nome || '';
  const locationTitle = [bairro, cidade].filter(Boolean).join(', ') + (uf ? ` - ${uf.toUpperCase()}` : '')

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

    const handleShareClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsShareModalOpen(true);
        logActivity('share_modal_opened', '401');
    };

    const logActivity = async (action: string, eventCode: string, origin: string = 'card', details: any = {}) => {
        try {
            fetch('/api/analytics/audit-log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    propertyId: imovel.id,
                    action,
                    eventCode,
                    origin,
                    details
                })
            });
        } catch (err) {
            console.error('[AuditLog] Failed:', err);
        }
    };

    const handlePhoneClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Check authentication
        // Use auth endpoint to get session
        const res = await fetch('/api/auth/me');
        const authData = await res.json();
        const session = authData?.authenticated ? authData.user : null;
        
        if (session) {
            setShowPhone(true);
            logActivity('reveal_phone_authenticated', '101');
        } else {
            setIsLeadModalOpen(true);
            logActivity('reveal_phone_modal_shown', '100');
        }
    };

    return (
        <article className={styles.card} onClick={handleCardClick} style={{ cursor: 'pointer' }}>
      <div 
        className={styles.imageWrapper}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button 
            className={styles.shareBtnFloating} 
            onClick={handleShareClick}
            title="Compartilhar Link"
        >
            <Share2 size={18} />
        </button>

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

        {showStatus && (
          <div className={styles.statusBadge}>
            {(imovel.status_imovel_nome || imovel.status || '').toUpperCase()}
          </div>
        )}
        
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
        </div>

        {!!(imovel.area_util || imovel.dormitorios || imovel.banheiros || imovel.lavabo || imovel.vagas || imovel.suites) && (
          <div className={styles.featuresRow}>
            {!!imovel.area_util && (
              <div className={styles.featureItem} data-tooltip="Área Útil" title="Área Útil">
                {/* Custom Area Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 3v18h18" />
                  <rect x="7" y="3" width="14" height="14" rx="2" strokeDasharray="2 2" />
                </svg>
                <span>{imovel.area_util} m²</span>
              </div>
            )}
            {!!imovel.dormitorios && (
              <div 
                className={styles.featureItem} 
                data-tooltip={imovel.dormitorios === 1 ? 'Dormitório' : 'Dormitórios'} 
                title={imovel.dormitorios === 1 ? 'Dormitório' : 'Dormitórios'}
              >
                {/* Modern Bed Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 17h20M2 17v-4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v4M6 11V7c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4M6 11h12" />
                </svg>
                <span>{imovel.dormitorios}</span>
              </div>
            )}
            {!!imovel.suites && (
              <div 
                className={styles.featureItem} 
                data-tooltip={imovel.suites === 1 ? 'Suíte' : 'Suítes'} 
                title={imovel.suites === 1 ? 'Suíte' : 'Suítes'}
              >
                {/* Modern Suite Icon (Double) */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                  <path d="M2 17h20M2 17v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M12 5v6" />
                </svg>
                <span>{imovel.suites}</span>
              </div>
            )}
            {!!imovel.banheiros && (
              <div 
                className={styles.featureItem} 
                data-tooltip={imovel.banheiros === 1 ? 'Banheiro' : 'Banheiros'} 
                title={imovel.banheiros === 1 ? 'Banheiro' : 'Banheiros'}
              >
                {/* Clean Bath Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 10h18v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-7zM7 21v2M17 21v2M12 2v2M2 10V8a2 2 0 0 1 2-2h2" />
                </svg>
                <span>{imovel.banheiros}</span>
              </div>
            )}
            {!!imovel.lavabo && (
              <div 
                className={styles.featureItem} 
                data-tooltip={imovel.lavabo === 1 ? 'Lavabo' : 'Lavabos'} 
                title={imovel.lavabo === 1 ? 'Lavabo' : 'Lavabos'}
              >
                {/* Sink Icon for Lavabo */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2v4" />
                  <path d="M12 6a3 3 0 0 1 3 3v1H9V9a3 3 0 0 1 3-3Z" />
                  <path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7Z" />
                </svg>
                <span>{imovel.lavabo}</span>
              </div>
            )}
            {!!imovel.vagas && (
              <div 
                className={styles.featureItem} 
                data-tooltip={imovel.vagas === 1 ? 'Vaga de Garagem' : 'Vagas de Garagem'} 
                title={imovel.vagas === 1 ? 'Vaga de Garagem' : 'Vagas de Garagem'}
              >
                {/* Modern Parking Icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.7 8.2c-.5-1.4-1.8-2.2-3.3-2.2H8.6c-1.5 0-2.8.8-3.3 2.2L2.5 11.1c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2M5 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2M15 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2" />
                </svg>
                <span>{imovel.vagas}</span>
              </div>
            )}
          </div>
        )}
        
        <p className={styles.locationSubtitle}>{locationTitle || 'Localização não informada'}</p>


        <div className={styles.priceContainer}>
          <div 
            className={`${styles.priceValue} ${imovel.pub_price === false ? styles.priceValueMasked : ''}`}
            style={imovel.pub_price === false ? { 
              textAlign: 'center', 
              width: '100%', 
              display: 'block', 
              color: '#c52222', 
              fontSize: '1.25rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              margin: '0.5rem 0'
            } : {}}
          >
            {imovel.pub_price === false ? 'CONSULTAR PREÇO' : `${priceFormatted}${isRental ? '/mês' : ''}`}
          </div>

          {isRental && imovel.pub_price !== false && (
            <div className={styles.rentalDetails}>
              {/* INCLUSOS */}
              {(() => {
                const inclusos = [];
                if (imovel.condominio_incluso) inclusos.push('Condomínio');
                if (imovel.iptu_incluso) inclusos.push('IPTU');
                if (imovel.seguro_incendio_incluso) inclusos.push('Seguro Incêndio');
                
                if (inclusos.length > 0) {
                  return (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabelIncluso}>Inclusos:</span>
                      <div className={styles.badgeContainer}>
                        {inclusos.map(item => (
                          <span key={item} className={styles.badgeIncluso}>{item}</span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* PREVISTOS */}
              {(() => {
                const previstos = [];
                const condVal = custom_fields?.condominio || 0;
                const iptuVal = custom_fields?.iptu || 0;
                const seguroVal = imovel.seguro_incendio || 0;

                const formatVal = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);

                if (!imovel.condominio_incluso && condVal > 0) {
                  previstos.push(`Cond. (${formatVal(condVal)})`);
                }
                if (!imovel.iptu_incluso && iptuVal > 0) {
                  previstos.push(`IPTU (${formatVal(iptuVal)})`);
                }
                if (!imovel.seguro_incendio_incluso && seguroVal > 0) {
                  previstos.push(`Seguro (${formatVal(seguroVal)})`);
                }

                if (previstos.length > 0) {
                  return (
                    <div className={styles.detailRow}>
                      <span className={styles.detailLabelPrevisto}>Previsto:</span>
                      <div className={styles.badgeContainer}>
                        {previstos.map(item => (
                          <span key={item} className={styles.badgePrevisto}>{item}</span>
                        ))}
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          )}
        </div>

        <div className={styles.cardFooter} onClick={(e) => e.stopPropagation()}>
            {!showPhone && (
                <button 
                    className={styles.phoneBtn} 
                    aria-label="Ver telefone" 
                    onClick={handlePhoneClick}
                >
                    <Phone size={14} />
                </button>
            )}
            
            <WhatsAppLink 
                messageOrImovel={nome} 
                className={styles.whatsappBtnPremium}
                produto_servico_id={Number(imovel.id)}
                origin="card"
            >
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
                    isRental={isRental}
                />

                <LeadCaptureModal
                    isOpen={isLeadModalOpen}
                    onClose={() => setIsLeadModalOpen(false)}
                    onSuccess={() => setShowPhone(true)}
                    propertyId={imovel.id}
                    propertyTitle={nome}
                    origin="card"
                />

                <ShareModal 
                    isOpen={isShareModalOpen}
                    onClose={() => setIsShareModalOpen(false)}
                    propertyId={imovel.id}
                    propertyTitle={nome}
                />
      </div>
      {showPhone && (
          <div className={styles.revealedPhoneRowBottom}>
              <Phone size={14} className={styles.revealedPhoneIcon} />
              <a href="tel:81986661683" className={styles.phoneNumberLink}>(81) 98666-1683</a>
              <span className={styles.phoneDivider}>|</span>
              <a href="tel:81999529391" className={styles.phoneNumberLink}>99952-9391</a>
          </div>
      )}
    </article>
  )
}
