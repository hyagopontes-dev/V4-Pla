'use client'
import { TrafficMetric, MONTH_NAMES } from '@/types'
import { useState } from 'react'
import { TrendingUp } from 'lucide-react'

interface Props { metrics: TrafficMetric[] }

const fBRL = (v?: number) => v ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null
const fNum = (v?: number) => v ? v.toLocaleString('pt-BR') : null
const fPct = (v?: number) => v ? `${v}%` : null

export default function TrafficView({ metrics }: Props) {
  const sorted = [...metrics].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [idx, setIdx] = useState(0)
  const cur = sorted[idx]

  if (!metrics.length) return (
    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
      <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhuma métrica registrada ainda.</p>
    </div>
  )

  const sections = [
    {
      label: 'Meta Ads',
      show: !!(cur.meta_investimento || cur.meta_alcance || cur.meta_impressoes),
      fields: [
        { label: 'Investimento', value: fBRL(cur.meta_investimento) },
        { label: 'Alcance', value: fNum(cur.meta_alcance) },
        { label: 'Impressões', value: fNum(cur.meta_impressoes) },
        { label: 'Cliques', value: fNum(cur.meta_cliques) },
        { label: 'CTR', value: fPct(cur.meta_ctr) },
        { label: 'CPM', value: fBRL(cur.meta_cpm) },
        { label: 'Conversões', value: fNum(cur.meta_conversoes) },
        { label: 'Custo/resultado', value: fBRL(cur.meta_cpr) },
      ].filter(f => f.value),
    },
    {
      label: 'Resultados Reais',
      show: !!(cur.real_investimento || cur.real_alcance || cur.real_impressoes),
      fields: [
        { label: 'Investimento', value: fBRL(cur.real_investimento) },
        { label: 'Alcance', value: fNum(cur.real_alcance) },
        { label: 'Impressões', value: fNum(cur.real_impressoes) },
        { label: 'Cliques', value: fNum(cur.real_cliques) },
        { label: 'CTR', value: fPct(cur.real_ctr) },
        { label: 'CPM', value: fBRL(cur.real_cpm) },
        { label: 'Conversões', value: fNum(cur.real_conversoes) },
        { label: 'Custo/resultado', value: fBRL(cur.real_cpr) },
      ].filter(f => f.value),
    },
  ]

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <TrendingUp size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Tráfego Pago — Histórico</h2>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {sorted.map((m, i) => (
          <button key={m.id} onClick={() => setIdx(i)} style={{
            fontSize: '11px', padding: '4px 12px', borderRadius: '2px',
            border: `1px solid ${i === idx ? 'var(--yellow)' : 'var(--border)'}`,
            background: i === idx ? 'var(--yellow-bg)' : 'transparent',
            color: i === idx ? 'var(--yellow)' : 'var(--text-secondary)',
            cursor: 'pointer', fontWeight: i === idx ? 600 : 400, transition: 'all 0.15s'
          }}>
            {MONTH_NAMES[m.month - 1]} {m.year}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {sections.filter(s => s.show).map(section => (
          <div key={section.label}>
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600, marginBottom: '10px' }}>{section.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {section.fields.map(({ label, value }) => (
                <div key={label} style={{ padding: '10px 12px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px', textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</div>
                  <div style={{ fontSize: '18px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', color: 'var(--yellow)' }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
