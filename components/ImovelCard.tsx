'use client';

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Heart, Phone, Mail, MessageCircle, ImageOff, Share2 } from 'lucide-react'
import styles from './ImovelCard.module.css'
import { Imovel } from '@/lib/imoveis'
import { fire } from '@/lib/swal'
import { buildPropertyUrl } from '@/lib/property-url'
import WhatsAppLink from './WhatsAppLink'
import ContactModal from './ContactModal'
import LeadCaptureModal from './LeadCaptureModal'
import ShareModal from './ShareModal'


interface ImovelCardProps {
  imovel: Imovel
  showStatus?: boolean
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void
}

export default function ImovelCard({ imovel, showStatus = false, onFavoriteToggle }: ImovelCardProps) {
    const { nome, preco_base, custom_fields, imagens_urls, logradouro, numero } = imovel
    const [currentImageIndex, setCurrentImageIndex] = useState(0)
    const [isContactModalOpen, setIsContactModalOpen] = useState(false)
    const [isLeadModalOpen, setIsLeadModalOpen] = useState(false)
    const [isShareModalOpen, setIsShareModalOpen] = useState(false)
    const [showPhone, setShowPhone] = useState(false)
    const [isFavorited, setIsFavorited] = useState(false)
    const [imageError, setImageError] = useState(false)
    const router = useRouter()

    useEffect(() => {
        const checkFavorite = async () => {
            if (typeof window === 'undefined') return;
            // Não faz request se não há cookie de token
            if (!document.cookie.includes('token=')) return;

            const win = window as any;
            if (!win._favoritesCache) {
                if (!win._favoritesPromise) {
                    win._favoritesPromise = fetch('/api/user/favorites')
                        .then(r => r.ok ? r.json() : { success: false, favorites: [] })
                        .catch(() => ({ success: false, favorites: [] }));
                }
                win._favoritesCache = await win._favoritesPromise;
            }

            const data = win._favoritesCache;
            if (data.success && Array.isArray(data.favorites)) {
                const favIds = data.favorites.map((f: any) => String(f.id));
                setIsFavorited(favIds.includes(String(imovel.id)));
            }
        };
        checkFavorite();
    }, [imovel.id]);

    const handleFavoriteToggle = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        try {
            const authRes = await fetch('/api/auth/me');
            const authData = await authRes.json();
            if (!authData.authenticated) {
                fire({
                    title: 'Atenção',
                    text: 'Você precisa estar logado para favoritar imóveis.',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Fazer Login',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#7F34E6'
                }).then((result) => {
                    if (result.isConfirmed) {
                        const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
                        if (loginBtn) {
                            loginBtn.click();
                        }
                    }
                });
                return;
            }

            if (isFavorited) {
                const res = await fetch(`/api/user/favorites?propertyId=${imovel.id}`, { method: 'DELETE' });
                if (res.ok) {
                    setIsFavorited(false);
                    if (typeof window !== 'undefined') {
                        delete (window as any)._favoritesPromise;
                        delete (window as any)._favoritesCache;
                    }
                    onFavoriteToggle?.(String(imovel.id), false);
                }
            } else {
                const res = await fetch('/api/user/favorites', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ propertyId: imovel.id })
                });
                if (res.ok) {
                    setIsFavorited(true);
                    if (typeof window !== 'undefined') {
                        delete (window as any)._favoritesPromise;
                        delete (window as any)._favoritesCache;
                    }
                    onFavoriteToggle?.(String(imovel.id), true);
                }
            }
        } catch (err) {
            console.error('Error toggling favorite:', err);
        }
    };

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
            setImageError(false)
            setCurrentImageIndex((prev) => (prev + 1) % (imagens_urls.length || 1))
        } else if (isRightSwipe) {
            // Swipe para a direita (foto anterior)
            setImageError(false)
            setCurrentImageIndex((prev) => (prev - 1 + (imagens_urls.length || 1)) % (imagens_urls.length || 1))
        }
    }

  // Format price
  const isEmpreendimento = imovel.imbtipoanuncio_id === 2;
  const totalUnits = Number(imovel.emp_total_unidades) || 0;
  const hasMultipleUnits = isEmpreendimento && totalUnits > 1;
  const hasSingleUnit = isEmpreendimento && totalUnits === 1;
  const basePrice = ((hasMultipleUnits || hasSingleUnit) && imovel.emp_min_preco !== undefined && imovel.emp_min_preco !== null)
    ? imovel.emp_min_preco
    : preco_base;

  const priceFormatted = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
  }).format(basePrice)

  const areaUtil = Number(imovel.area_util) || 0;
  const areaConstruida = Number(imovel.area_construida) || 0;
  const areaTerreno = Number(imovel.area_terreno) || 0;
  const minArea = ((hasMultipleUnits || hasSingleUnit) && imovel.emp_min_area !== undefined && imovel.emp_min_area !== null)
    ? imovel.emp_min_area
    : (areaUtil > 0 ? areaUtil : (areaConstruida > 0 ? areaConstruida : areaTerreno));

  // Location logic
  const uf = imovel.uf_nome || '';
  const cidade = imovel.cidade_nome || '';
  const bairro = imovel.bairro_nome || '';
  const locationTitle = [bairro, cidade].filter(Boolean).join(', ') + (uf ? `/${uf.toUpperCase()}` : '')

  const nextImage = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setImageError(false)
    setCurrentImageIndex((prev) => (prev + 1) % (imagens_urls.length || 1))
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setImageError(false)
    setCurrentImageIndex((prev) => (prev - 1 + (imagens_urls.length || 1)) % (imagens_urls.length || 1))
  }

  const isRental = !!imovel.is_locacao

    const handleCardClick = () => {
        router.push(buildPropertyUrl(imovel))
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
    // Dynamic top-left badges
    const activeBadges: Array<{ text: string; bg: string; color: string; shadow?: string }> = [];
    if (imovel.created_at) {
        const createdDate = new Date(imovel.created_at);
        const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30) {
            activeBadges.push({ text: 'NOVO', bg: '#ffffff', color: '#0f172a' });
        }
    }
    if (isEmpreendimento) {
        activeBadges.push({
            text: 'EMPREENDIMENTO',
            bg: '#7F34E6',
            color: '#ffffff',
            shadow: '0 4px 12px rgba(127, 52, 230, 0.25)'
        });
    }

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
            <Share2 size={15} />
        </button>

        <button 
            className={`${styles.heartBtnFloating} ${isFavorited ? styles.heartActive : ''}`} 
            onClick={handleFavoriteToggle}
            title={isFavorited ? "Remover dos Favoritos" : "Adicionar aos Favoritos"}
        >
            <Heart size={15} fill={isFavorited ? '#ef4444' : 'none'} className={isFavorited ? 'text-red-500' : ''} />
        </button>

        {imagens_urls && imagens_urls.length > 0 && !imageError ? (
            <Image
                src={imagens_urls[currentImageIndex]}
                alt={nome}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className={styles.image}
                onClick={(e) => { e.stopPropagation(); handleCardClick(); }}
                onError={() => setImageError(true)}
            />
        ) : (
            <div className={styles.noPhotoPlaceholder} onClick={handleCardClick}>
                <ImageOff size={48} strokeWidth={1} className={styles.noPhotoIcon} />
                <div className={styles.noPhotoText}>
                    <span>FOTOS EM BREVE</span>
                    <p>Solicite fotos deste imóvel</p>
                </div>
            </div>
        )}
        {/* Dynamic Badges Container */}
        {activeBadges.length > 0 && (
          <div className={styles.badgesContainer}>
            {activeBadges.map((badge, idx) => (
              <div 
                key={idx} 
                className={styles.badgeItem} 
                style={{ 
                  backgroundColor: badge.bg, 
                  color: badge.color,
                  boxShadow: badge.shadow
                }}
              >
                {badge.text}
              </div>
            ))}
          </div>
        )}

        {showStatus && (
          <div className={styles.statusBadge}>
            {(imovel.status_imovel_nome || imovel.status || '').toUpperCase()}
          </div>
        )}

        {hasSingleUnit && (
          <div className={styles.lastUnitBadge}>
            ÚLTIMA UNIDADE DISPONÍVEL
          </div>
        )}
        
        {imagens_urls.length > 1 && (
          <>
            <div className={styles.dotsIndicator}>
              {imagens_urls.slice(0, 5).map((_, idx) => (
                <span
                  key={idx}
                  className={`${styles.dot} ${idx === currentImageIndex ? styles.dotActive : ''}`}
                />
              ))}
              {imagens_urls.length > 5 && <span className={styles.dotMore}>+{imagens_urls.length - 5}</span>}
            </div>
          </>
        )}
      </div>

      <div className={styles.content}>
        <p className={styles.locationSubtitle}>{locationTitle || 'Localização não informada'}</p>
        {logradouro && <p className={styles.addressSub}>{logradouro}</p>}
        
        {(() => {
          const dimensoesTerreno = (imovel.dimensoes_terreno || '').trim();
          
          const dormitorios = Number(imovel.dormitorios) || 0;
          const suites = Number(imovel.suites) || 0;
          const banheiros = Number(imovel.banheiros) || 0;
          const lavabo = Number(imovel.lavabo) || 0;
          const vagas = Number(imovel.vagas) || 0;
          
          const hasArea = minArea > 0 || !!dimensoesTerreno;
          const hasAnyFeature = hasArea || dormitorios > 0 || suites > 0 || banheiros > 0 || lavabo > 0 || vagas > 0;
          
          if (!hasAnyFeature) return null;
          
          return (
            <div className={styles.featuresRow}>
              {hasArea && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={hasMultipleUnits ? "Área a partir de" : hasSingleUnit ? "Área da última unidade" : (areaUtil > 0 ? "Área Útil" : areaConstruida > 0 ? "Área Construída" : areaTerreno > 0 ? "Área Terreno" : "Dimensões do Terreno")} 
                  title={hasMultipleUnits ? "Área a partir de" : hasSingleUnit ? "Área da última unidade" : (areaUtil > 0 ? "Área Útil" : areaConstruida > 0 ? "Área Construída" : areaTerreno > 0 ? "Área Terreno" : "Dimensões do Terreno")}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 3v18h18" />
                    <rect x="7" y="3" width="14" height="14" rx="2" strokeDasharray="2 2" />
                  </svg>
                  <span>
                    {minArea > 0
                      ? (hasMultipleUnits ? `a partir de ${Number(minArea).toFixed(2)} m²` : `${Number(minArea).toFixed(2)} m²`)
                      : dimensoesTerreno}
                  </span>
                </div>
              )}
              {dormitorios > 0 && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={dormitorios === 1 ? 'Dormitório' : 'Dormitórios'} 
                  title={dormitorios === 1 ? 'Dormitório' : 'Dormitórios'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 17h20M2 17v-4c0-1.1.9-2 2-2h16c1.1 0 2 .9 2 2v4M6 11V7c0-1.1.9-2 2-2h8c1.1 0 2 .9 2 2v4M6 11h12" />
                  </svg>
                  <span>{dormitorios}</span>
                </div>
              )}
              {suites > 0 && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={suites === 1 ? 'Suíte' : 'Suítes'} 
                  title={suites === 1 ? 'Suíte' : 'Suítes'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.8 }}>
                    <path d="M2 17h20M2 17v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4M6 11V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M12 5v6" />
                  </svg>
                  <span>{suites}</span>
                </div>
              )}
              {banheiros > 0 && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={banheiros === 1 ? 'Banheiro' : 'Banheiros'} 
                  title={banheiros === 1 ? 'Banheiro' : 'Banheiros'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 10h18v7a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-7zM7 21v2M17 21v2M12 2v2M2 10V8a2 2 0 0 1 2-2h2" />
                  </svg>
                  <span>{banheiros}</span>
                </div>
              )}
              {lavabo > 0 && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={lavabo === 1 ? 'Lavabo' : 'Lavabos'} 
                  title={lavabo === 1 ? 'Lavabo' : 'Lavabos'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v4" />
                    <path d="M12 6a3 3 0 0 1 3 3v1H9V9a3 3 0 0 1 3-3Z" />
                    <path d="M5 10h14v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4v-7Z" />
                  </svg>
                  <span>{lavabo}</span>
                </div>
              )}
              {vagas > 0 && (
                <div 
                  className={styles.featureItem} 
                  data-tooltip={vagas === 1 ? 'Vaga de Garagem' : 'Vagas de Garagem'} 
                  title={vagas === 1 ? 'Vaga de Garagem' : 'Vagas de Garagem'}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18.7 8.2c-.5-1.4-1.8-2.2-3.3-2.2H8.6c-1.5 0-2.8.8-3.3 2.2L2.5 11.1c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2M5 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2M15 17v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2" />
                  </svg>
                  <span>{vagas}</span>
                </div>
              )}
            </div>
          );
        })()}
 
 
 
        <div className={styles.priceContainer}>
          {imovel.pub_price === false ? (
            <div className={styles.priceValueMasked}>CONSULTAR PREÇO</div>
          ) : hasMultipleUnits ? (
            <div className={styles.premiumDevBlock}>
              <span className={styles.premiumDevLabel}>Unidades disponíveis a partir de:</span>
              <div className={styles.premiumDevValues}>
                <strong className={styles.premiumDevPrice}>
                  {priceFormatted}
                  {isRental && '/mês'}
                </strong>
              </div>
            </div>
          ) : hasSingleUnit ? (
            <div className={styles.premiumDevBlock}>
              <span className={styles.premiumDevLabel}>Última unidade disponível:</span>
              <div className={styles.premiumDevValues}>
                <strong className={styles.premiumDevPrice}>
                  {priceFormatted}
                  {isRental && '/mês'}
                </strong>
              </div>
            </div>
          ) : (
            <div className={styles.priceValue} style={{ margin: '0.25rem 0' }}>
              <strong className={styles.priceMainVal}>{priceFormatted}</strong>
              {isRental && <span className={styles.priceLabel}>aluguel</span>}
              {!isRental && <span className={styles.priceLabel}>venda</span>}
            </div>
          )}

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
              {imovel.owner_phone ? (
                  imovel.owner_phone.split(/[,/]/).map((num, idx) => {
                      const cleanNum = num.replace(/\D/g, '');
                      const formatted = num.length >= 10 ? (() => {
                          const cleaned = num.replace(/\D/g, '');
                          if (cleaned.length === 11) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
                          if (cleaned.length === 10) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
                          return num;
                      })() : num;
                      return (
                          <React.Fragment key={num}>
                              {idx > 0 && <span className={styles.phoneDivider}>|</span>}
                              <a href={`tel:${cleanNum}`} className={styles.phoneNumberLink}>{formatted.trim()}</a>
                          </React.Fragment>
                      );
                  })
              ) : (
                  <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Telefone não informado</span>
              )}
          </div>
      )}
    </article>
  )
}
