'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, CornerDownRight, Send, CheckCircle2, Clock } from 'lucide-react'
import styles from './DashboardQuestions.module.css'

interface Question {
    id: number
    pergunta: string
    resposta: string | null
    status: string
    created_at: string
}

interface DashboardQuestionsProps {
    propertyId: number | string
    onAnswer?: () => void
}

export default function DashboardQuestions({ propertyId, onAnswer }: DashboardQuestionsProps) {
    const [questions, setQuestions] = useState<Question[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [answeringId, setAnsweringId] = useState<number | null>(null)
    const [answerText, setAnswerText] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        fetchQuestions()
    }, [propertyId])

    const fetchQuestions = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`/api/property/${propertyId}/questions?all=true`)
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

    const handleAnswer = async (id: number) => {
        if (!answerText.trim()) return
        setIsSubmitting(true)
        
        try {
            const res = await fetch(`/api/property/${propertyId}/questions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ resposta: answerText })
            })

            if (res.ok) {
                const updated = await res.json()
                setQuestions(prev => prev.map(q => q.id === id ? updated : q))
                setAnsweringId(null)
                setAnswerText('')
                if (onAnswer) onAnswer()
            } else {
                const errorData = await res.json()
                alert(`Erro ao enviar resposta: ${errorData.error || 'Tente novamente.'}`)
            }
        } catch (error: any) {
            console.error('❌ [DashboardQuestions] Answer Error:', error)
            alert(`Erro de conexão: ${error.message || 'Verifique o console.'}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (isLoading) return <div className={styles.loading}>Carregando perguntas...</div>

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h3 className={styles.title}>Gestão de Perguntas</h3>
                <p className={styles.subtitle}>Responda as dúvidas dos leads para que elas apareçam publicamente no site.</p>
            </div>

            {questions.length === 0 ? (
                <div className={styles.empty}>
                    <MessageSquare size={48} strokeWidth={1} />
                    <p>Nenhuma pergunta registrada para este imóvel ainda.</p>
                </div>
            ) : (
                <div className={styles.list}>
                    {questions.map((q) => (
                        <div key={q.id} className={`${styles.item} ${!q.resposta ? styles.pending : ''}`}>
                            <div className={styles.questionRow}>
                                <div className={styles.qInfo}>
                                    <span className={styles.qDate}>{new Date(q.created_at).toLocaleDateString('pt-BR')}</span>
                                    {q.resposta ? (
                                        <span className={styles.statusDone}><CheckCircle2 size={12} /> Respondida</span>
                                    ) : (
                                        <span className={styles.statusPending}><Clock size={12} /> Pendente</span>
                                    )}
                                </div>
                                <p className={styles.qText}>{q.pergunta}</p>
                            </div>

                            {q.resposta ? (
                                <div className={styles.answerRow}>
                                    <CornerDownRight size={16} className={styles.aIcon} />
                                    <div className={styles.aBox}>
                                        <p className={styles.aText}>{q.resposta}</p>
                                        <button 
                                            className={styles.editBtn}
                                            onClick={() => {
                                                setAnsweringId(q.id)
                                                setAnswerText(q.resposta!)
                                            }}
                                        >
                                            Editar Resposta
                                        </button>
                                    </div>
                                </div>
                            ) : answeringId === q.id ? (
                                <div className={styles.answerForm}>
                                    <textarea 
                                        autoFocus
                                        placeholder="Digite sua resposta..." 
                                        className={styles.textarea}
                                        value={answerText}
                                        onChange={(e) => setAnswerText(e.target.value)}
                                    />
                                    <div className={styles.formActions}>
                                        <button className={styles.cancelBtn} onClick={() => setAnsweringId(null)}>Cancelar</button>
                                        <button 
                                            className={styles.submitBtn} 
                                            onClick={() => handleAnswer(q.id)}
                                            disabled={isSubmitting || !answerText.trim()}
                                        >
                                            {isSubmitting ? 'Enviando...' : 'Enviar Resposta'} <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button className={styles.replyBtn} onClick={() => setAnsweringId(q.id)}>
                                    Responder esta pergunta
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
