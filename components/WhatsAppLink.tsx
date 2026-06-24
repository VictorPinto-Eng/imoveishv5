'use client'

import React from 'react'

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
    const phone = sanitizePhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE)

    const text = isFullMessage
        ? messageOrImovel
        : `Vim pelo site, tenho interesse no imóvel ${messageOrImovel}${produto_servico_id ? ` (Cód: ${produto_servico_id})` : ''}`

    const encoded = encodeURIComponent(text)

    // SSR-safe default (desktop/intermediária)
    const desktopUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`

    // Mobile (mais direto)
    const mobileUrl = `https://wa.me/${phone}?text=${encoded}`

    const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
        // Track the click if ID was provided
        if (produto_servico_id) {
            fetch('/api/analytics/event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    produto_servico_id,
                    event_name: 'click_whatsapp',
                    event_category: 'conversion',
                    page_url: window.location.pathname
                })
            }).catch(err => console.error('[Analytics] Failed to track whatsapp click:', err));

            // Record Audit Log
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

            // Registrar lead + atendimento no mural do anunciante
            // Buscar dados do usuário logado se houver
            let userName = 'Contato via WhatsApp';
            let userEmail = '';
            let userPhone = '';
            try {
                const authRes = await fetch('/api/auth/me');
                if (authRes.ok) {
                    const authData = await authRes.json();
                    if (authData.authenticated && authData.user) {
                        userName = authData.user.social_name || authData.user.name || userName;
                        userEmail = authData.user.email || '';
                        userPhone = authData.user.phone || '';
                    }
                }
            } catch {}

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
            }).catch(err => console.error('[Lead] Failed to register whatsapp lead:', err));
        }

        const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
        if (isMobileUA(ua)) {
            e.preventDefault()
            window.open(mobileUrl, '_blank', 'noopener,noreferrer')
        }
    }

    return (
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
    )
}
