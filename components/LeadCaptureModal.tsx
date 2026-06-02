'use client';

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, User, Mail, Phone as PhoneIcon, CheckCircle2 } from 'lucide-react'
import { maskPhone } from '@/lib/format'
import styles from './LeadCaptureModal.module.css'

interface LeadCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  propertyId: string | number
  propertyTitle: string
  origin?: string
}

const countries = [
  { name: 'Brasil', code: '+55', flag: '🇧🇷' },
  { name: 'Portugal', code: '+351', flag: '🇵🇹' },
  { name: 'Estados Unidos', code: '+1', flag: '🇺🇸' },
  { name: 'Argentina', code: '+54', flag: '🇦🇷' },
  { name: 'Angola', code: '+244', flag: '🇦🇴' },
  { name: 'Cabo Verde', code: '+238', flag: '🇨🇻' },
  { name: 'Guiné-Bissau', code: '+245', flag: '🇬🇼' },
  { name: 'Moçambique', code: '+258', flag: '🇲🇿' },
  { name: 'São Tomé e Príncipe', code: '+239', flag: '🇸🇹' },
  { name: 'Timor-Leste', code: '+670', flag: '🇹🇱' },
  { name: 'Canadá', code: '+1', flag: '🇨🇦' },
  { name: 'Reino Unido', code: '+44', flag: '🇬🇧' },
  { name: 'França', code: '+33', flag: '🇫🇷' },
  { name: 'Alemanha', code: '+49', flag: '🇩🇪' },
  { name: 'Itália', code: '+39', flag: '🇮🇹' },
  { name: 'Espanha', code: '+34', flag: '🇪🇸' },
  { name: 'Japão', code: '+81', flag: '🇯🇵' },
  { name: 'China', code: '+86', flag: '🇨🇳' }
  // Simplified list for the modal, can be expanded if needed
]

