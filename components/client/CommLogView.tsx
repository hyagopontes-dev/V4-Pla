'use client'
import { CommLog, MONTH_NAMES, MONTH_FULL } from '@/types'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'

interface Props { logs: CommLog[] }

export default function CommLogView({ logs }: Props) {
  const sorted = [...logs].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [activeId, setActiveId] = useState(sorted[0]?.id ?? '')
  if (!logs.length) return null

  const active = sorted.find(l => l.id === activeId)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Comunicação & Histórico</h2>
      </div>

      {/* Month tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {sorted.map(l => {
          const active = l.id === activeId
          return (
            <button key={l.id} onClick={() => setActiveId(l.id)} style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
              border: `1px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
              background: active ? 'var(--yellow-bg)' : 'transparent',
              color: active ? 'var(--yellow)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: active ? 600 : 400, transition: 'all 0.15s'
            }}>
              {MONTH_NAMES[l.month - 1]} {l.year}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '20px' }}>
        {active?.content ? (
          <>
            <div
              dangerouslySetInnerHTML={{ __html: active.content }}
              style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.8, fontFamily: "'DM Sans', sans-serif" }}
            />
            <style>{`
              .comm-content b, .comm-content strong { font-weight: 700; }
              .comm-content i, .comm-content em { font-style: italic; }
              .comm-content ul { padding-left: 20px; margin: 8px 0; }
              .comm-content li { margin: 4px 0; list-style: disc; }
              .comm-content a { color: var(--yellow); text-decoration: underline; }
              .comm-content p { margin: 6px 0; }
            `}</style>
          </>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '16px 0' }}>
            Nenhum conteúdo registrado neste mês.
          </p>
        )}
      </div>
    </div>
  )
}
