'use client'
import { MonthlyObjective, MONTH_FULL } from '@/types'
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

      {objectives.length > 0 && (() => {
        // Group objectives by month/year
        const groups: Record<string, MonthlyObjective[]> = {}
        objectives.forEach(obj => {
          const key = `${obj.year}-${String(obj.month).padStart(2,'0')}`
          if (!groups[key]) groups[key] = []
          groups[key].push(obj)
        })
        const sorted = Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]))
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {sorted.map(([key, objs]) => {
              const [year, month] = key.split('-').map(Number)
              return (
                <div key={key} className="card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Objetivos do Mês</h2>
                    <span style={{ fontSize: '11px', color: 'var(--yellow)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                      {MONTH_FULL[month - 1]} {year}
                    </span>
                  </div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {objs.map(obj => (
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
              )
            })}
          </div>
        )
      })()}
    </div>
  )
}
