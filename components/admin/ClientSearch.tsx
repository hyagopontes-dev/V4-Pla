'use client'
import { useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Eye, Search, Plus, X, ChevronDown, Users } from 'lucide-react'

interface Client { id: string; name: string; slug: string; contract_pieces: number; active: boolean }
interface TeamMember { id: string; name: string; avatar_color: string; role?: string }
interface ClientTeamRow { client_id: string; team_member_id: string; team_members: TeamMember }
interface Props { clients: Client[]; team: TeamMember[]; clientTeam: ClientTeamRow[] }

function Avatar({ member, size = 24 }: { member: TeamMember; size?: number }) {
  return (
    <div title={member.name} style={{
      width: size, height: size, borderRadius: '50%', background: member.avatar_color,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.45, fontWeight: 700, color: '#0A0A0A',
      flexShrink: 0, border: '2px solid var(--bg-card)',
    }}>
      {member.name.charAt(0).toUpperCase()}
    </div>
  )
}

export default function ClientSearch({ clients, team, clientTeam }: Props) {
  const [query, setQuery] = useState('')
  const [filterMember, setFilterMember] = useState('')
  const [assigningClient, setAssigningClient] = useState<string | null>(null)
  const [localClientTeam, setLocalClientTeam] = useState<ClientTeamRow[]>(clientTeam)
  const supabase = createClient()

  // Build map: client_id -> team members
  const clientTeamMap = useMemo(() => {
    const map: Record<string, TeamMember[]> = {}
    localClientTeam.forEach(row => {
      if (!map[row.client_id]) map[row.client_id] = []
      if (row.team_members) map[row.client_id].push(row.team_members)
    })
    return map
  }, [localClientTeam])

  const filtered = useMemo(() => clients.filter(c => {
    const matchQuery = !query || c.name.toLowerCase().includes(query.toLowerCase()) || c.slug.toLowerCase().includes(query.toLowerCase())
    const matchMember = !filterMember || (clientTeamMap[c.id] ?? []).some(m => m.id === filterMember)
    return matchQuery && matchMember
  }), [clients, query, filterMember, clientTeamMap])

  async function toggleAssign(clientId: string, memberId: string) {
    const exists = localClientTeam.find(r => r.client_id === clientId && r.team_member_id === memberId)
    if (exists) {
      await supabase.from('client_team').delete().eq('client_id', clientId).eq('team_member_id', memberId)
      setLocalClientTeam(prev => prev.filter(r => !(r.client_id === clientId && r.team_member_id === memberId)))
    } else {
      const member = team.find(m => m.id === memberId)!
      await supabase.from('client_team').insert({ client_id: clientId, team_member_id: memberId })
      setLocalClientTeam(prev => [...prev, { client_id: clientId, team_member_id: memberId, team_members: member } as ClientTeamRow])
    }
  }

  return (
    <>
      {/* Filters */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', pointerEvents: 'none' }} />
          <input type="text" placeholder="Buscar cliente..." value={query} onChange={e => setQuery(e.target.value)}
            className="input" style={{ paddingLeft: '32px', fontSize: '12px' }} />
        </div>
        <select className="input" style={{ fontSize: '12px', width: 'auto', minWidth: '160px' }}
          value={filterMember} onChange={e => setFilterMember(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {team.map(m => <option key={m.id} value={m.id}>{m.name}{m.role ? ` — ${m.role}` : ''}</option>)}
        </select>
        {(query || filterMember) && (
          <button onClick={() => { setQuery(''); setFilterMember('') }} className="btn-ghost" style={{ padding: '8px 12px', fontSize: '11px' }}>
            <X size={12} /> Limpar
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
            {query || filterMember ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </div>
          {!query && !filterMember && (
            <Link href="/admin/clients/new" className="btn-primary"><Plus size={13} /> Adicionar cliente</Link>
          )}
        </div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Cliente', 'Equipe', 'Peças/mês', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: h === '' ? 'right' : 'left', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((client, i) => {
              const members = clientTeamMap[client.id] ?? []
              const isAssigning = assigningClient === client.id
              return (
                <tr key={client.id} style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.1s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 500 }}>{client.name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                      {/* Avatars stacked */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {members.slice(0, 4).map((m, idx) => (
                          <div key={m.id} style={{ marginLeft: idx > 0 ? '-6px' : 0, zIndex: members.length - idx }}>
                            <Avatar member={m} size={26} />
                          </div>
                        ))}
                        {members.length > 4 && (
                          <div style={{ marginLeft: '-6px', width: 26, height: 26, borderRadius: '50%', background: 'var(--bg-hover)', border: '2px solid var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                            +{members.length - 4}
                          </div>
                        )}
                      </div>

                      {/* Assign button */}
                      <div style={{ position: 'relative' }}>
                        <button onClick={() => setAssigningClient(isAssigning ? null : client.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--text-secondary)', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: '2px', padding: '3px 8px', cursor: 'pointer' }}>
                          <Users size={10} /> <ChevronDown size={9} />
                        </button>

                        {isAssigning && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: '4px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '4px', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', zIndex: 50, minWidth: '180px', maxHeight: '240px', overflowY: 'auto' }}>
                            {team.length === 0 ? (
                              <div style={{ padding: '12px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                                Cadastre membros em <Link href="/admin/team" style={{ color: 'var(--yellow)' }}>Equipe</Link>
                              </div>
                            ) : team.map(m => {
                              const assigned = (clientTeamMap[client.id] ?? []).some(cm => cm.id === m.id)
                              return (
                                <button key={m.id} onClick={() => toggleAssign(client.id, m.id)}
                                  style={{
                                    width: '100%', textAlign: 'left', padding: '8px 12px',
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    background: assigned ? 'var(--yellow-bg)' : 'transparent',
                                    border: 'none', cursor: 'pointer', transition: 'background 0.1s',
                                    borderBottom: '1px solid var(--border)',
                                  }}>
                                  <Avatar member={m} size={22} />
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '12px', color: 'var(--text)', fontWeight: assigned ? 600 : 400 }}>{m.name}</div>
                                    {m.role && <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{m.role}</div>}
                                  </div>
                                  {assigned && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--yellow)', flexShrink: 0 }} />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
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
              )
            })}
          </tbody>
        </table>
      )}

      {/* Close dropdown on outside click */}
      {assigningClient && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setAssigningClient(null)} />
      )}
    </>
  )
}
