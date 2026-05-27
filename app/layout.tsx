import type { Metadata } from 'next'
import './globals.css'
import SpecialistHelp from '@/components/SpecialistHelp'

export const metadata: Metadata = { 
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
    icons: { icon: '/icone_5_navegador.png?v=4' },
    title: {
        default: 'HV5 Imóveis | Compra, Venda e Aluguel em Pernambuco',
        template: '%s | HV5 Imóveis',
    },
    description: 'Encontre apartamentos, casas e imóveis comerciais para compra, venda e aluguel em Pernambuco. HV5 Imóveis — sua imobiliária de confiança.',
    keywords: ['imóveis Pernambuco', 'apartamento', 'casa', 'aluguel', 'compra imóvel', 'HV5', 'imobiliária Recife'],
    openGraph: {
        type: 'website',
        locale: 'pt_BR',
        siteName: 'HV5 Imóveis',
        title: 'HV5 Imóveis | Compra, Venda e Aluguel em Pernambuco',
        description: 'Encontre apartamentos, casas e imóveis comerciais para compra, venda e aluguel em Pernambuco.',
        images: [{ url: '/logo_hv5_1024.png', width: 1024, height: 1024, alt: 'HV5 Imóveis' }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'HV5 Imóveis | Compra, Venda e Aluguel em Pernambuco',
        description: 'Encontre apartamentos, casas e imóveis comerciais para compra, venda e aluguel em Pernambuco.',
        images: ['/logo_hv5_1024.png'],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: { index: true, follow: true },
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body suppressHydrationWarning>
                {children}
                <SpecialistHelp />
            </body>
        </html>
    )
}
