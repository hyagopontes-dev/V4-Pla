'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { ClientCS, NPSResponse, CSActivity } from '@/types'
import { AlertTriangle, TrendingUp, TrendingDown, Heart, Users, Plus, X, Save, ChevronRight, Clock, Activity } from 'lucide-react'

interface Client { id: string; name: string; slug: string; active: boolean }
interface TeamMember { id: string; name: string; avatar_color: string; role?: string }
interface HealthSnap { id: string; client_id: string; score: number; recorded_at: string }
interface CSHistory { id: string; client_id: string; from_stage: string; to_stage: string; reason: string; changed_by: string; created_at: string }

interface Props {
  clients: Client[]; csData: ClientCS[]; csHistory: CSHistory[]
  npsResponses: NPSResponse[]; csActivities: CSActivity[]
  healthHistory: HealthSnap[]; team: TeamMember[]; month: number; year: number
}

const STAGES = {
  estruturacao: { label: 'Estruturação', color: '#6366f1', bg: 'rgba(99,102,241,0.12)', desc: 'Cliente novo, em fase de onboarding' },
  estavel:      { label: 'Estável',      color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  desc: 'Operação rodando bem' },
  escala:       { label: 'Escala',       color: '#F5C518', bg: 'rgba(245,197,24,0.12)', desc: 'Expandindo serviços' },
  alerta:       { label: 'Alerta',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  desc: 'Requer atenção imediata' },
}

const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
const fK = (v: number) => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : fBRL(v)

function HealthBadge({ score }: { score: number }) {
  const cfg = score >= 70 ? { label: 'Saudável', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' }
    : score >= 40 ? { label: 'Atenção', color: '#eab308', bg: 'rgba(234,179,8,0.1)' }
    : { label: 'Crítico', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
  return (
    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '2px', background: cfg.bg, color: cfg.color, fontWeight: 700, letterSpacing: '0.08em' }}>
      {score} · {cfg.label}
    </span>
  )
}

