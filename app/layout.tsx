import type { Metadata } from 'next'
import './globals.css'

export const metadata = {
    title: 'HV5 Imóveis',
    description: 'Encontre o imóvel dos seus sonhos',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="pt-BR" suppressHydrationWarning>
            <body suppressHydrationWarning>{children}</body>
        </html>
    )
}
