'use client'

import React, { useState } from 'react'
import { calculateCompleteness, CompletenessItem } from '@/lib/completeness-score'
import styles from './CompletenessScore.module.css'
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react'

interface CompletenessScoreProps {
  imovel: any
}

export default function CompletenessScore({ imovel }: CompletenessScoreProps) {
  const [expanded, setExpanded] = useState(false)
  const result = calculateCompleteness(imovel)

  const getColor = (pct: number) => {
    if (pct >= 80) return '#22c55e'
    if (pct >= 50) return '#f59e0b'
    return '#ef4444'
  }

  const color = getColor(result.percentage)

  return (
    <div className={styles.container}>
      <div className={styles.header} onClick={() => setExpanded(!expanded)}>
        <div className={styles.scoreRow}>
          <div className={styles.barWrapper}>
            <div
              className={styles.bar}
              style={{ width: `${result.percentage}%`, backgroundColor: color }}
            />
          </div>
          <span className={styles.percentage} style={{ color }}>
            {result.percentage}%
          </span>
        </div>
        <div className={styles.subtitle}>
          {result.pendingItems.length === 0
            ? 'Anúncio completo!'
            : `${result.pendingItems.length} ${result.pendingItems.length === 1 ? 'item pendente' : 'itens pendentes'}`
          }
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div className={styles.checklist}>
          {result.pendingItems.length > 0 && (
            <div className={styles.section}>
              <h4 className={styles.sectionTitle}>Pendente</h4>
              {result.pendingItems.map((item) => (
                <ItemRow key={item.label} item={item} />
              ))}
            </div>
          )}
          <div className={styles.section}>
            <h4 className={styles.sectionTitle}>Preenchido</h4>
            {result.items.filter(i => i.filled).map((item) => (
              <ItemRow key={item.label} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ItemRow({ item }: { item: CompletenessItem }) {
  return (
    <div className={`${styles.item} ${item.filled ? styles.itemFilled : styles.itemPending}`}>
      {item.filled
        ? <CheckCircle2 size={16} className={styles.iconFilled} />
        : <Circle size={16} className={styles.iconPending} />
      }
      <span>{item.label}</span>
      <span className={styles.badge}>
        {item.category === 'essential' ? 'Essencial' : item.category === 'recommended' ? 'Recomendado' : 'Opcional'}
      </span>
    </div>
  )
}