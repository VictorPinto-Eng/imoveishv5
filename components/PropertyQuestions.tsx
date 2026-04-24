'use client'

import React, { useState, useEffect } from 'react'
import { Send, ArrowRight } from 'lucide-react'
import QuestionsModal from './QuestionsModal'
import LoginModal from './LoginModal'
import styles from './PropertyQuestions.module.css'

interface Question {
    id: number
    pergunta: string
    resposta: string | null
    created_at: string
    user_id?: number | null
}

interface PropertyQuestionsProps {
    propertyId: number | string
    propertyTitle: string
}

export default function PropertyQuestions({ propertyId, propertyTitle }: PropertyQuestionsProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [newQuestion, setNewQuestion] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<number | null>(null)
    const [hasPendingQuestion, setHasPendingQuestion] = useState(false)

    // Quick questions chips
    const quickQuestions = [
        "Aceita financiamento?",
        "Qual o valor do condomínio?",
        "Posso agendar uma visita para hoje?",
        "Aceita proposta?",
        "O imóvel está desocupado?"
    ]

    useEffect(() => {
        const init = async () => {
            // Fetch User
            await checkAuth()
            fetchQuestions()
        }
        init()
    }, [propertyId])

    const checkAuth = async () => {
        try {
            const authRes = await fetch('/api/auth/me')
            const authData = await authRes.json()
            if (authData.authenticated) {
                setCurrentUserId(authData.user.id)
            } else {
                setCurrentUserId(null)
            }
        } catch (e) {
            console.log('User not logged in')
            setCurrentUserId(null)
        }
    }

    useEffect(() => {
        if (currentUserId && questions.length > 0) {
            const pending = questions.some(q => q.user_id === currentUserId && !q.resposta)
            setHasPendingQuestion(pending)
        }
    }, [questions, currentUserId])

    const fetchQuestions = async () => {
        try {
            const res = await fetch(`/api/property/${propertyId}/questions`)
            if (res.ok) {
                const data = await res.json()
                setQuestions(data)
            }
            setIsLoading(false)
        } catch (error) {
            console.error('Error fetching questions:', error)
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e?: React.FormEvent, textOverride?: string) => {
        if (e) e.preventDefault()
        
        if (!currentUserId) {
            setIsLoginModalOpen(true)
            return
        }

        const questionText = textOverride || newQuestion
        if (!questionText.trim()) return

        setIsSubmitting(true)
        
        try {
            // Get current user if logged in
            let userId = null
            try {
                const authRes = await fetch('/api/auth/me')
                const authData = await authRes.json()
                if (authData.authenticated) {
                    userId = authData.user.id
                }
            } catch (e) {
                console.log('User not logged in or auth check failed')
            }

            const res = await fetch(`/api/property/${propertyId}/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    pergunta: questionText,
                    user_id: userId
                })
            })

            if (res.ok) {
                const data = await res.json()
                setQuestions(prev => [data, ...prev])
                setNewQuestion('')
                alert('Sua pergunta foi enviada! Ela aparecerá publicamente assim que o anunciante responder.')
            } else {
                const errorData = await res.json()
                alert(`Erro ao enviar: ${errorData.error || 'Tente novamente.'}`)
            }
            setIsSubmitting(false)
        } catch (error) {
            console.error('Error submitting question:', error)
            setIsSubmitting(false)
            alert('Erro de conexão.')
        }
    }

    return (
        <div className={styles.container}>
            {/* Question Form */}
            <section className={styles.formSection}>
                <h3 className={styles.sectionTitle}>Pergunte ao anunciante</h3>
                
                {hasPendingQuestion && (
                    <div className={styles.pendingAlert}>
                        Você já possui uma pergunta aguardando resposta para este imóvel. 
                        Por favor, aguarde o anunciante responder antes de enviar uma nova dúvida.
                    </div>
                )}

                <div className={styles.questionChips}>
                    {quickQuestions.map((q, i) => (
                        <button 
                            key={i} 
                            className={styles.chip}
                            onClick={() => handleSubmit(undefined, q)}
                            disabled={isSubmitting || hasPendingQuestion}
                        >
                            {q}
                        </button>
                    ))}
                </div>
                
                <form onSubmit={handleSubmit} className={styles.inputGroup}>
                    <textarea 
                        placeholder={hasPendingQuestion ? "Aguardando resposta do anunciante..." : "Escreva sua pergunta..."}
                        className={styles.textarea}
                        value={newQuestion}
                        onChange={(e) => setNewQuestion(e.target.value)}
                        disabled={isSubmitting || hasPendingQuestion}
                    ></textarea>
                    <button 
                        type="submit" 
                        className={styles.sendBtn}
                        disabled={isSubmitting || !newQuestion.trim() || hasPendingQuestion}
                    >
                        {isSubmitting ? 'Enviando...' : (
                            <>
                                Perguntar <Send size={18} />
                            </>
                        )}
                    </button>
                </form>
                
                {questions.length > 0 && (
                    <button 
                        className={styles.viewAllBtn}
                        onClick={() => setIsModalOpen(true)}
                    >
                        Ver todas as perguntas <ArrowRight size={16} />
                    </button>
                )}
            </section>


            <QuestionsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                questions={questions}
                propertyTitle={propertyTitle}
            />

            <LoginModal 
                isOpen={isLoginModalOpen} 
                onClose={() => {
                    setIsLoginModalOpen(false)
                    checkAuth()
                }} 
            />
        </div>
    )
}
