import type { Metadata } from 'next'
import './globals.css'
import SpecialistHelp from '@/components/SpecialistHelp'

export const metadata = { 
    icons: { icon: '/icone_5_navegador.png?v=4' },
    title: 'HV5',
    description: 'Encontre o imóvel dos seus sonhos',
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
