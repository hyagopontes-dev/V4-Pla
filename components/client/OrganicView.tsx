'use client'
import { OrganicAnalysis } from '@/types'
import { BarChart2 } from 'lucide-react'

interface Props { analyses: OrganicAnalysis[] }

export default function OrganicView({ analyses }: Props) {
  if (!analyses.length) return null
  const sorted = [...analyses].sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year
    return b.month - a.month
  })
  const latest = sorted[0]

  const metrics = [
    { label: 'Alcance', value: latest.reach },
    { label: 'Impressões', value: latest.impressions },
    { label: 'Seguidores', value: latest.followers },
    { label: 'Engajamento', value: latest.engagement_rate ? `${latest.engagement_rate}%` : null },
    { label: 'Salvamentos', value: latest.saves },
    { label: 'Compartilhamentos', value: latest.shares },
  ].filter(m => m.value !== null && m.value !== undefined)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BarChart2 size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Análise Orgânica</h2>
      </div>
      <div style={{ padding: '16px' }}>
        {latest.notes && (
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>{latest.notes}</p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {metrics.map(({ label, value }) => (
            <div key={label} style={{
              padding: '12px', background: 'var(--bg-hover)',
              border: '1px solid var(--border)', borderRadius: '2px', textAlign: 'center'
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</div>
              <div style={{ fontSize: '20px', fontFamily: "'Bebas Neue', sans-serif", letterSpacing: '0.04em', color: 'var(--yellow)' }}>
                {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
