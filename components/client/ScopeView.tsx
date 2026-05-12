'use client'
import { MonthlyObjective } from '@/types'
import { FileText } from 'lucide-react'

interface Props { scope?: string | null; objectives: MonthlyObjective[] }

export default function ScopeView({ scope, objectives }: Props) {
  if (!scope && !objectives.length) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {scope && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={15} style={{ color: 'var(--yellow)' }} />
            <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Escopo do Contrato</h2>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{scope}</p>
          </div>
        </div>
      )}

      {objectives.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Objetivos do Mês</h2>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {objectives.map(obj => (
              <div key={obj.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '10px 14px', background: 'var(--bg-hover)',
                border: '1px solid var(--border)', borderRadius: '2px'
              }}>
                <div style={{ width: '6px', height: '6px', background: 'var(--yellow)', borderRadius: '1px', marginTop: '5px', flexShrink: 0 }} />
                <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.5 }}>{obj.content}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
