'use client'

import React, { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, MessageCircle, UserPlus } from 'lucide-react'
import { maskPhone } from '@/lib/format'

const DEFAULT_WHATSAPP_PHONE = '5581935001220'

function sanitizePhone(phone: string) {
    return (phone || '').replace(/\D/g, '')
}

function isMobileUA(ua: string) {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(ua)
}

type Props = {
    messageOrImovel: string
    isFullMessage?: boolean
    className?: string
    style?: React.CSSProperties
    title?: string
    children: React.ReactNode
    produto_servico_id?: number
    origin?: string
}

export default function WhatsAppLink({
    messageOrImovel,
    isFullMessage = false,
    className,
    style,
    title,
    children,
    produto_servico_id,
    origin = 'unknown'
}: Props) {
    const [showModal, setShowModal] = useState(false)
    const [modalName, setModalName] = useState('')
    const [modalPhone, setModalPhone] = useState('')
    const [submitting, setSubmitting] = useState(false)

    const phone = sanitizePhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE)

    const text = isFullMessage
        ? messageOrImovel
        : `Vim pelo site, tenho interesse no imóvel ${messageOrImovel}${produto_servico_id ? ` (Cód: ${produto_servico_id})` : ''}`

    const encoded = encodeURIComponent(text)
    const desktopUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
    const mobileUrl = `https://wa.me/${phone}?text=${encoded}`

    const openWhatsApp = () => {
        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
        if (isMobileUA(ua)) {
            window.open(mobileUrl, '_blank', 'noopener,noreferrer')
        } else {
            window.open(desktopUrl, '_blank', 'noopener,noreferrer')
        }
    }

    const trackAndRegister = (userName: string, userEmail: string, userPhone: string) => {
        if (!produto_servico_id) return

        fetch('/api/analytics/event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                produto_servico_id,
                event_name: 'click_whatsapp',
                event_category: 'conversion',
                page_url: window.location.pathname
            })
        }).catch(err => console.error('[Analytics] Failed:', err));

        fetch('/api/analytics/audit-log', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                propertyId: produto_servico_id,
                action: 'click_whatsapp',
                eventCode: '200',
                origin: origin
            })
        }).catch(err => console.error('[AuditLog] Failed:', err));

        fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: userName,
                email: userEmail || undefined,
                whatsapp: userPhone || undefined,
                mensagem: text,
                codigo: produto_servico_id,
                origem: 'whatsapp'
            })
        }).catch(err => console.error('[Lead] Failed:', err));
    }

    const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()

        if (!produto_servico_id) {
            openWhatsApp()
            return
        }

        // Verificar se está logado
        try {
            const authRes = await fetch('/api/auth/me')
            if (authRes.ok) {
                const authData = await authRes.json()
                if (authData.authenticated && authData.user) {
                    const userName = authData.user.social_name || authData.user.name || 'Contato via WhatsApp'
                    const userEmail = authData.user.email || ''
                    const userPhone = authData.user.phone || ''
                    trackAndRegister(userName, userEmail, userPhone)
                    openWhatsApp()
                    return
                }
            }
        } catch {}

        // Não está logado — mostrar modal
        setShowModal(true)
    }

    const handleModalSubmit = () => {
        if (!modalName.trim() || !modalPhone.trim()) return
        setSubmitting(true)

        trackAndRegister(modalName.trim(), '', modalPhone.replace(/\D/g, ''))

        setTimeout(() => {
            setShowModal(false)
            setSubmitting(false)
            setModalName('')
            setModalPhone('')
            openWhatsApp()
        }, 300)
    }

    const handleSkip = () => {
        trackAndRegister('Contato via WhatsApp', '', '')
        setShowModal(false)
        openWhatsApp()
    }

    return (
        <>
            <a
                href={desktopUrl}
                onClick={onClick}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                style={style}
                title={title}
            >
                {children}
            </a>

            {showModal && typeof document !== 'undefined' && createPortal(
                <div
                    onClick={() => setShowModal(false)}
                    style={{
                        position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 99999, padding: '16px'
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            background: 'white', borderRadius: '20px', padding: '32px',
                            maxWidth: '420px', width: '100%', position: 'relative',
                            boxShadow: '0 25px 50px rgba(0,0,0,0.15)'
                        }}
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'none', cursor: 'pointer', color: '#94a3b8' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(37, 211, 102, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <MessageCircle size={28} color="#25D366" />
                            </div>
                            <h3 style={{ margin: '0 0 8px', fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                                Antes de continuar...
                            </h3>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#64748b', lineHeight: 1.5 }}>
                                Informe seu nome e telefone para que o anunciante possa te identificar e dar continuidade ao atendimento.
                            </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                            <input
                                type="text"
                                placeholder="Seu nome"
                                value={modalName}
                                onChange={(e) => setModalName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                                style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                                autoFocus
                            />
                            <input
                                type="tel"
                                placeholder="Seu telefone (WhatsApp)"
                                value={modalPhone}
                                onChange={(e) => setModalPhone(maskPhone(e.target.value))}
                                onKeyDown={(e) => e.key === 'Enter' && handleModalSubmit()}
                                style={{ padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '0.95rem', outline: 'none' }}
                            />
                        </div>

                        <button
                            onClick={handleModalSubmit}
                            disabled={!modalName.trim() || !modalPhone.trim() || submitting}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: '#25D366', color: 'white', fontSize: '1rem', fontWeight: 700,
                                cursor: (!modalName.trim() || !modalPhone.trim()) ? 'not-allowed' : 'pointer',
                                opacity: (!modalName.trim() || !modalPhone.trim()) ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                <MessageCircle size={18} /> Continuar para WhatsApp
                            </span>
                        </button>

                        <div style={{ textAlign: 'center', marginTop: '14px' }}>
                            <button
                                onClick={handleSkip}
                                style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}
                            >
                                Pular e ir direto ao WhatsApp
                            </button>
                        </div>

                        <div style={{ marginTop: '20px', padding: '12px 16px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <UserPlus size={16} color="#7f34e6" style={{ marginTop: '2px', flexShrink: 0 }} />
                            <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                                <strong style={{ color: '#475569' }}>Crie uma conta gratuita</strong> para salvar favoritos, receber alertas de novos imóveis e acompanhar suas propostas.
                            </p>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
