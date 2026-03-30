'use client';

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { maskPhone } from '@/lib/format'
import styles from './ContactModal.module.css'

interface ContactModalProps {
  propertyId: string
  isOpen: boolean
  onClose: () => void
  propertyTitle: string
  propertyLocation: string
  brokerName?: string
  isRental?: boolean
}

export default function ContactModal({
  propertyId,
  isOpen,
  onClose,
  propertyTitle,
  propertyLocation,
  brokerName = "REMAX MAIS - 2",
  isRental = false
}: ContactModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  
  const emailRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Olá! Tenho interesse neste imóvel em ${isRental ? 'Locação' : 'Venda'} (Cód: ${propertyId}) que vi no site HV5.com.`
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (isOpen) {
      // Reset state to avoid cache from previous entry
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: `Olá! Tenho interesse neste imóvel em ${isRental ? 'Locação' : 'Venda'} (Cód: ${propertyId}) que vi no site HV5.com.`
      })
      setIsSuccess(false)

      // Small timeout to ensure DOM is ready
      setTimeout(() => emailRef.current?.focus(), 50)

      const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setFormData(prev => ({
            ...prev,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.first_name || '',
            phone: user.user_metadata?.phone || ''
          }))
        }
      }
      fetchUser()
    }
  }, [isOpen, isRental])

  if (!isOpen || !mounted) return null

  const handleKeyDown = (e: React.KeyboardEvent, nextRef: React.RefObject<any>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      nextRef.current?.focus()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    if (!formData.name || !formData.email) {
        alert('Por favor, preencha seu nome e e-mail.');
        setIsSubmitting(false);
        return;
    }
    
    try {
        // Now calling our internal proxy to avoid CORS issues
        const res = await fetch("/api/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: formData.name,
                whatsapp: formData.phone,
                email: formData.email,
                mensagem: formData.message,
                codigo: propertyId,
                operacao: isRental ? 'Locação' : 'Venda'
            })
        });

        if (res.ok) {
            setIsSuccess(true);
            
            // Track lead submission for internal analytics (independent of CRM)
            fetch('/api/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produto_servico_id: Number(propertyId),
                    event_name: 'lead_submit',
                    event_category: 'conversion',
                    page_url: window.location.pathname
                })
            }).catch(err => console.error('[Analytics] Failed to track lead submission:', err));

            setTimeout(() => {
                onClose();
            }, 3500);
        } else {
            const statusEl = document.getElementById('modal-contatar-status');
            if (statusEl) {
              statusEl.innerText = 'Erro ao processar lead (Webhook).';
              statusEl.style.color = '#ef4444';
            }
            alert('Não foi possível processar o seu contato no momento. Tente novamente.')
        }
    } catch (error) {
        console.error('Error submitting contact form:', error)
        const statusEl = document.getElementById('modal-contatar-status');
        if (statusEl) {
          statusEl.innerText = 'Erro de conexão.';
          statusEl.style.color = '#ef4444';
        }
        alert('Erro de conexão. Tente novamente mais tarde.')
    } finally {
        setIsSubmitting(false)
    }
  }

  const modalContent = (
    <div className={styles.overlay} onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          <X size={24} />
        </button>

        {isSuccess ? (
          <div className={styles.successContainer}>
             <div className={styles.successIcon}>
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
             </div>
             <h2>Mensagem Enviada!</h2>
             <p>Suas informações foram entregues com sucesso ao responsável. Em breve entraremos em contato.</p>
          </div>
        ) : (
          <>
            <header className={styles.header}>
              <h2>Entre em contato com o responsável para o imóvel</h2>
            </header>

            <form 
              id="modal-contatar-form"
              onSubmit={handleSubmit} 
              className={styles.form}
            >
              <div id="modal-contatar-status" style={{ marginBottom: '10px', fontSize: '14px', fontWeight: 600, textAlign: 'center' }}></div>
              <div className={styles.inputGroup}>
                <label htmlFor="email">E-mail *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  ref={emailRef}
                  placeholder="Digite seu melhor e-mail"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, nameRef)}
                  required
                />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label htmlFor="name">Nome *</label>
                  <input
                    id="name"
                    name="nome"
                    type="text"
                    ref={nameRef}
                    placeholder="Digite seu nome"
                    value={formData.name}
                    className={styles.uppercaseInput}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                    onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                    required
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Telefone</label>
                  <input
                    id="phone"
                    name="telefone"
                    type="tel"
                    ref={phoneRef}
                    placeholder="(00) 00000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                    onKeyDown={(e) => handleKeyDown(e, messageRef)}
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="message">Mensagem</label>
                <textarea
                  id="message"
                  name="mensagem"
                  ref={messageRef}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  onKeyDown={(e) => handleKeyDown(e, submitRef)}
                  rows={4}
                />
              </div>

              <button 
                type="submit" 
                ref={submitRef}
                className={styles.submitBtn} 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Contatar'} <Mail size={18} />
              </button>
            </form>

            <footer className={styles.footer}>
              <p>
                Ao enviar, você está aceitando os <a href="#">Termos e condições de uso</a> e as <a href="#">Políticas de privacidade</a>
              </p>
            </footer>
          </>
        )}
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