function AlertBox({ text, type = 'warning' }: { text: string; type?: 'warning' | 'danger' }) {
  const c = type === 'danger'
    ? { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', color: '#ef4444' }
    : { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)', color: '#eab308' }
  return (
    <div style={{ display: 'flex', gap: '8px', padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '2px' }}>
      <AlertTriangle size={13} style={{ color: c.color, flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '12px', color: c.color, lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: '2px', height: '6px', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: '2px', transition: 'width 0.6s' }} />
    </div>
  )
}

export default function CSPanel({ clients, csData: initial, csHistory: initHistory, npsResponses, csActivities: initActivities, healthHistory, team, month, year }: Props) {
  const [csData, setCsData] = useState<ClientCS[]>(initial)
  const [csHistory, setCsHistory] = useState<CSHistory[]>(initHistory)
  const [activities, setActivities] = useState<CSActivity[]>(initActivities)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [showStageModal, setShowStageModal] = useState<string | null>(null)
  const [showActForm, setShowActForm] = useState(false)
  const [showNPSForm, setShowNPSForm] = useState<string | null>(null)
  const [stageReason, setStageReason] = useState('')
  const [newStage, setNewStage] = useState('')
  const [saving, setSaving] = useState(false)
  const [actForm, setActForm] = useState({ client_id: '', cs_owner: '', type: 'checkin', notes: '', done: true, done_at: new Date().toISOString().slice(0, 16) })
  const [npsForm, setNpsForm] = useState({ score: 8, comment: '' })
  const supabase = createClient()
  const now = new Date()

  // Build map client_id -> cs
  const csMap = useMemo(() => Object.fromEntries(csData.map(c => [c.client_id, c])), [csData])

  // Health score calc: engagement(30) + NPS(30) + payment(20) + contact(20)
  function calcHealth(clientId: string): number {
    const cs = csMap[clientId]
    if (!cs) return 50

    // Engagement: based on stage
    const engageMap: Record<string, number> = { escala: 100, estavel: 80, estruturacao: 60, alerta: 20 }
    const engage = engageMap[cs.stage] ?? 50

    // NPS: 0-10 → 0-100
    const npsScore = cs.nps_score != null ? (cs.nps_score / 10) * 100 : 50

    // Payment
    const payment = cs.payment_on_time ? 100 : 0

    // Contact recency: days since last contact
    const daysSinceContact = cs.last_contact_at
      ? (now.getTime() - new Date(cs.last_contact_at).getTime()) / 86400000
      : 60
    const contactScore = daysSinceContact <= 7 ? 100 : daysSinceContact <= 14 ? 75 : daysSinceContact <= 30 ? 50 : daysSinceContact <= 45 ? 25 : 0

    return Math.round(engage * 0.3 + npsScore * 0.3 + payment * 0.2 + contactScore * 0.2)
  }

  // NPS calc
  const last6NPS = useMemo(() => {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6)
    return npsResponses.filter(n => new Date(n.responded_at) >= cutoff)
  }, [npsResponses])
  const promoters = last6NPS.filter(n => n.score >= 9).length
  const detractors = last6NPS.filter(n => n.score <= 6).length
  const npsScore = last6NPS.length > 0 ? Math.round(((promoters - detractors) / last6NPS.length) * 100) : null

  // MRR
  const totalMRR = csData.reduce((s, c) => s + (c.mrr || 0), 0)
  const alertMRR = csData.filter(c => c.stage === 'alerta').reduce((s, c) => s + (c.mrr || 0), 0)

  // Churn (mock: cancelled this month / base)
  const baseClients = clients.length
  const churnRate = baseClients > 0 ? 0 : 0 // Would need cancellation tracking

  // Alerts
  const alerts = useMemo(() => {
    const a: { text: string; type: 'warning' | 'danger'; clientId?: string }[] = []

    clients.forEach(client => {
      const cs = csMap[client.id]
      if (!cs) return
      const score = calcHealth(client.id)

      // Health drop > 15pts in 30 days
      const recentHistory = healthHistory.filter(h => h.client_id === client.id).slice(0, 2)
      if (recentHistory.length >= 2) {
        const drop = recentHistory[1].score - recentHistory[0].score
        if (drop > 15) a.push({ text: `${client.name}: health score caiu ${drop} pontos em 30 dias.`, type: 'danger', clientId: client.id })
      }

      // Alert stage + no contact > 7 days
      if (cs.stage === 'alerta' && cs.last_contact_at) {
        const days = (now.getTime() - new Date(cs.last_contact_at).getTime()) / 86400000
        if (days > 7) a.push({ text: `${client.name} está em "Alerta" sem contato há ${Math.floor(days)} dias.`, type: 'danger', clientId: client.id })
      }

      // No meeting > 45 days
      if (cs.last_meeting_at) {
        const days = (now.getTime() - new Date(cs.last_meeting_at).getTime()) / 86400000
        if (days > 45) a.push({ text: `${client.name} sem reunião registrada há ${Math.floor(days)} dias.`, type: 'warning', clientId: client.id })
      }
    })

    // Detractors
    const recentNPS = npsResponses.filter(n => {
      const days = (now.getTime() - new Date(n.responded_at).getTime()) / 86400000
      return days <= 30 && n.score <= 6
    })
    recentNPS.forEach(n => {
      const client = clients.find(c => c.id === n.client_id)
      if (client) a.push({ text: `${client.name} respondeu NPS com nota ${n.score} (detrator).`, type: 'danger', clientId: client.id })
    })

    return a
  }, [clients, csMap, healthHistory, npsResponses])

  async function changeStage(clientId: string) {
    if (!newStage || !stageReason.trim()) return
    setSaving(true)
    const cs = csMap[clientId]
    if (cs) {
      await supabase.from('client_cs').update({ stage: newStage, stage_changed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('client_id', clientId)
      const { data: hist } = await supabase.from('client_cs_history').insert({ client_id: clientId, from_stage: cs.stage, to_stage: newStage, reason: stageReason, changed_by: 'Admin' }).select().single()
      setCsData(prev => prev.map(c => c.client_id === clientId ? { ...c, stage: newStage as any, stage_changed_at: new Date().toISOString() } : c))
      if (hist) setCsHistory(prev => [hist, ...prev])
    } else {
      const { data } = await supabase.from('client_cs').insert({ client_id: clientId, stage: newStage, mrr: 0, health_score: 50, churn_risk: false, upsell_opportunity: false, upsell_value: 0, payment_on_time: true }).select().single()
      if (data) setCsData(prev => [...prev, data])
    }
    setSaving(false); setShowStageModal(null); setStageReason(''); setNewStage('')
  }

  async function saveActivity() {
    setSaving(true)
    const payload = { ...actForm, done_at: actForm.done_at ? new Date(actForm.done_at).toISOString() : new Date().toISOString() }
    const { data } = await supabase.from('cs_activities').insert(payload).select().single()
    if (data) {
      setActivities(prev => [data, ...prev])
      // Update last_contact_at
      await supabase.from('client_cs').upsert({ client_id: actForm.client_id, last_contact_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
      setCsData(prev => prev.map(c => c.client_id === actForm.client_id ? { ...c, last_contact_at: new Date().toISOString() } : c))
    }
    setSaving(false); setShowActForm(false)
  }

  async function saveNPS() {
    if (!showNPSForm) return
    setSaving(true)
    await supabase.from('nps_responses').insert({ client_id: showNPSForm, score: npsForm.score, comment: npsForm.comment })
    await supabase.from('client_cs').upsert({ client_id: showNPSForm, nps_score: npsForm.score, nps_updated_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'client_id' })
    setCsData(prev => prev.map(c => c.client_id === showNPSForm ? { ...c, nps_score: npsForm.score } : c))
    setSaving(false); setShowNPSForm(null)
  }

  // Clients without CS record
  const clientsWithCS = clients.map(c => ({ ...c, cs: csMap[c.id], health: calcHealth(c.id) }))
  const alertClients = clientsWithCS.filter(c => c.cs?.stage === 'alerta')
  const noContactClients = clientsWithCS.filter(c => {
    const cs = c.cs; if (!cs?.last_contact_at) return true
    return (now.getTime() - new Date(cs.last_contact_at).getTime()) / 86400000 > 30
  })

  const stageGroups = Object.keys(STAGES).map(s => ({
    key: s, ...STAGES[s as keyof typeof STAGES],
    clients: clientsWithCS.filter(c => (c.cs?.stage ?? 'estruturacao') === s)
  }))

  const activitiesThisMonth = activities.filter(a => a.done_at && new Date(a.done_at).getMonth() + 1 === month)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Painel Interno</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>CUSTOMER SUCCESS</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>Saúde da carteira, NPS e gestão de ciclo de vida</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowActForm(true)} className="btn-ghost" style={{ padding: '8px 16px' }}><Activity size={13} /> Registrar Atividade</button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {alerts.slice(0, 5).map((a, i) => <AlertBox key={i} text={a.text} type={a.type} />)}
          {alerts.length > 5 && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center' }}>+{alerts.length - 5} alertas adicionais</p>}
        </div>
      )}

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '24px' }}>
        {[
          { label: 'Clientes ativos', value: String(clients.length), color: 'var(--yellow)' },
          { label: 'MRR Total', value: fK(totalMRR), color: 'var(--yellow)' },
          { label: 'MRR em risco', value: fK(alertMRR), color: '#ef4444' },
          { label: 'NPS Score', value: npsScore !== null ? String(npsScore) : '—', color: npsScore !== null && npsScore >= 50 ? '#22c55e' : '#ef4444' },
          { label: 'Em alerta', value: String(alertClients.length), color: alertClients.length > 0 ? '#ef4444' : '#22c55e' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ padding: '16px 20px' }}>
            <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</p>
            <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.03em', color, lineHeight: 1 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* NPS */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">NPS — Últimos 6 meses</div>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '16px' }}>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '48px', color: npsScore !== null && npsScore >= 50 ? '#22c55e' : npsScore !== null && npsScore >= 0 ? '#eab308' : '#ef4444', lineHeight: 1 }}>
                {npsScore !== null ? (npsScore >= 0 ? '+' : '') + npsScore : '—'}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{last6NPS.length} respostas</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: 'Promotores', count: promoters, color: '#22c55e' },
                { label: 'Neutros', count: last6NPS.filter(n => n.score >= 7 && n.score <= 8).length, color: '#eab308' },
                { label: 'Detratores', count: detractors, color: '#ef4444' },
              ].map(({ label, count, color }) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'var(--bg-hover)', borderRadius: '2px', border: `1px solid ${color}30` }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', color, lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{label}</div>
                </div>
              ))}
            </div>
            <div style={{ height: '10px', borderRadius: '2px', overflow: 'hidden', display: 'flex' }}>
              <div style={{ flex: promoters, background: '#22c55e' }} />
              <div style={{ flex: last6NPS.filter(n => n.score >= 7 && n.score <= 8).length, background: '#eab308' }} />
              <div style={{ flex: detractors, background: '#ef4444' }} />
            </div>
          </div>
        </div>

        {/* Stage distribution */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Estágios da Carteira</div>
          </div>
          <div style={{ padding: '16px' }}>
            {stageGroups.map(s => {
              const pct = clients.length ? (s.clients.length / clients.length) * 100 : 0
              return (
                <div key={s.key} style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', color: 'var(--text)', flex: 1 }}>{s.label}</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: s.color }}>{s.clients.length}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '35px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                  </div>
                  <MiniBar pct={pct} color={s.color} />
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="section-label">Health Score por Cliente</div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span><span style={{ color: '#22c55e' }}>●</span> Saudável ≥70</span>
            <span><span style={{ color: '#eab308' }}>●</span> Atenção 40–69</span>
            <span><span style={{ color: '#ef4444' }}>●</span> Crítico &lt;40</span>
          </div>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Cliente', 'CS Owner', 'Estágio', 'Health Score', 'NPS', 'Último Contato', 'MRR', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientsWithCS.sort((a, b) => a.health - b.health).map(client => {
                const cs = client.cs
                const stage = STAGES[(cs?.stage ?? 'estruturacao') as keyof typeof STAGES]
                const daysSince = cs?.last_contact_at ? Math.floor((now.getTime() - new Date(cs.last_contact_at).getTime()) / 86400000) : null
                return (
                  <tr key={client.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--text)' }}>{client.name}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{cs?.cs_owner ?? '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '2px', background: stage.bg, color: stage.color, fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer' }}
                        onClick={() => { setShowStageModal(client.id); setNewStage(cs?.stage ?? 'estruturacao') }}>
                        {stage.label}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', background: 'var(--bg-hover)', borderRadius: '2px', height: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${client.health}%`, background: client.health >= 70 ? '#22c55e' : client.health >= 40 ? '#eab308' : '#ef4444' }} />
                        </div>
                        <HealthBadge score={client.health} />
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>
                      {cs?.nps_score != null ? (
                        <span style={{ color: cs.nps_score >= 9 ? '#22c55e' : cs.nps_score >= 7 ? '#eab308' : '#ef4444', fontWeight: 600 }}>{cs.nps_score}/10</span>
                      ) : (
                        <button onClick={() => setShowNPSForm(client.id)} style={{ fontSize: '10px', color: 'var(--yellow)', background: 'none', border: '1px solid var(--yellow-border)', borderRadius: '2px', padding: '2px 8px', cursor: 'pointer' }}>+ NPS</button>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {daysSince !== null ? (
                        <span style={{ color: daysSince > 30 ? '#ef4444' : daysSince > 14 ? '#eab308' : 'var(--text-secondary)', fontSize: '11px' }}>
                          {daysSince === 0 ? 'Hoje' : `${daysSince}d atrás`}
                          {daysSince > 30 && ' ⚠️'}
                        </span>
                      ) : <span style={{ color: '#ef4444', fontSize: '11px' }}>Sem registro ⚠️</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--yellow)', fontWeight: 600, fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px' }}>
                      {cs?.mrr ? fK(cs.mrr) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => { setActForm(f => ({ ...f, client_id: client.id })); setShowActForm(true) }}
                          style={{ fontSize: '10px', color: 'var(--yellow)', background: 'none', border: '1px solid var(--yellow-border)', borderRadius: '2px', padding: '3px 8px', cursor: 'pointer' }}>
                          + Contato
                        </button>
                        <button onClick={() => { setShowStageModal(client.id); setNewStage(cs?.stage ?? 'estruturacao') }}
                          style={{ fontSize: '10px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border)', borderRadius: '2px', padding: '3px 8px', cursor: 'pointer' }}>
                          Estágio
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* CS Team */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Carteira por CS</div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {team.map(m => {
              const clientsOwned = clientsWithCS.filter(c => c.cs?.cs_owner === m.name)
              const avgHealth = clientsOwned.length ? Math.round(clientsOwned.reduce((s, c) => s + c.health, 0) / clientsOwned.length) : 0
              const alertCount = clientsOwned.filter(c => c.cs?.stage === 'alerta').length
              return (
                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 700, color: '#0A0A0A', flexShrink: 0 }}>{m.name.charAt(0)}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{m.name}</span>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{clientsOwned.length} clientes</span>
                        {alertCount > 0 && <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>⚠️ {alertCount}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <MiniBar pct={avgHealth} color={avgHealth >= 70 ? '#22c55e' : avgHealth >= 40 ? '#eab308' : '#ef4444'} />
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary)', flexShrink: 0 }}>{avgHealth} avg</span>
                    </div>
                  </div>
                </div>
              )
            })}
            {team.length === 0 && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Cadastre membros em Equipe</p>}
          </div>
        </div>

        {/* Upsell */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Oportunidades de Upsell</div>
          </div>
          <div style={{ padding: '16px' }}>
            {clientsWithCS.filter(c => c.cs?.upsell_opportunity).length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Nenhuma oportunidade marcada.</p>
            ) : clientsWithCS.filter(c => c.cs?.upsell_opportunity).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <p style={{ fontSize: '12px', color: 'var(--text)', fontWeight: 500 }}>{c.name}</p>
                  <p style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Estágio: {STAGES[(c.cs?.stage ?? 'estavel') as keyof typeof STAGES].label}</p>
                </div>
                {c.cs?.upsell_value ? <span style={{ fontSize: '13px', color: 'var(--yellow)', fontWeight: 700, fontFamily: "'Bebas Neue', sans-serif" }}>{fK(c.cs.upsell_value)}</span> : null}
              </div>
            ))}
            <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
              <span>Total potencial</span>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>{fK(clientsWithCS.filter(c => c.cs?.upsell_opportunity).reduce((s, c) => s + (c.cs?.upsell_value || 0), 0))}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent CS Activities */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="section-label">Atividades de CS — {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long' })}</div>
          <button onClick={() => setShowActForm(true)} style={{ fontSize: '10px', color: 'var(--yellow)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Registrar</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: 'var(--border)', padding: '0' }}>
          {['meeting', 'call', 'email', 'checkin', 'ticket'].map(type => {
            const count = activitiesThisMonth.filter(a => a.type === type).length
            const labels: Record<string,string> = { meeting: '🤝 Reuniões', call: '📞 Ligações', email: '✉️ E-mails', checkin: '✅ Check-ins', ticket: '🎫 Tickets' }
            return (
              <div key={type} style={{ background: 'var(--bg-card)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', color: 'var(--yellow)', lineHeight: 1 }}>{count}</div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>{labels[type]}</div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stage Change Modal */}
      {showStageModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="section-label">Alterar Estágio</div>
              <button onClick={() => setShowStageModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '16px', fontWeight: 500 }}>
              {clients.find(c => c.id === showStageModal)?.name}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Novo estágio</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {Object.entries(STAGES).map(([key, s]) => (
                    <button key={key} onClick={() => setNewStage(key)}
                      style={{ padding: '10px', borderRadius: '2px', border: `1px solid ${newStage === key ? s.color : 'var(--border)'}`, background: newStage === key ? s.bg : 'transparent', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: s.color }}>{s.label}</div>
                      <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Motivo *</label>
                <textarea className="input" style={{ minHeight: '70px', resize: 'vertical' }} placeholder="Descreva o motivo da mudança..." value={stageReason} onChange={e => setStageReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => changeStage(showStageModal)} disabled={saving || !newStage || !stageReason.trim()} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Confirmar'}</button>
                <button onClick={() => setShowStageModal(null)} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Modal */}
      {showActForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="section-label">Registrar Atividade CS</div>
              <button onClick={() => setShowActForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Cliente *</label>
                <select className="input" value={actForm.client_id} onChange={e => setActForm(f => ({ ...f, client_id: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">CS Responsável</label>
                <select className="input" value={actForm.cs_owner} onChange={e => setActForm(f => ({ ...f, cs_owner: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))}>
                  {[['meeting','🤝 Reunião'],['call','📞 Ligação'],['email','✉️ E-mail'],['checkin','✅ Check-in'],['ticket','🎫 Ticket'],['other','📌 Outro']].map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div><label className="label">Data/hora</label><input type="datetime-local" className="input" value={actForm.done_at} onChange={e => setActForm(f => ({ ...f, done_at: e.target.value }))} /></div>
              <div><label className="label">Observações</label><textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveActivity} disabled={saving || !actForm.client_id} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setShowActForm(false)} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NPS Modal */}
      {showNPSForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="section-label">Registrar NPS</div>
              <button onClick={() => setShowNPSForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text)', marginBottom: '16px', fontWeight: 500 }}>{clients.find(c => c.id === showNPSForm)?.name}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Nota NPS: {npsForm.score}/10</label>
                <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                  {[0,1,2,3,4,5,6,7,8,9,10].map(n => (
                    <button key={n} onClick={() => setNpsForm(f => ({ ...f, score: n }))}
                      style={{ flex: 1, padding: '8px 0', borderRadius: '2px', fontSize: '11px', fontWeight: 600, cursor: 'pointer',
                        background: npsForm.score === n ? (n >= 9 ? '#22c55e' : n >= 7 ? '#eab308' : '#ef4444') : 'var(--bg-hover)',
                        color: npsForm.score === n ? 'white' : 'var(--text-secondary)',
                        border: npsForm.score === n ? 'none' : '1px solid var(--border)' }}>
                      {n}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  <span>Detrator</span><span>Neutro</span><span>Promotor</span>
                </div>
              </div>
              <div><label className="label">Comentário (opcional)</label><textarea className="input" style={{ minHeight: '70px', resize: 'vertical' }} value={npsForm.comment} onChange={e => setNpsForm(f => ({ ...f, comment: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveNPS} disabled={saving} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setShowNPSForm(null)} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
