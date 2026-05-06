'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Search, Plus } from 'lucide-react'

interface Client { id: string; name: string; slug: string; contract_pieces: number; active: boolean }
interface Props { clients: Client[] }

export default function ClientSearch({ clients }: Props) {
  const [query, setQuery] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.slug.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Buscar cliente..." value={query}
            onChange={e => setQuery(e.target.value)}
            className="input" style={{ paddingLeft: '36px' }} />
        </div>
        {query && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '6px' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          {query ? (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>Nenhum cliente encontrado para "{query}"</div>
              <button onClick={() => setQuery('')} style={{ fontSize: '11px', color: 'var(--yellow)', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Nenhum cliente cadastrado.</div>
              <Link href="/admin/clients/new" className="btn-primary"><Plus size={13} /> Adicionar cliente</Link>
            </>
          )}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Cliente', 'Slug', 'Peças/mês', 'Status', ''].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: h === '' ? 'right' : 'left',
                  fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: 'var(--text-secondary)', fontWeight: 500
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => (
              <tr key={client.id}
                style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 500 }}>{client.name}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: '11px' }}>{client.slug}</td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{client.contract_pieces}</td>
                <td style={{ padding: '12px 16px' }}>
                  {client.active ? <span className="badge-success">Ativo</span> : <span className="badge-neutral">Inativo</span>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <Link href={`/dashboard?client=${client.slug}`} target="_blank" className="btn-ghost" style={{ padding: '5px 10px' }}>
                      <Eye size={12} /> Ver
                    </Link>
                    <Link href={`/admin/clients/${client.id}`}
                      style={{ fontSize: '11px', color: 'var(--yellow)', textDecoration: 'none', padding: '5px 10px', letterSpacing: '0.05em', fontWeight: 600 }}>
                      Gerenciar →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
