'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Search, Plus, Users } from 'lucide-react'

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
      {/* Search */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #2A2A2A' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', background: '#1A1A1A', border: '1px solid #2A2A2A',
              borderRadius: '2px', padding: '9px 12px 9px 36px',
              fontSize: '12px', color: '#FAFAFA', fontFamily: "'DM Sans', sans-serif",
              outline: 'none'
            }}
          />
        </div>
        {query && (
          <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          {query ? (
            <>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '8px' }}>Nenhum cliente encontrado para "{query}"</div>
              <button onClick={() => setQuery('')} style={{ fontSize: '11px', color: '#F5C518', background: 'none', border: 'none', cursor: 'pointer' }}>Limpar busca</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px' }}>Nenhum cliente cadastrado.</div>
              <Link href="/admin/clients/new" className="btn-primary"><Plus size={13} /> Adicionar cliente</Link>
            </>
          )}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2A2A2A' }}>
              {['Cliente', 'Slug', 'Peças/mês', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'right' : 'left', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => (
              <tr key={client.id} style={{ borderBottom: '1px solid #1A1A1A' }}
                onMouseEnter={e => (e.currentTarget.style.background = '#151515')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px 16px', color: '#FAFAFA', fontWeight: 500 }}>{client.name}</td>
                <td style={{ padding: '12px 16px', color: '#888', fontFamily: 'monospace', fontSize: '11px' }}>{client.slug}</td>
                <td style={{ padding: '12px 16px', color: '#888' }}>{client.contract_pieces}</td>
                <td style={{ padding: '12px 16px' }}>
                  {client.active
                    ? <span className="badge-success">Ativo</span>
                    : <span className="badge-neutral">Inativo</span>}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <Link href={`/dashboard?client=${client.slug}`} target="_blank"
                      className="btn-ghost" style={{ padding: '6px 12px' }}>
                      <Eye size={12} /> Ver
                    </Link>
                    <Link href={`/admin/clients/${client.id}`}
                      style={{ fontSize: '11px', color: '#F5C518', textDecoration: 'none', padding: '6px 12px', letterSpacing: '0.05em', fontWeight: 500 }}>
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
