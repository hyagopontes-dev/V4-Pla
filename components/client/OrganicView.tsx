'use client'
import { OrganicAnalysis } from '@/types'
import { BarChart2, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { MONTH_NAMES } from '@/types'

interface Props { analyses: OrganicAnalysis[] }

export default function OrganicView({ analyses }: Props) {
  const sorted = [...analyses].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [idx, setIdx] = useState(0)
  if (!sorted.length) return null
  const cur = sorted[idx]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Análise Orgânica</h2>
      </div>

      {sorted.length > 1 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {sorted.map((a, i) => (
            <button key={a.id} onClick={() => setIdx(i)} style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
              border: `1px solid ${i === idx ? 'var(--yellow)' : 'var(--border)'}`,
              background: i === idx ? 'var(--yellow-bg)' : 'transparent',
              color: i === idx ? 'var(--yellow)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: i === idx ? 600 : 400, transition: 'all 0.15s'
            }}>
              {MONTH_NAMES[a.month - 1]} {a.year}
            </button>
          ))}
        </div>
      )}

      <div style={{ padding: '16px' }}>
        {cur.analysis && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: cur.video_url ? '12px' : 0, whiteSpace: 'pre-wrap' }}>
            {cur.analysis}
          </p>
        )}
        {cur.video_url && (
          <a href={cur.video_url} target="_blank" rel="noopener"
            style={{ fontSize: '12px', color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}>
            <ExternalLink size={12} /> Ver análise completa
          </a>
        )}
        {!cur.analysis && !cur.video_url && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>
            Nenhuma análise registrada para este mês.
          </p>
        )}
      </div>
    </div>
  )
}
