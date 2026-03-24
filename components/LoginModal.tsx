'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { X, Loader2, Eye, EyeOff, User, Phone, Mail, Lock } from 'lucide-react'
import styles from './loginModal.module.css'

interface LoginModalProps {
    isOpen: boolean
    onClose: () => void
}

type ViewMode = 'login' | 'signup'

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('login')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [needsActivation, setNeedsActivation] = useState(false)

    // Form states
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        idTipoUsuario: 2, // 1: Corretor, 2: Proprietário (Padrão)
    })

    // Refs for focus management
    const nameRef = useRef<HTMLInputElement>(null)
    const phoneRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const passwordRef = useRef<HTMLInputElement>(null)
    const confirmPasswordRef = useRef<HTMLInputElement>(null)

    // Initial focus on email when modal opens
    useEffect(() => {
        if (isOpen) {
            // Pequeno delay para garantir que o modal terminou a transição de entrada
            const timer = setTimeout(() => {
                emailRef.current?.focus()
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    if (!isOpen) return null

    const toggleMode = () => {
        setViewMode(viewMode === 'login' ? 'signup' : 'login')
        setError(null)
        setSuccess(null)
        setNeedsActivation(false)
        // Focus email after switching mode
        setTimeout(() => emailRef.current?.focus(), 50)
    }

    const handleKeyDown = (e: React.KeyboardEvent, nextField?: React.RefObject<HTMLInputElement | null>) => {
        if (e.key === 'Enter') {
            if (nextField && nextField.current) {
                e.preventDefault()
                nextField.current.focus()
            }
            // Se não houver nextField, o comportamento padrão (submit) ocorre
        }
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        setError(null)
        setNeedsActivation(false)
    }

    const handleUserTypeChange = (id: number) => {
        setFormData({ ...formData, idTipoUsuario: id })
    }

    const handleResendEmail = async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/auth/resend-verification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formData.email }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error)
            setSuccess(data.message)
            setNeedsActivation(false)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        setSuccess(null)

        if (viewMode === 'signup' && formData.password !== formData.confirmPassword) {
            setError('As senhas não coincidem.')
            setLoading(false)
            return
        }

        const endpoint = viewMode === 'login' ? '/api/auth/login' : '/api/auth/register'

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                if (data.needsActivation) {
                    setNeedsActivation(true)
                }
                throw new Error(data.error || 'Erro ao processar solicitação')
            }

            if (viewMode === 'signup') {
                setSuccess('Conta criada com sucesso! Faça login para continuar.')
                setViewMode('login')
            } else {
                // Login successful
                window.location.reload() // Or handle state globally
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
        const redirectUri = `${window.location.origin}/api/auth/callback/google`
        const scope = 'email profile'
        const responseType = 'code'
        
        const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&access_type=offline&prompt=consent`
        
        window.location.href = authUrl
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
                    <X size={24} />
                </button>

                <div className={styles.content}>
                    <div className={styles.header}>
                        <Image
                            src="/logo_hv5_v3.png"
                            alt="HV5 Logo"
                            width={400}
                            height={170}
                            className={styles.logoImage}
                        />
                    </div>

                    <h2 className={styles.title}>
                        {viewMode === 'login' ? 'Acesse ou crie sua conta' : 'Crie sua conta ou faça o login'}
                    </h2>

                    {error && <div className={styles.errorMessage}>{error}</div>}
                    {success && <div className={styles.successMessage}>{success}</div>}

                    {needsActivation && (
                        <div className={styles.resendContainer}>
                            <button 
                                type="button" 
                                className={styles.resendLink} 
                                onClick={handleResendEmail}
                                disabled={loading}
                            >
                                {loading ? 'Enviando...' : 'Clique aqui para reenviar o e-mail de ativação'}
                            </button>
                        </div>
                    )}

                    {/* 
                    <button className={styles.googleButton} type="button" onClick={handleGoogleLogin}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className={styles.googleIcon}>
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.26 1.07-3.71 1.07-2.87 0-5.3-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.11c-.22-.66-.35-1.36-.35-2.11s.13-1.45.35-2.11V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.83z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.86-2.59 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span>{viewMode === 'login' ? 'Entrar com Google' : 'Cadastrar com Google'}</span>
                    </button>

                    <div className={styles.divider}>
                        <span>ou</span>
                    </div> 
                    */}

                    <form className={styles.form} onSubmit={handleSubmit}>
                        {viewMode === 'signup' && (
                            <>
                                <p className={styles.formNote}>Todos os campos são obrigatórios para finalizar o seu cadastro.</p>
                                
                                <label className={styles.fieldLabel}>Você é:</label>
                                <div className={styles.userTypeSelector}>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 2 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(2)}
                                    >
                                        Proprietário(a)
                                    </button>
                                    <button 
                                        type="button"
                                        className={`${styles.typeOption} ${formData.idTipoUsuario === 1 ? styles.activeType : ''}`}
                                        onClick={() => handleUserTypeChange(1)}
                                    >
                                        Corretor(a) / Imobiliária
                                    </button>
                                </div>
                            </>
                        )}
                        <div className={styles.formGroup}>
                            {viewMode === 'signup' && (
                                <>
                                    <div className={styles.inputWrapper}>
                                        <input 
                                            ref={nameRef}
                                            type="text" 
                                            name="name"
                                            placeholder="Digite seu nome completo" 
                                            className={styles.input} 
                                            required
                                            value={formData.name}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, phoneRef)}
                                        />
                                        <User className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                    <div className={styles.inputWrapper}>
                                        <input 
                                            ref={phoneRef}
                                            type="tel" 
                                            name="phone"
                                            placeholder="Digite seu telefone" 
                                            className={styles.input} 
                                            value={formData.phone}
                                            onChange={handleChange}
                                            onKeyDown={(e) => handleKeyDown(e, emailRef)}
                                        />
                                        <Phone className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    </div>
                                </>
                            )}
                            <div className={styles.inputWrapper}>
                                <input 
                                    ref={emailRef}
                                    type="email" 
                                    name="email"
                                    placeholder={viewMode === 'login' ? "E-mail cadastrado" : "Digite seu e-mail"} 
                                    className={styles.input} 
                                    required
                                    value={formData.email}
                                    onChange={handleChange}
                                    onKeyDown={(e) => handleKeyDown(e, passwordRef)}
                                />
                                <Mail className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                            </div>
                            <div className={styles.inputWrapper}>
                                <input 
                                    ref={passwordRef}
                                    type={showPassword ? "text" : "password"} 
                                    name="password"
                                    placeholder={viewMode === 'login' ? "Senha cadastrada" : "Crie uma senha"} 
                                    className={styles.input} 
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    onKeyDown={(e) => viewMode === 'signup' ? handleKeyDown(e, confirmPasswordRef) : undefined}
                                />
                                <Lock className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                <button 
                                    type="button" 
                                    className={styles.eyeButton} 
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {viewMode === 'signup' && (
                                <div className={styles.inputWrapper}>
                                    <input 
                                        ref={confirmPasswordRef}
                                        type={showConfirmPassword ? "text" : "password"} 
                                        name="confirmPassword"
                                        placeholder="Confirme sua senha" 
                                        className={styles.input} 
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                    <Lock className={styles.fieldIcon} size={20} strokeWidth={2.5} />
                                    <button 
                                        type="button" 
                                        className={styles.eyeButton} 
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        tabIndex={-1}
                                    >
                                        {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            )}
                        </div>

                        <button className={styles.loginButton} type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (viewMode === 'login' ? 'Entrar' : 'Criar sua conta')}
                        </button>
                    </form>

                    {viewMode === 'login' && (
                        <button className={styles.forgotPassword} type="button">
                            Esqueci a senha
                        </button>
                    )}

                    <div className={styles.registerContainer}>
                        <span>{viewMode === 'login' ? 'Não possui conta? ' : 'Já possui conta? '}</span>
                        <button className={styles.registerLink} onClick={toggleMode} type="button">
                            {viewMode === 'login' ? 'Cadastre-se aqui' : 'Faça o login aqui'}
                        </button>
                    </div>

                    <p className={styles.footerNote}>
                        Ao continuar você aceita os <a href="#">Termos de uso</a> e <a href="#">Política de privacidade</a>.
                    </p>
                </div>

                <div className={styles.modalFooter}>
                    <div className={styles.partnerLogos}>
                        <span className={styles.groupText}>soluções</span>
                        <Image src="/logo_hv5_v3.png" alt="HV5" width={40} height={20} className={styles.miniLogo} />
                    </div>
                </div>
            </div>
        </div>
    )
}
