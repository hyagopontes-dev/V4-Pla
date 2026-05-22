'use client'
import { useState } from 'react'
import { MonthlyObjective, MONTH_NAMES, MONTH_FULL } from '@/types'
import { FileText } from 'lucide-react'

interface Props { scope?: string | null; objectives: MonthlyObjective[] }

export default function ScopeView({ scope, objectives }: Props) {
  const sorted = [...objectives].sort((a, b) =>
    a.year !== b.year ? b.year - a.year : b.month - a.month
  )
  const [activeKey, setActiveKey] = useState(
    sorted.length ? `${sorted[0].year}-${String(sorted[0].month).padStart(2,'0')}` : ''
  )

  if (!scope && !objectives.length) return null

  // Group by month
  const groups: Record<string, MonthlyObjective[]> = {}
  sorted.forEach(obj => {
    const key = `${obj.year}-${String(obj.month).padStart(2,'0')}`
    if (!groups[key]) groups[key] = []
    groups[key].push(obj)
  })
  const monthKeys = Object.keys(groups).sort().reverse()
  const activeObjs = groups[activeKey] ?? []
  const [activeYear, activeMonth] = activeKey.split('-').map(Number)

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

          {/* Month tabs */}
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {monthKeys.map(key => {
              const [y, m] = key.split('-').map(Number)
              const active = key === activeKey
              return (
                <button key={key} onClick={() => setActiveKey(key)} style={{
                  fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
                  border: `1px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
                  background: active ? 'var(--yellow-bg)' : 'transparent',
                  color: active ? 'var(--yellow)' : 'var(--text-secondary)',
                  cursor: 'pointer', fontWeight: active ? 600 : 400,
                  letterSpacing: '0.05em', transition: 'all 0.15s'
                }}>
                  {MONTH_NAMES[m - 1]} {y}
                </button>
              )
            })}
          </div>

          {/* Objectives for selected month */}
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeObjs.length === 0 ? (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>
                Nenhum objetivo registrado.
              </p>
            ) : activeObjs.map(obj => (
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
