'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TeamMember } from '@/types'
import { Plus, Trash2, Save, Users, Edit2 } from 'lucide-react'

interface Props { initialMembers: TeamMember[] }

const COLORS = ['#F5C518','#22c55e','#3b82f6','#f97316','#a855f7','#ec4899','#14b8a6','#ef4444']
const SALES_ROLES = ['SDR', 'BDR', 'Closer', 'Gerente Comercial']
const OPS_ROLES = ['Gestor de Tráfego', 'Social Media', 'Designer', 'Copywriter', 'Estrategista', 'Analista', 'SEO']
const MGMT_ROLES = ['Diretor', 'CEO', 'COO', 'Gerente']
const ALL_ROLES = [...SALES_ROLES, ...OPS_ROLES, ...MGMT_ROLES]
const ROLE_TYPE_MAP: Record<string, string> = {
  'SDR': 'sales', 'BDR': 'sales', 'Closer': 'sales', 'Gerente Comercial': 'sales',
  'Gestor de Tráfego': 'operational', 'Social Media': 'operational', 'Designer': 'operational',
  'Copywriter': 'operational', 'Estrategista': 'operational', 'Analista': 'operational', 'SEO': 'operational',
  'Diretor': 'management', 'CEO': 'management', 'COO': 'management', 'Gerente': 'management',
}

export default function TeamManager({ initialMembers }: Props) {
  const [members, setMembers] = useState<TeamMember[]>(initialMembers)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TeamMember | null>(null)
  const [form, setForm] = useState({ name: '', email: '', role: '', role_type: 'operational', avatar_color: '#F5C518' })
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  function openNew() {
    setEditing(null)
    setForm({ name: '', email: '', role: '', role_type: 'operational', avatar_color: '#F5C518' })
    setShowForm(true)
  }

  function openEdit(m: TeamMember) {
    setEditing(m)
    setForm({ name: m.name, email: m.email ?? '', role: m.role ?? '', role_type: m.role_type ?? 'operational', avatar_color: m.avatar_color })
    setShowForm(true)
  }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    if (editing) {
      const { data } = await supabase.from('team_members').update({ ...form, updated_at: new Date().toISOString() } as any).eq('id', editing.id).select().single()
      if (data) setMembers(prev => prev.map(m => m.id === editing.id ? data : m))
    } else {
      const { data } = await supabase.from('team_members').insert({ ...form, active: true }).select().single()
      if (data) setMembers(prev => [...prev, data])
    }
    setSaving(false)
    setShowForm(false)
  }

  async function toggleActive(m: TeamMember) {
    await supabase.from('team_members').update({ active: !m.active }).eq('id', m.id)
    setMembers(prev => prev.map(t => t.id === m.id ? { ...t, active: !m.active } : t))
  }

  async function remove(id: string) {
    if (!confirm('Remover membro?')) return
    await supabase.from('team_members').delete().eq('id', id)
    setMembers(prev => prev.filter(m => m.id !== id))
  }

  const active = members.filter(m => m.active)
  const inactive = members.filter(m => !m.active)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Gestão Interna</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>EQUIPE</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>{active.length} membros ativos</p>
        </div>
        <button onClick={openNew} className="btn-primary"><Plus size={13} /> Novo membro</button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: '24px', borderColor: 'var(--yellow)' }}>
          <div className="section-label" style={{ marginBottom: '16px' }}>{editing ? 'Editar membro' : 'Novo membro'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label className="label">Nome *</label>
              <input className="input" placeholder="Nome completo..." value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">E-mail</label>
              <input className="input" type="email" placeholder="email@..." value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Cargo / Função</label>
              <select className="input" value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                <option value="">Selecionar...</option>
                <optgroup label="Comercial (Vendas)">
                  {SALES_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Operacional">
                  {OPS_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
                <optgroup label="Gestão">
                  {MGMT_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="label">Cor do avatar</label>
              <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                {COLORS.map(color => (
                  <button key={color} onClick={() => setForm(f => ({ ...f, avatar_color: color }))}
                    style={{
                      width: '28px', height: '28px', borderRadius: '50%', background: color,
                      border: form.avatar_color === color ? '3px solid var(--text)' : '2px solid transparent',
                      cursor: 'pointer', flexShrink: 0
                    }} />
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={save} disabled={saving} className="btn-primary" style={{ padding: '8px 20px' }}>
              <Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: '8px 16px' }}>Cancelar</button>
          </div>
        </div>
      )}

      {/* Active members */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '16px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-label">Membros ativos — {active.length}</div>
        </div>
        {active.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <Users size={32} style={{ color: 'var(--text-secondary)', margin: '0 auto 8px' }} />
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum membro cadastrado.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--border)' }}>
            {active.map(m => (
              <div key={m.id} style={{ background: 'var(--bg-card)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '50%', background: m.avatar_color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: '#0A0A0A', letterSpacing: '0.05em'
                }}>
                  {m.name.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '2px' }}>{m.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {m.role && <p style={{ fontSize: '11px', color: 'var(--yellow)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{m.role}</p>}
                    {m.role_type && (
                      <span style={{ fontSize: '9px', padding: '1px 6px', borderRadius: '2px',
                        background: m.role_type === 'sales' ? 'rgba(34,197,94,0.1)' : m.role_type === 'management' ? 'rgba(99,102,241,0.1)' : 'rgba(245,197,24,0.08)',
                        color: m.role_type === 'sales' ? '#22c55e' : m.role_type === 'management' ? '#818cf8' : 'var(--yellow)',
                        fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                        {m.role_type === 'sales' ? 'Vendas' : m.role_type === 'management' ? 'Gestão' : 'Ops'}
                      </span>
                    )}
                  </div>
                  {m.email && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '1px' }}>{m.email}</p>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openEdit(m)} style={{ color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Edit2 size={13} />
                  </button>
                  <button onClick={() => toggleActive(m)} style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', cursor: 'pointer', padding: '3px 8px' }}>
                    Desativar
                  </button>
                  <button onClick={() => remove(m.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: 'hidden', opacity: 0.6 }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Inativos — {inactive.length}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)' }}>
            {inactive.map(m => (
              <div key={m.id} style={{ background: 'var(--bg-card)', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '14px', color: '#0A0A0A', fontWeight: 700 }}>
                  {m.name.charAt(0)}
                </div>
                <p style={{ flex: 1, fontSize: '13px', color: 'var(--text-secondary)' }}>{m.name}</p>
                <button onClick={() => toggleActive(m)} style={{ fontSize: '10px', color: 'var(--yellow)', background: 'none', border: '1px solid var(--yellow-border)', borderRadius: '2px', cursor: 'pointer', padding: '3px 8px' }}>
                  Reativar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
