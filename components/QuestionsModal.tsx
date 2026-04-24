'use client'

import React from 'react'
import { X, MessageSquare, CornerDownRight } from 'lucide-react'
import styles from './QuestionsModal.module.css'

interface Question {
    id: number
    pergunta: string
    resposta: string | null
    created_at: string
}

interface QuestionsModalProps {
    isOpen: boolean
    onClose: () => void
    questions: Question[]
    propertyTitle: string
}

export default function QuestionsModal({ isOpen, onClose, questions, propertyTitle }: QuestionsModalProps) {
    if (!isOpen) return null

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Perguntas</h2>
                    <button className={styles.closeBtn} onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>
                
                <div className={styles.content}>
                    {questions.length === 0 ? (
                        <div className={styles.empty}>
                            <p>Nenhuma pergunta para este imóvel ainda.</p>
                        </div>
                    ) : (
                        <div className={styles.list}>
                            {questions.map((q) => (
                                <div key={q.id} className={styles.item}>
                                    <div className={styles.questionRow}>
                                        <p className={styles.qText}>{q.pergunta}</p>
                                    </div>
                                    {q.resposta && (
                                        <div className={styles.answerRow}>
                                            <CornerDownRight size={16} className={styles.aIcon} />
                                            <div className={styles.aBox}>
                                                <p className={styles.aText}>{q.resposta}</p>
                                                <span className={styles.aDate}>
                                                    {new Date(q.created_at).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
