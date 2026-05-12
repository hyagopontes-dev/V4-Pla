'use client'
import { useState } from 'react'
import { Deliverable, OtherDeliverable, MONTH_NAMES } from '@/types'
import { ExternalLink, Package } from 'lucide-react'

interface Props {
  deliverables: Deliverable[]
  contractPieces: number
  otherDeliverables: OtherDeliverable[]
}

const STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  pendente:  { label: 'Pendente',  cls: 'badge-neutral' },
  entregue:  { label: 'Entregue',  cls: 'badge-warning' },
  concluido: { label: 'Concluído', cls: 'badge-success' },
}

function getMonthKey(month: number, year: number) {
  return `${year}-${String(month).padStart(2, '0')}`
}

export default function DeliverableView({ deliverables, contractPieces, otherDeliverables }: Props) {
  // Build unified month list from both sources
  const monthSet = new Set<string>()
  deliverables.forEach(d => monthSet.add(getMonthKey(d.month, d.year)))
  otherDeliverables.forEach(d => monthSet.add(getMonthKey(d.month, d.year)))

  const months = Array.from(monthSet).sort().reverse()
  const [selected, setSelected] = useState(months[0] ?? '')

  if (!months.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma entrega registrada ainda.</p>
      </div>
    )
  }

  const [selYear, selMonth] = selected.split('-').map(Number)

  const organic = deliverables.find(d => d.month === selMonth && d.year === selYear)
  const others = otherDeliverables.filter(d => d.month === selMonth && d.year === selYear)

  const ent = organic?.delivered ?? 0
  const pct = Math.min(Math.round((ent / contractPieces) * 100), 100)
  const over = ent > contractPieces
  const accentColor = over ? '#3B82F6' : ent === 0 ? 'var(--text-secondary)' : '#5A9E27'

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Package size={15} style={{ color: 'var(--yellow)' }} />
          <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Entregas</h2>
        </div>
        <span className="badge-neutral">Meta: {contractPieces} peças/mês</span>
      </div>

      {/* Month tabs */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {months.map(mk => {
          const [y, m] = mk.split('-').map(Number)
          const active = mk === selected
          return (
            <button key={mk} onClick={() => setSelected(mk)} style={{
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

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Organic deliverables */}
        {organic ? (
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600, marginBottom: '10px' }}>
              Entregas Orgânicas
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {ent} de {contractPieces} peças entregues
              </span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: accentColor }}>{pct}%</span>
            </div>
            <div style={{ height: '6px', background: 'var(--bg-hover)', borderRadius: '2px', overflow: 'hidden', marginBottom: '6px' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: '2px', transition: 'width 0.5s' }} />
            </div>
            {over && <p style={{ fontSize: '11px', color: '#3B82F6' }}>+{ent - contractPieces} peças além do contrato</p>}
            {organic.notes && (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', lineHeight: 1.6 }}>{organic.notes}</p>
            )}
            {organic.doc_url && (
              <a href={organic.doc_url} target="_blank" rel="noopener"
                style={{ fontSize: '12px', color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none', marginTop: '8px' }}>
                <ExternalLink size={12} /> Ver documento
              </a>
            )}
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600, marginBottom: '8px' }}>
              Entregas Orgânicas
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Nenhuma entrega orgânica registrada neste mês.</p>
          </div>
        )}

        {/* Separator */}
        {others.length > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600, marginBottom: '10px' }}>
              Outras Entregas
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {others.map(item => {
                const s = STATUS_STYLE[item.status] ?? STATUS_STYLE.pendente
                return (
                  <div key={item.id} style={{
                    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                    padding: '10px 14px', background: 'var(--bg-hover)',
                    border: '1px solid var(--border)', borderRadius: '2px', gap: '12px'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500 }}>{item.description}</p>
                      {item.doc_url && (
                        <a href={item.doc_url} target="_blank" rel="noopener"
                          style={{ fontSize: '11px', color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', marginTop: '4px' }}>
                          <ExternalLink size={11} /> Ver documento
                        </a>
                      )}
                    </div>
                    <span className={s.cls}>{s.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
