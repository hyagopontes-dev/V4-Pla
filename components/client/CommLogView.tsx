'use client'
import { CommLog } from '@/types'
import { MessageSquare } from 'lucide-react'

interface Props { logs: CommLog[] }

export default function CommLogView({ logs }: Props) {
  if (!logs.length) return null
  const sorted = [...logs].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <MessageSquare size={15} style={{ color: 'var(--yellow)' }} />
        <h2 style={{ fontWeight: 500, color: 'var(--text)', fontSize: '14px' }}>Comunicados</h2>
      </div>
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {sorted.map(log => (
          <div key={log.id} style={{
            padding: '12px 14px', background: 'var(--bg-hover)',
            border: '1px solid var(--border)', borderRadius: '2px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span className="badge-warning">{log.month}/{log.year}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {log.month}/{log.year}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{log.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
