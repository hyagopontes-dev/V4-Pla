'use client'
import { useState } from 'react'
import { Deliverable, MONTH_NAMES } from '@/types'
import { ExternalLink, Package } from 'lucide-react'

interface Props { deliverables: Deliverable[]; contractPieces: number }

export default function DeliverableView({ deliverables, contractPieces }: Props) {
  const sorted = [...deliverables].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [curIdx, setCurIdx] = useState(0)
  const current = sorted[curIdx]

  if (!sorted.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma entrega registrada ainda.</p>
      </div>
    )
  }

  const ent = current.delivered
  const pct = Math.min(Math.round((ent / contractPieces) * 100), 100)
  const over = ent > contractPieces
  const accentColor = over ? '#3B82F6' : ent === 0 ? 'var(--text-secondary)' : '#5A9E27'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={15} style={{ color: 'var(--yellow)' }} />
          <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Entregas Orgânicas</h2>
        </div>
        <span className="badge-neutral">Meta: {contractPieces} peças/mês</span>
      </div>

      {/* Month tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {sorted.map((d, i) => {
          const active = i === curIdx
          const isOver = d.delivered > contractPieces
          return (
            <button key={d.id} onClick={() => setCurIdx(i)} style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
              border: `1px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
              background: active ? 'var(--yellow-bg)' : 'transparent',
              color: active ? 'var(--yellow)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: active ? 600 : 400,
              letterSpacing: '0.05em', transition: 'all 0.15s'
            }}>
              {MONTH_NAMES[d.month - 1]} {d.year}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '20px' }}>
        {/* Progress */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {ent} de {contractPieces} peças entregues
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor }}>{pct}%</span>
          </div>
          <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: '2px', transition: 'width 0.5s' }} />
          </div>
          {over && (
            <p style={{ fontSize: '11px', color: '#3B82F6', marginTop: '4px' }}>
              +{ent - contractPieces} peças além do contrato
            </p>
          )}
        </div>

        {/* Items */}
        {current.items && current.items.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {current.items.map((item: any, i: number) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', background: 'var(--bg-hover)',
                border: '1px solid var(--border)', borderRadius: '2px', gap: '12px'
              }}>
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>{item.name ?? item}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener"
                    style={{ fontSize: '11px', color: 'var(--yellow)', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none', flexShrink: 0 }}>
                    <ExternalLink size={11} /> Ver
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
