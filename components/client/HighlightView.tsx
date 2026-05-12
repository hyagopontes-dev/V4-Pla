'use client'
import { Highlight } from '@/types'
import { Star } from 'lucide-react'

interface Props { highlights: Highlight[] }

export default function HighlightView({ highlights }: Props) {
  if (!highlights.length) return null

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Star size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Destaques</h2>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {highlights.map(h => (
          <div key={h.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '10px 14px', background: 'var(--bg-hover)',
            border: '1px solid var(--border)', borderRadius: '2px'
          }}>
            <div style={{ width: '6px', height: '6px', background: 'var(--yellow)', borderRadius: '1px', marginTop: '5px', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{h.text}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
