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
}

export default function ContactModal({
  propertyId,
  isOpen,
  onClose,
  propertyTitle,
  propertyLocation,
  brokerName = "REMAX MAIS - 2"
}: ContactModalProps) {
  const [mounted, setMounted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const emailRef = useRef<HTMLInputElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)
  const messageRef = useRef<HTMLTextAreaElement>(null)
  const submitRef = useRef<HTMLButtonElement>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Olá! Quero ser contatado sobre este imóvel em venda que vi no HV5.com.`
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
        message: `Olá! Quero ser contatado sobre este imóvel em venda que vi no HV5.com.`
      })

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
  }, [isOpen])

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
    
    try {
        const res = await fetch('/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propertyId,
                ...formData
            })
        })

        if (res.ok) {
            // Track lead submission
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

            alert('Mensagem enviada com sucesso! O responsável entrará em contato em breve.')
            onClose()
        } else {
            const data = await res.json()
            alert(data.error || 'Ocorreu um erro ao enviar a mensagem.')
        }
    } catch (error) {
        console.error('Error submitting contact form:', error)
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

        <header className={styles.header}>
          <h2>Entre em contato com o responsável para o imóvel</h2>
        </header>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
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
              <label htmlFor="name">Nome</label>
              <input
                id="name"
                type="text"
                ref={nameRef}
                placeholder="Digite seu nome"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label htmlFor="phone">Telefone</label>
              <input
                id="phone"
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
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
