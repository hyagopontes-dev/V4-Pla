'use client'
import { TrafficMetric, MONTH_NAMES } from '@/types'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Props { metrics: TrafficMetric[] }

export default function TrafficView({ metrics }: Props) {
  const sorted = [...metrics].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [idx, setIdx] = useState(0)
  const cur = sorted[idx]

  if (!metrics.length) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma métrica de tráfego registrada ainda.</p>
      </div>
    )
  }

  const fields = [
    { label: 'Investimento', value: cur.investment ? `R$ ${cur.investment.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null },
    { label: 'Alcance', value: cur.reach?.toLocaleString('pt-BR') },
    { label: 'Impressões', value: cur.impressions?.toLocaleString('pt-BR') },
    { label: 'Cliques', value: cur.clicks?.toLocaleString('pt-BR') },
    { label: 'CTR', value: cur.ctr ? `${cur.ctr}%` : null },
    { label: 'CPM', value: cur.cpm ? `R$ ${cur.cpm}` : null },
    { label: 'CPC', value: cur.cpc ? `R$ ${cur.cpc}` : null },
    { label: 'Leads', value: cur.leads?.toLocaleString('pt-BR') },
    { label: 'CPL', value: cur.cpl ? `R$ ${cur.cpl}` : null },
    { label: 'Conversões', value: cur.conversions?.toLocaleString('pt-BR') },
    { label: 'Receita', value: cur.revenue ? `R$ ${cur.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null },
    { label: 'ROAS', value: cur.roas ? `${cur.roas}x` : null },
  ].filter(f => f.value !== null && f.value !== undefined)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Tráfego Pago — Histórico</h2>
      </div>

      {/* Month selector */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {sorted.map((m, i) => {
          const active = i === idx
          return (
            <button key={m.id} onClick={() => setIdx(i)} style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
              border: `1px solid ${active ? 'var(--yellow)' : 'var(--border)'}`,
              background: active ? 'var(--yellow-bg)' : 'transparent',
              color: active ? 'var(--yellow)' : 'var(--text-secondary)',
              cursor: 'pointer', fontWeight: active ? 600 : 400,
              letterSpacing: '0.05em', transition: 'all 0.15s'
            }}>
              {MONTH_NAMES[m.month - 1]} {m.year}
            </button>
          )
        })}
      </div>

      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {fields.map(({ label, value }) => (
          <div key={label} style={{
            padding: '12px 14px', background: 'var(--bg-hover)',
            border: '1px solid var(--border)', borderRadius: '2px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</div>
            <div style={{ fontSize: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', color: 'var(--yellow)' }}>{value}</div>
          </div>
        ))}
      </div>

      {cur.notes && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ padding: '12px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px' }}>
            <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Observações</div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{cur.notes}</p>
          </div>
        </div>
      )}
    </div>
  )
}
