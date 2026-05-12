'use client'
import { CommLog } from '@/types'
import { MessageSquare } from 'lucide-react'

interface Props { logs: CommLog[] }

export default function CommLogView({ logs }: Props) {
  if (!logs.length) return null
  const sorted = [...logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
              <span style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--yellow)', fontWeight: 600 }}>{log.type}</span>
              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {new Date(log.created_at).toLocaleDateString('pt-BR')}
              </span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.6 }}>{log.message}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
