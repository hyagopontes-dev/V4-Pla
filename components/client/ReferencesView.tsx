'use client'
import { ClientReference } from '@/types'
import { ExternalLink, BookOpen } from 'lucide-react'

interface Props { references: ClientReference[] }

export default function ReferencesView({ references }: Props) {
  if (!references.length) return null

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <BookOpen size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Referências</h2>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {references.map(ref => (
          <div key={ref.id} style={{
            padding: '12px 14px', background: 'var(--bg-hover)',
            border: '1px solid var(--border)', borderRadius: '2px'
          }}>
            <p style={{ fontSize: '13px', color: 'var(--text)', fontWeight: 500, marginBottom: ref.url ? '4px' : 0 }}>{ref.name}</p>
            {ref.notes && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: ref.url ? '6px' : 0, lineHeight: 1.5 }}>{ref.notes}</p>}
            {ref.url && (
              <a href={ref.url} target="_blank" rel="noopener"
                style={{ fontSize: '11px', color: 'var(--yellow)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                <ExternalLink size={11} /> Ver referência
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
