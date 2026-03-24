'use client'

import { useRouter } from 'next/navigation'

export default function BackButton({
  className,
  fallbackHref = '/imoveis',
  children = '← Voltar',
}: {
  className?: string
  fallbackHref?: string
  children?: React.ReactNode
}) {
  const router = useRouter()

  const onBack = () => {
    // se tiver histórico, volta; se não, vai pro fallback
    if (window.history.length > 1) router.back()
    else router.push(fallbackHref)
  }

  return (
    <button type="button" onClick={onBack} className={className}>
      {children}
    </button>
  )
}