export default function LeadCaptureModal({
  isOpen,
  onClose,
  onSuccess,
  propertyId,
  propertyTitle
}: LeadCaptureModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showCountryPicker, setShowCountryPicker] = useState(false)
  const [countrySearch, setCountrySearch] = useState('')
  const [activeTab, setActiveTab] = useState<'quick' | 'register'>('quick')
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    country_code: '+55'
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: '', email: '', phone: '', country_code: '+55' })
      setIsSuccess(false)
      setActiveTab('quick')
    }
  }, [isOpen])

  const handleLoginClick = () => {
    onClose();
    setTimeout(() => {
      const loginBtn = document.querySelector('button[class*="loginButtonPill"]') as HTMLButtonElement;
      if (loginBtn) {
        loginBtn.click();
      }
    }, 150);
  };

  if (!isOpen || !mounted) return null

  const formatPhone = (value: string) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = formatPhone(e.target.value);
    setFormData({ ...formData, phone: value });
  }

  const selectCountry = (country: typeof countries[0]) => {
    setFormData({ ...formData, country_code: country.code });
    setShowCountryPicker(false);
    setCountrySearch('');
  }

  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.code.includes(countrySearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          whatsapp: `${formData.country_code}${formData.phone.replace(/\D/g, '')}`,
          email: formData.email,
          mensagem: `Lead capturado via Phone Reveal para o imóvel: ${propertyTitle} (Cód: ${propertyId})`,
          codigo: propertyId.toString(),
          operacao: 'Consulta Telefone',
          source: 'phone_reveal'
        })
      })

      if (res.ok) {
        setIsSuccess(true)

        // Track analytics
        fetch('/api/analytics/event', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            produto_servico_id: Number(propertyId),
            event_name: 'phone_reveal_lead',
            event_category: 'conversion',
            page_url: window.location.pathname
          })
        }).catch(err => console.error('[Analytics] Failed to track phone reveal lead:', err))

        // Record Audit Log
        fetch('/api/analytics/audit-log', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            propertyId: propertyId,
            action: 'reveal_phone_lead_captured',
            eventCode: '102',
            origin: origin,
            details: { name: formData.name, email: formData.email }
          })
        }).catch(err => console.error('[AuditLog] Failed:', err))

        setTimeout(() => {
          onSuccess()
          onClose()
        }, 2000)
      } else {
        alert('Ocorreu um erro ao processar seus dados. Por favor, tente novamente.')
      }
    } catch (error) {
      console.error('Error submitting lead:', error)
      alert('Erro de conexão. Tente novamente mais tarde.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={20} /> Fechar
        </button>

        {isSuccess ? (
          <div className={styles.successContainer}>
            <div className={styles.successIcon}>
              <CheckCircle2 size={40} />
            </div>
            <h2 className={styles.successTitle}>Obrigado!</h2>
            <p className={styles.successMessage}>
              Seus dados foram recebidos. Liberando os telefones para você...
            </p>
          </div>
        ) : (
          <>
            <h2 className={styles.title} style={{ marginBottom: '1.5rem' }}>Quer falar com o anunciante?</h2>
            
            <div className={styles.tabContainer}>
              <button 
                type="button"
                className={`${styles.tabButton} ${activeTab === 'quick' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('quick')}
              >
                Acesso Rápido
              </button>
              <button 
                type="button"
                className={`${styles.tabButton} ${activeTab === 'register' ? styles.tabButtonActive : ''}`}
                onClick={() => setActiveTab('register')}
              >
                Vantagens de se Cadastrar ✨
              </button>
            </div>

            {activeTab === 'quick' ? (
              <>
                <p className={styles.subtitle} style={{ 
                    fontSize: '0.825rem', 
                    color: '#64748b', 
                    textAlign: 'center', 
                    marginTop: '-0.75rem', 
                    marginBottom: '1.25rem',
                    padding: '0 0.5rem',
                    lineHeight: '1.4'
                }}>
                    Insira seus dados abaixo para visualizar todos os telefones de contato imediatamente.
                </p>

                <form onSubmit={handleSubmit} className={styles.form}>
                  <div className={styles.inputWrapper}>
                    <User size={18} className={styles.inputIcon} />
                    <input
                      type="text"
                      placeholder="Digite seu nome"
                      className={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.inputWrapper}>
                    <Mail size={18} className={styles.inputIcon} />
                    <input
                      type="email"
                      placeholder="Digite seu email"
                      className={styles.input}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.inputWrapper}>
                    <button 
                      type="button"
                      className={styles.countrySelector}
                      onClick={() => setShowCountryPicker(!showCountryPicker)}
                    >
                      <span>{countries.find(c => c.code === formData.country_code)?.flag || '🇧🇷'}</span>
                      <span>{formData.country_code}</span>
                    </button>

                    {showCountryPicker && (
                      <div className={styles.countryPicker}>
                        <input 
                          autoFocus
                          type="text"
                          placeholder="Buscar país..."
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          className={styles.countrySearchInput}
                        />
                        <div className={styles.countryList}>
                          {filteredCountries.map((c, i) => (
                            <div 
                              key={i}
                              onClick={() => selectCountry(c)}
                              className={styles.countryItem}
                            >
                              <span>{c.flag}</span>
                              <span style={{ flex: 1 }}>{c.name}</span>
                              <span style={{ color: '#64748b' }}>{c.code}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <input
                      type="tel"
                      placeholder="(xx) xxxxx-xxxx"
                      className={styles.input}
                      style={{ paddingLeft: '7.5rem' }}
                      value={formData.phone}
                      onChange={handlePhoneChange}
                      required
                    />
                    <PhoneIcon size={18} className={styles.inputIcon} />
                  </div>

                  <button 
                    type="submit" 
                    className={styles.submitBtn}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Processando...' : 'Ver Telefones'}
                  </button>
                </form>

                <p className={styles.footerText}>
                  Ao enviar, você afirma que leu, compreendeu e concordou com os nossos <a href="/termos">Termos de Uso</a> e <a href="/politica-de-privacidade">Política de Privacidade</a>.
                </p>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, textAlign: 'center', marginBottom: '1.25rem', lineHeight: '1.4' }}>
                  Crie uma conta gratuita para ter acesso a mais recursos:
                </p>
                
                <div className={styles.benefitsList}>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={16} className={styles.benefitIcon} />
                    <span>Ver todos os telefones sem precisar preencher dados novamente</span>
                  </div>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={16} className={styles.benefitIcon} />
                    <span>Salvar seus imóveis favoritos e receber alertas de preços</span>
                  </div>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={16} className={styles.benefitIcon} />
                    <span>Histórico de mensagens e contatos em um único painel</span>
                  </div>
                  <div className={styles.benefitItem}>
                    <CheckCircle2 size={16} className={styles.benefitIcon} />
                    <span>Enviar propostas de compra ou locação online</span>
                  </div>
                </div>

                <button 
                  type="button" 
                  onClick={handleLoginClick} 
                  className={styles.registerBtn}
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  Entrar ou Cadastrar Grátis
                </button>
                
                <p className={styles.footerText}>
                  Rápido, seguro e 100% gratuito.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
