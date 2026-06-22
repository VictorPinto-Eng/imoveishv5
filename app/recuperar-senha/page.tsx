'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Lock, Eye, EyeOff, Check, AlertCircle } from 'lucide-react'
import styles from './recuperar.module.css'

function RecuperarSenhaContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')
    
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    
    const [requirements, setRequirements] = useState({
        length: false,
        upper: false,
        lower: false,
        number: false,
        special: false
    })

    useEffect(() => {
        setRequirements({
            length: password.length >= 8,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[^A-Za-z0-9]/.test(password)
        })
    }, [password])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (!token) {
            setError('Token de recuperação não encontrado.')
            return
        }

        const allMet = Object.values(requirements).every(v => v)
        if (!allMet) {
            setError('A senha deve atender a todos os requisitos de segurança.')
            return
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password }),
            })

            const data = await res.json()

            if (!res.ok) throw new Error(data.error)

            setSuccess(true)
            setTimeout(() => {
                router.push('/')
            }, 3000)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (success) {
        return (
            <div className={styles.container}>
                <div className={styles.card}>
                    <div className={styles.successIcon}>
                        <Check size={48} />
                    </div>
                    <h1 className={styles.title}>Senha Redefinida!</h1>
                    <p className={styles.description}>
                        Sua senha foi atualizada com sucesso. Você será redirecionado para a página inicial em instantes.
                    </p>
                    <button className={styles.button} onClick={() => router.push('/')}>
                        Voltar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.header}>
                    <Image src="/logo_hv5_1024.png" alt="HV5" width={120} height={44} priority />
                </div>
                
                <h1 className={styles.title}>Nova Senha</h1>
                <p className={styles.description}>
                    Crie uma senha forte e segura para proteger sua conta no ecossistema HV5.
                </p>

                {error && <div className={styles.errorMessage}>{error}</div>}

                <form className={styles.form} onSubmit={handleSubmit}>
                    <div className={styles.inputWrapper}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Crie uma nova senha" 
                            className={styles.input}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <Lock className={styles.fieldIcon} size={20} />
                        <button 
                            type="button" 
                            className={styles.eyeButton} 
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>

                    <div className={styles.requirementsList}>
                        <div className={`${styles.requirementItem} ${requirements.length ? styles.requirementMet : ''}`}>
                            {requirements.length ? <Check size={12} /> : <AlertCircle size={12} />}
                            <span>Mín. 8 caracteres</span>
                        </div>
                        <div className={`${styles.requirementItem} ${requirements.upper ? styles.requirementMet : ''}`}>
                            {requirements.upper ? <Check size={12} /> : <AlertCircle size={12} />}
                            <span>Letra maiúscula</span>
                        </div>
                        <div className={`${styles.requirementItem} ${requirements.lower ? styles.requirementMet : ''}`}>
                            {requirements.lower ? <Check size={12} /> : <AlertCircle size={12} />}
                            <span>Letra minúscula</span>
                        </div>
                        <div className={`${styles.requirementItem} ${requirements.number ? styles.requirementMet : ''}`}>
                            {requirements.number ? <Check size={12} /> : <AlertCircle size={12} />}
                            <span>Número</span>
                        </div>
                        <div className={`${styles.requirementItem} ${requirements.special ? styles.requirementMet : ''}`}>
                            {requirements.special ? <Check size={12} /> : <AlertCircle size={12} />}
                            <span>Caractere especial</span>
                        </div>
                    </div>

                    <div className={styles.inputWrapper}>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="Confirme a nova senha" 
                            className={styles.input}
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                        <Lock className={styles.fieldIcon} size={20} />
                    </div>

                    <button className={styles.button} type="submit" disabled={loading}>
                        {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : 'Salvar Nova Senha'}
                    </button>
                </form>
            </div>
        </div>
    )
}

export default function RecuperarSenhaPage() {
    return (
        <Suspense fallback={<div>Carregando...</div>}>
            <RecuperarSenhaContent />
        </Suspense>
    )
}
