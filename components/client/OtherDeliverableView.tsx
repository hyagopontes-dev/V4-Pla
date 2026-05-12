'use client'
import { useState } from 'react'
import { OtherDeliverable, MONTH_FULL, MONTH_NAMES } from '@/types'
import { ExternalLink, Package } from 'lucide-react'

interface Props { items: OtherDeliverable[] }

function uniqueSortedMonths(items: OtherDeliverable[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(m => { seen[`${m.year}-${m.month}`] = true })
  return Object.keys(seen).sort().reverse()
}

const STATUS = {
  pendente:  { label: 'Pendente',  cls: 'badge-neutral' },
  entregue:  { label: 'Entregue',  cls: 'badge-warning' },
  concluido: { label: 'Concluído', cls: 'badge-success' },
}

export default function OtherDeliverableView({ items }: Props) {
  const months = uniqueSortedMonths(items)
  const [cur, setCur] = useState(months[0] ?? '')
  if (!items.length) return null

  const filtered = items.filter(i => `${i.year}-${i.month}` === cur)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Package size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Outras Entregas</h2>
      </div>

      {/* Month selector */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {months.map(mk => {
          const [y, m] = mk.split('-').map(Number)
          const active = cur === mk
          return (
            <button key={mk} onClick={() => setCur(mk)}
              style={{
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

      <div style={{ padding: '16px' }}>
        {filtered.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', textAlign: 'center', padding: '24px 0' }}>
            Nenhuma entrega neste mês.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filtered.map(item => {
              const s = STATUS[item.status as keyof typeof STATUS] ?? STATUS.pendente
              return (
                <div key={item.id} style={{
                  display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                  padding: '12px 14px', background: 'var(--bg-hover)',
                  border: '1px solid var(--border)', borderRadius: '2px', gap: '12px'
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, marginBottom: '2px' }}>{item.description}</p>
                    {item.doc_url && (
                      <a href={item.doc_url} target="_blank" rel="noopener"
                        style={{ fontSize: '11px', color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                        <ExternalLink size={11} /> Ver documento
                      </a>
                    )}
                  </div>
                  <span className={s.cls}>{s.label}</span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
