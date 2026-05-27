'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ClientCS, NPSResponse, CSActivity } from '@/types'
import { Save, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { MONTH_FULL } from '@/types'

interface Client { id: string; name: string }
interface TeamMember { id: string; name: string; avatar_color: string; role_type?: string }
interface Props {
  client: Client
  cs: ClientCS | null
  npsResponses: NPSResponse[]
  activities: CSActivity[]
  team: TeamMember[]
  onClose: () => void
  onSave: (cs: ClientCS) => void
  onAddActivity: (a: CSActivity) => void
  onAddNPS: (n: NPSResponse) => void
}

const STAGES = {
  estruturacao: { label: 'Estruturação', color: '#6366f1' },
  estavel:      { label: 'Estável',      color: '#22c55e' },
  escala:       { label: 'Escala',       color: '#F5C518' },
  alerta:       { label: 'Alerta',       color: '#ef4444' },
}

const fBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })
const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const now = new Date()

export default function ClientCSEditor({ client, cs: initialCS, npsResponses: initNPS, activities: initActivities, team, onClose, onSave, onAddActivity, onAddNPS }: Props) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'info'|'nps'|'activities'>('info')

  // CS form
  const [form, setForm] = useState({
    stage: initialCS?.stage ?? 'estruturacao',
    cs_owner: initialCS?.cs_owner ?? '',
    mrr: String(initialCS?.mrr ?? '0'),
    health_score: String(initialCS?.health_score ?? 50),
    nps_score: String(initialCS?.nps_score ?? ''),
    payment_on_time: initialCS?.payment_on_time ?? true,
    churn_risk: initialCS?.churn_risk ?? false,
    upsell_opportunity: initialCS?.upsell_opportunity ?? false,
    upsell_value: String(initialCS?.upsell_value ?? '0'),
    notes: initialCS?.notes ?? '',
    last_contact_at: initialCS?.last_contact_at ? initialCS.last_contact_at.slice(0,10) : '',
    last_meeting_at: initialCS?.last_meeting_at ? initialCS.last_meeting_at.slice(0,10) : '',
  })

  // NPS form
  const [npsForm, setNpsForm] = useState({ score: 8, comment: '', month: String(now.getMonth() + 1), year: String(now.getFullYear()) })
  const [npsLocal, setNpsLocal] = useState<NPSResponse[]>(initNPS)

  // Activity form
  const [actForm, setActForm] = useState({ type: 'checkin', cs_owner: '', notes: '', done_at: now.toISOString().slice(0,16) })
  const [activitiesLocal, setActivitiesLocal] = useState<CSActivity[]>(initActivities)
  const [showActForm, setShowActForm] = useState(false)

  const csOwners = team.filter(m => m.role_type === 'operational' || m.role_type === 'management')

  async function saveCS() {
    setSaving(true)
    const payload = {
      client_id: client.id,
      stage: form.stage,
      cs_owner: form.cs_owner,
      mrr: parseFloat(form.mrr) || 0,
      health_score: parseInt(form.health_score) || 50,
      nps_score: form.nps_score ? parseInt(form.nps_score) : null,
      payment_on_time: form.payment_on_time,
      churn_risk: form.churn_risk,
      upsell_opportunity: form.upsell_opportunity,
      upsell_value: parseFloat(form.upsell_value) || 0,
      notes: form.notes,
      last_contact_at: form.last_contact_at ? new Date(form.last_contact_at).toISOString() : null,
      last_meeting_at: form.last_meeting_at ? new Date(form.last_meeting_at).toISOString() : null,
      updated_at: new Date().toISOString(),
    }
    const { data } = await supabase.from('client_cs')
      .upsert(payload, { onConflict: 'client_id' })
      .select().single()
    if (data) onSave(data)
    setSaving(false)
  }

  async function addNPS() {
    const month = parseInt(npsForm.month)
    const year = parseInt(npsForm.year)
    // Check if already exists for this month/year
    const exists = npsLocal.find(n => n.month === month && n.year === year)
    if (exists) {
      // Update existing
      await supabase.from('nps_responses').update({ score: npsForm.score, comment: npsForm.comment, responded_at: new Date().toISOString() }).eq('id', exists.id)
      setNpsLocal(prev => prev.map(n => n.id === exists.id ? { ...n, score: npsForm.score, comment: npsForm.comment } : n))
    } else {
      const { data } = await supabase.from('nps_responses')
        .insert({ client_id: client.id, score: npsForm.score, comment: npsForm.comment, month, year, responded_at: new Date().toISOString() })
        .select().single()
      if (data) { setNpsLocal(prev => [data, ...prev]); onAddNPS(data) }
    }
  }

  async function deleteNPS(id: string) {
    await supabase.from('nps_responses').delete().eq('id', id)
    setNpsLocal(prev => prev.filter(n => n.id !== id))
  }

  async function addActivity() {
    const { data } = await supabase.from('cs_activities')
      .insert({ ...actForm, client_id: client.id, done: true, done_at: new Date(actForm.done_at).toISOString() })
      .select().single()
    if (data) { setActivitiesLocal(prev => [data, ...prev]); onAddActivity(data); setShowActForm(false) }
  }

  const npsColor = (score: number) => score >= 9 ? '#22c55e' : score >= 7 ? '#eab308' : '#ef4444'
  const npsLabel = (score: number) => score >= 9 ? 'Promotor' : score >= 7 ? 'Neutro' : 'Detrator'

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div className="card" style={{ width: '100%', maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="section-label">CS — {client.name}</div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          {[['info','Dados CS'],['nps','NPS'],['activities','Atividades']].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key as any)} style={{
              flex: 1, padding: '10px', fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              background: activeTab === key ? 'var(--yellow-bg)' : 'transparent',
              color: activeTab === key ? 'var(--yellow)' : 'var(--text-secondary)',
              border: 'none', borderBottom: activeTab === key ? '2px solid var(--yellow)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>{label}</button>
          ))}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {/* INFO TAB */}
          {activeTab === 'info' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="label">Estágio</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {Object.entries(STAGES).map(([key, s]) => (
                      <button key={key} onClick={() => setForm(f => ({ ...f, stage: key as any }))}
                        style={{ padding: '8px', borderRadius: '2px', border: `1px solid ${form.stage === key ? s.color : 'var(--border)'}`, background: form.stage === key ? s.color + '20' : 'transparent', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: form.stage === key ? s.color : 'var(--text-secondary)', letterSpacing: '0.05em' }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">CS Owner</label>
                  <select className="input" value={form.cs_owner} onChange={e => setForm(f => ({ ...f, cs_owner: e.target.value }))}>
                    <option value="">Sem CS owner</option>
                    {csOwners.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">MRR (R$)</label>
                  <input type="number" className="input" value={form.mrr} onChange={e => setForm(f => ({ ...f, mrr: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Health Score (0–100)</label>
                  <input type="number" min="0" max="100" className="input" value={form.health_score} onChange={e => setForm(f => ({ ...f, health_score: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Último Contato</label>
                  <input type="date" className="input" value={form.last_contact_at} onChange={e => setForm(f => ({ ...f, last_contact_at: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Última Reunião</label>
                  <input type="date" className="input" value={form.last_meeting_at} onChange={e => setForm(f => ({ ...f, last_meeting_at: e.target.value }))} />
                </div>
              </div>

              {/* Upsell */}
              <div style={{ padding: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <label className="label" style={{ marginBottom: 0 }}>Oportunidade de Upsell</label>
                  <button onClick={() => setForm(f => ({ ...f, upsell_opportunity: !f.upsell_opportunity }))}
                    style={{ width: '40px', height: '22px', borderRadius: '11px', border: 'none', cursor: 'pointer', background: form.upsell_opportunity ? 'var(--yellow)' : 'var(--border)', transition: 'background 0.2s', position: 'relative' }}>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'white', position: 'absolute', top: '3px', transition: 'left 0.2s', left: form.upsell_opportunity ? '21px' : '3px' }} />
                  </button>
                </div>
                {form.upsell_opportunity && (
                  <div>
                    <label className="label">Valor potencial (R$)</label>
                    <input type="number" className="input" value={form.upsell_value} onChange={e => setForm(f => ({ ...f, upsell_value: e.target.value }))} />
                  </div>
                )}
              </div>

              {/* Flags */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {[
                  { key: 'churn_risk', label: '⚠️ Risco de Churn', color: '#ef4444' },
                  { key: 'payment_on_time', label: '✅ Pagamento em Dia', color: '#22c55e' },
                ].map(({ key, label, color }) => (
                  <button key={key} onClick={() => setForm(f => ({ ...f, [key]: !(f as any)[key] }))}
                    style={{ padding: '10px', borderRadius: '2px', border: `1px solid ${(form as any)[key] ? color : 'var(--border)'}`, background: (form as any)[key] ? color + '15' : 'transparent', cursor: 'pointer', fontSize: '12px', color: (form as any)[key] ? color : 'var(--text-secondary)', fontWeight: (form as any)[key] ? 600 : 400 }}>
                    {label}
                  </button>
                ))}
              </div>

              <div>
                <label className="label">Observações</label>
                <textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
          )}

          {/* NPS TAB */}
          {activeTab === 'nps' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Add NPS */}
              <div style={{ padding: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px' }}>
                <div className="section-label" style={{ marginBottom: '12px' }}>Registrar NPS</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                  <div>
                    <label className="label">Mês</label>
                    <select className="input" value={npsForm.month} onChange={e => setNpsForm(f => ({ ...f, month: e.target.value }))}>
                      {MONTH_FULL.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label">Ano</label>
                    <select className="input" value={npsForm.year} onChange={e => setNpsForm(f => ({ ...f, year: e.target.value }))}>
                      {[2024,2025,2026,2027].map(y => <option key={y}>{y}</option>)}
                    </select>
                  </div>
                </div>
                <label className="label">Nota: {npsForm.score}/10 — <span style={{ color: npsColor(npsForm.score) }}>{npsLabel(npsForm.score)}</span></label>
                <div style={{ display: 'flex', gap: '4px', margin: '8px 0' }}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setNpsForm(f => ({ ...f, score: n }))}
                      style={{ flex: 1, padding: '8px 0', borderRadius: '2px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                        background: npsForm.score === n ? npsColor(n) : 'var(--bg-input)',
                        color: npsForm.score === n ? 'white' : 'var(--text-secondary)',
                        border: npsForm.score === n ? 'none' : '1px solid var(--border)' }}>
                      {n}
                    </button>
                  ))}
                </div>
                <input className="input" style={{ marginBottom: '10px' }} placeholder="Comentário (opcional)..." value={npsForm.comment} onChange={e => setNpsForm(f => ({ ...f, comment: e.target.value }))} />
                <button onClick={addNPS} className="btn-primary" style={{ padding: '7px 16px', fontSize: '11px' }}><Save size={12} /> Salvar NPS</button>
              </div>

              {/* NPS History */}
              <div>
                <div className="section-label" style={{ marginBottom: '10px' }}>Histórico de NPS</div>
                {npsLocal.length === 0 ? (
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>Nenhum NPS registrado.</p>
                ) : [...npsLocal].sort((a,b) => {
                  const ay = (a as any).year * 12 + (a as any).month
                  const by = (b as any).year * 12 + (b as any).month
                  return by - ay
                }).map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px', marginBottom: '8px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: npsColor(n.score) + '20', border: `2px solid ${npsColor(n.score)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: npsColor(n.score) }}>{n.score}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: npsColor(n.score) }}>{npsLabel(n.score)}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{(n as any).month ? MONTH_NAMES[(n as any).month - 1] + ' ' + (n as any).year : new Date(n.responded_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}</span>
                      </div>
                      {n.comment && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>{n.comment}</p>}
                    </div>
                    <button onClick={() => deleteNPS(n.id)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITIES TAB */}
          {activeTab === 'activities' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div className="section-label">Atividades de CS</div>
                <button onClick={() => setShowActForm(v => !v)} className="btn-primary" style={{ padding: '6px 14px', fontSize: '11px' }}>
                  <Plus size={12} /> {showActForm ? 'Cancelar' : 'Registrar'}
                </button>
              </div>

              {showActForm && (
                <div style={{ padding: '14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                      <label className="label">Tipo</label>
                      <select className="input" value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))}>
                        {[['meeting','🤝 Reunião'],['call','📞 Ligação'],['email','✉️ E-mail'],['checkin','✅ Check-in'],['ticket','🎫 Ticket'],['other','📌 Outro']].map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Responsável CS</label>
                      <select className="input" value={actForm.cs_owner} onChange={e => setActForm(f => ({ ...f, cs_owner: e.target.value }))}>
                        <option value="">Selecionar...</option>
                        {csOwners.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="label">Data/hora</label>
                    <input type="datetime-local" className="input" value={actForm.done_at} onChange={e => setActForm(f => ({ ...f, done_at: e.target.value }))} />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label className="label">Observações</label>
                    <textarea className="input" style={{ minHeight: '60px', resize: 'vertical' }} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} />
                  </div>
                  <button onClick={addActivity} className="btn-primary" style={{ padding: '7px 16px', fontSize: '11px' }}><Save size={12} /> Salvar</button>
                </div>
              )}

              {activitiesLocal.length === 0 ? (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '20px 0' }}>Nenhuma atividade registrada.</p>
              ) : [...activitiesLocal].sort((a,b) => new Date(b.done_at ?? b.created_at).getTime() - new Date(a.done_at ?? a.created_at).getTime()).map(act => {
                const icons: Record<string,string> = { meeting: '🤝', call: '📞', email: '✉️', checkin: '✅', ticket: '🎫', other: '📌' }
                const labels: Record<string,string> = { meeting: 'Reunião', call: 'Ligação', email: 'E-mail', checkin: 'Check-in', ticket: 'Ticket', other: 'Outro' }
                return (
                  <div key={act.id} style={{ display: 'flex', gap: '12px', padding: '10px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0 }}>{icons[act.type] ?? '📌'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>{labels[act.type] ?? act.type}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {act.done_at ? new Date(act.done_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>
                      {act.cs_owner && <p style={{ fontSize: '11px', color: 'var(--yellow)', marginTop: '1px' }}>{act.cs_owner}</p>}
                      {act.notes && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.5 }}>{act.notes}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'info' && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
            <button onClick={saveCS} disabled={saving} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
            <button onClick={onClose} className="btn-ghost">Cancelar</button>
          </div>
        )}
      </div>
    </div>
  )
}
