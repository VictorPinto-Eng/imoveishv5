const DEFAULT_WHATSAPP_PHONE = '5511999999999'

function sanitizePhone(phone: string) {
    return (phone || '').replace(/\D/g, '')
}

/**
 * Link universal:
 * - Desktop: abre a página do WhatsApp com "Abrir app" + "Continuar para WhatsApp Web"
 * - Mobile: normalmente abre o app, ou mostra o botão pra abrir
 */
export function getWhatsappLink(messageOrImovel: string, isFullMessage = false) {
    const phone = sanitizePhone(process.env.NEXT_PUBLIC_WHATSAPP_PHONE || DEFAULT_WHATSAPP_PHONE)

    const text = isFullMessage
        ? messageOrImovel
        : `Vim pelo site, quero o imóvel ${messageOrImovel}`

    const encoded = encodeURIComponent(text)

    return `https://api.whatsapp.com/send?phone=${phone}&text=${encoded}`
}
