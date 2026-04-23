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
}

export default function WhatsAppLink({
    messageOrImovel,
    isFullMessage = false,
    className,
    style,
    title,
    children,
    produto_servico_id
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
