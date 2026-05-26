'use client'
import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase'
import { Deal, SalesActivity, SalesGoal } from '@/types'
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Target, DollarSign, Users, Zap, ChevronRight, X, Save, BarChart2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TeamMember { id: string; name: string; avatar_color: string; role?: string }
interface Props { deals: Deal[]; activities: SalesActivity[]; goals: SalesGoal[]; team: TeamMember[]; month: number; year: number }

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#6366f1', prob: 10 },
  { key: 'qualified', label: 'Qualificado', color: '#3b82f6', prob: 25 },
  { key: 'proposal', label: 'Proposta', color: '#f97316', prob: 50 },
  { key: 'negotiation', label: 'Negociação', color: '#eab308', prob: 75 },
  { key: 'closed_won', label: 'Fechado ✓', color: '#22c55e', prob: 100 },
  { key: 'closed_lost', label: 'Perdido', color: '#ef4444', prob: 0 },
]

const ORIGINS = { inbound: 'Inbound', referral: 'Indicação', outbound: 'Prospecção Ativa', event: 'Evento', other: 'Outro' }
const SERVICES = { gestao_midia: 'Gestão de Mídia', social_media: 'Social Media', seo: 'SEO', branding: 'Branding', consultoria: 'Consultoria', outro: 'Outro' }
const ACT_TYPES = { call: '📞 Ligação', email: '✉️ E-mail', meeting: '🤝 Reunião', follow_up: '🔔 Follow-up', proposal: '📄 Proposta', other: '📌 Outro' }

const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
const fK = (v: number) => v >= 1000 ? `R$ ${(v/1000).toFixed(1)}k` : fBRL(v)

function KpiCard({ label, value, sub, color, icon: Icon, trend }: any) {
  return (
    <div className="card" style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
        <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</p>
        {Icon && <Icon size={16} style={{ color: color ?? 'var(--yellow)', opacity: 0.7 }} />}
      </div>
      <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.03em', color: color ?? 'var(--yellow)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</p>}
      {trend !== undefined && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
          {trend >= 0 ? <TrendingUp size={11} color="#22c55e" /> : <TrendingDown size={11} color="#ef4444" />}
          <span style={{ fontSize: '11px', color: trend >= 0 ? '#22c55e' : '#ef4444', fontWeight: 600 }}>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

function Alert({ text, type = 'warning' }: { text: string; type?: 'warning' | 'danger' }) {
  const colors = { warning: { bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.25)', text: '#eab308' }, danger: { bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.25)', text: '#ef4444' } }
  const c = colors[type]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px', background: c.bg, border: `1px solid ${c.border}`, borderRadius: '2px' }}>
      <AlertTriangle size={13} style={{ color: c.text, flexShrink: 0, marginTop: '1px' }} />
      <p style={{ fontSize: '12px', color: c.text, lineHeight: 1.5 }}>{text}</p>
    </div>
  )
}

export default function CommercialPanel({ deals, activities: initialActivities, goals, team, month, year }: Props) {
  const [deals_, setDeals] = useState<Deal[]>(deals)
  const [activities, setActivities] = useState<SalesActivity[]>(initialActivities)
  const [showDealForm, setShowDealForm] = useState(false)
  const [showActForm, setShowActForm] = useState(false)
  const [editDeal, setEditDeal] = useState<Deal | null>(null)
  const [filterResponsible, setFilterResponsible] = useState('')
  const [filterStage, setFilterStage] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const [dealForm, setDealForm] = useState({
    title: '', company: '', contact_name: '', responsible: '', responsible_id: '',
    stage: 'lead', value: '', probability: '10', origin: 'inbound', service_type: 'gestao_midia',
    expected_close_date: '', first_contact_at: '', notes: ''
  })

  const [actForm, setActForm] = useState({
    deal_id: '', responsible: '', type: 'call', notes: '', done: true, done_at: new Date().toISOString().slice(0, 16)
  })

  // Computed metrics
  const now = new Date()
  const daysInMonth = new Date(year, month, 0).getDate()
  const daysLeft = daysInMonth - now.getDate()

  const thisMonthDeals = useMemo(() => deals_.filter(d => {
    const date = new Date(d.created_at)
    return date.getMonth() + 1 === month && date.getFullYear() === year
  }), [deals_, month, year])

  const wonThisMonth = useMemo(() => deals_.filter(d => d.stage === 'closed_won' && d.closed_at && new Date(d.closed_at).getMonth() + 1 === month), [deals_, month])
  const revenueThisMonth = wonThisMonth.reduce((s, d) => s + (d.value || 0), 0)
  const avgTicket = wonThisMonth.length ? revenueThisMonth / wonThisMonth.length : 0

  const totalGoal = goals.reduce((s, g) => s + g.goal_revenue, 0)
  const goalPct = totalGoal > 0 ? (revenueThisMonth / totalGoal) * 100 : 0

  const activePipeline = deals_.filter(d => !['closed_won','closed_lost'].includes(d.stage))
  const pipelineValue = activePipeline.reduce((s, d) => s + (d.value || 0), 0)
  const weightedPipeline = activePipeline.reduce((s, d) => s + (d.value || 0) * (d.probability || 0) / 100, 0)

  const staleProposals = deals_.filter(d => d.stage === 'proposal' && d.proposal_sent_at && (now.getTime() - new Date(d.proposal_sent_at).getTime()) > 15 * 86400000)

  // Alerts
  const alerts = useMemo(() => {
    const a: { text: string; type: 'warning' | 'danger' }[] = []
    if (staleProposals.length > 0) a.push({ text: `${staleProposals.length} proposta(s) sem movimentação há mais de 15 dias.`, type: 'warning' })
    if (daysLeft < 10 && totalGoal > 0) {
      goals.forEach(g => {
        const memberWon = wonThisMonth.filter(d => d.responsible === team.find(t => t.id === g.team_member_id)?.name)
        const memberRev = memberWon.reduce((s, d) => s + d.value, 0)
        const pct = (memberRev / g.goal_revenue) * 100
        const member = team.find(t => t.id === g.team_member_id)
        if (pct < 70 && member) a.push({ text: `${member.name} está com ${pct.toFixed(0)}% da meta faltando ${daysLeft} dias.`, type: 'danger' })
      })
    }
    return a
  }, [staleProposals, daysLeft, goals, wonThisMonth, team, totalGoal])

  // Filtered deals for pipeline
  const filteredDeals = useMemo(() => deals_.filter(d => {
    if (filterResponsible && d.responsible !== filterResponsible) return false
    if (filterStage && d.stage !== filterStage) return false
    return true
  }), [deals_, filterResponsible, filterStage])

  async function saveDeal() {
    setSaving(true)
    const payload = { ...dealForm, value: parseFloat(dealForm.value || '0'), probability: parseInt(dealForm.probability || '0') }
    if (editDeal) {
      const { data } = await supabase.from('deals').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editDeal.id).select().single()
      if (data) setDeals(prev => prev.map(d => d.id === editDeal.id ? data : d))
    } else {
      const { data } = await supabase.from('deals').insert(payload).select().single()
      if (data) setDeals(prev => [data, ...prev])
    }
    setSaving(false); setShowDealForm(false); setEditDeal(null)
  }

  async function saveActivity() {
    setSaving(true)
    const { data } = await supabase.from('sales_activities').insert(actForm).select().single()
    if (data) setActivities(prev => [data, ...prev])
    setSaving(false); setShowActForm(false)
  }

  async function updateStage(id: string, stage: string) {
    const updates: any = { stage, updated_at: new Date().toISOString() }
    if (stage === 'closed_won' || stage === 'closed_lost') updates.closed_at = new Date().toISOString().slice(0, 10)
    const prob = STAGES.find(s => s.key === stage)?.prob ?? 0
    updates.probability = prob
    await supabase.from('deals').update(updates).eq('id', id)
    setDeals(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
  }

  const activitiesThisMonth = activities.filter(a => a.done_at && new Date(a.done_at).getMonth() + 1 === month)

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Painel Interno</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>GESTÃO COMERCIAL</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>Pipeline, metas e performance do time</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setShowActForm(true)} className="btn-ghost" style={{ padding: '8px 16px' }}><Zap size={13} /> Atividade</button>
          <button onClick={() => { setEditDeal(null); setDealForm({ title:'',company:'',contact_name:'',responsible:'',responsible_id:'',stage:'lead',value:'',probability:'10',origin:'inbound',service_type:'gestao_midia',expected_close_date:'',first_contact_at:'',notes:'' }); setShowDealForm(true) }} className="btn-primary">
            <Plus size={13} /> Novo Deal
          </button>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
          {alerts.map((a, i) => <Alert key={i} text={a.text} type={a.type} />)}
        </div>
      )}

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <KpiCard label="Receita no mês" value={fK(revenueThisMonth)} sub={`${wonThisMonth.length} deals fechados`} icon={DollarSign} />
        <KpiCard label="Ticket médio" value={fK(avgTicket)} sub="deals fechados no mês" icon={BarChart2} />
        <KpiCard label="Pipeline ativo" value={fK(pipelineValue)} sub={`Ponderado: ${fK(weightedPipeline)}`} icon={TrendingUp} />
        <KpiCard label="Dias restantes" value={String(daysLeft)} sub={`Meta: ${fK(totalGoal)}`} icon={Target} color={daysLeft < 10 ? '#ef4444' : 'var(--yellow)'} />
      </div>

      {/* Meta vs Realizado */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <div className="section-label">Meta vs. Realizado — {new Date(year, month - 1).toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', color: goalPct >= 100 ? '#22c55e' : goalPct >= 70 ? 'var(--yellow)' : '#ef4444' }}>{goalPct.toFixed(1)}%</div>
        </div>
        <div style={{ background: 'var(--bg-hover)', borderRadius: '2px', height: '12px', overflow: 'hidden', marginBottom: '8px' }}>
          <div style={{ height: '100%', width: `${Math.min(goalPct, 100)}%`, background: goalPct >= 100 ? '#22c55e' : goalPct >= 70 ? 'var(--yellow)' : '#ef4444', borderRadius: '2px', transition: 'width 0.8s' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-secondary)' }}>
          <span>Realizado: <strong style={{ color: 'var(--text)' }}>{fBRL(revenueThisMonth)}</strong></span>
          <span>Faltam: <strong style={{ color: 'var(--text)' }}>{fBRL(Math.max(0, totalGoal - revenueThisMonth))}</strong></span>
          <span>Meta: <strong style={{ color: 'var(--text)' }}>{fBRL(totalGoal)}</strong></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Funil */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Funil de Vendas</div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {STAGES.filter(s => s.key !== 'closed_lost').map((stage, i, arr) => {
              const count = deals_.filter(d => d.stage === stage.key).length
              const value = deals_.filter(d => d.stage === stage.key).reduce((s, d) => s + d.value, 0)
              const maxCount = Math.max(...arr.map(s => deals_.filter(d => d.stage === s.key).length), 1)
              const w = Math.max(8, (count / maxCount) * 100)
              const prevCount = i > 0 ? deals_.filter(d => d.stage === arr[i-1].key).length : count
              const conv = prevCount > 0 && i > 0 ? ((count / prevCount) * 100).toFixed(0) + '%' : ''
              return (
                <div key={stage.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '90px', flexShrink: 0 }}>{stage.label}</span>
                    <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: '2px', height: '20px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${w}%`, background: stage.color, borderRadius: '2px', display: 'flex', alignItems: 'center', paddingLeft: '8px', transition: 'width 0.6s' }}>
                        {count > 0 && <span style={{ fontSize: '10px', color: 'white', fontWeight: 700 }}>{count}</span>}
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '60px', textAlign: 'right', flexShrink: 0 }}>{value > 0 ? fK(value) : ''}</span>
                    {conv && <span style={{ fontSize: '10px', color: 'var(--text-secondary)', width: '30px', flexShrink: 0 }}>{conv}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Por responsável */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Performance por Vendedor</div>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {team.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '16px 0' }}>Cadastre membros em Equipe</p>
            ) : team.map(m => {
              const goal = goals.find(g => g.team_member_id === m.id)
              const won = wonThisMonth.filter(d => d.responsible === m.name)
              const rev = won.reduce((s, d) => s + d.value, 0)
              const pct = goal?.goal_revenue ? (rev / goal.goal_revenue) * 100 : 0
              const badge = pct >= 100 ? { label: 'Meta ✓', color: '#22c55e', bg: 'rgba(34,197,94,0.1)' } : pct >= 70 ? { label: 'Em risco', color: '#eab308', bg: 'rgba(234,179,8,0.1)' } : { label: 'Abaixo', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' }
              return (
                <div key={m.id}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: m.avatar_color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#0A0A0A', flexShrink: 0 }}>{m.name.charAt(0)}</div>
                    <span style={{ fontSize: '12px', color: 'var(--text)', flex: 1 }}>{m.name}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{fK(rev)}{goal ? ` / ${fK(goal.goal_revenue)}` : ''}</span>
                    {goal && <span style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '2px', background: badge.bg, color: badge.color, fontWeight: 700, letterSpacing: '0.08em' }}>{badge.label}</span>}
                  </div>
                  {goal && (
                    <div style={{ background: 'var(--bg-hover)', borderRadius: '2px', height: '4px', overflow: 'hidden', marginLeft: '34px' }}>
                      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: badge.color, borderRadius: '2px', transition: 'width 0.6s' }} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Origin */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <div className="section-label">Canais de Origem</div>
          </div>
          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {Object.entries(ORIGINS).map(([key, label]) => {
              const count = deals_.filter(d => d.origin === key).length
              const pct = deals_.length ? (count / deals_.length) * 100 : 0
              if (count === 0) return null
              return (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '110px', flexShrink: 0 }}>{label}</span>
                  <div style={{ flex: 1, background: 'var(--bg-hover)', borderRadius: '2px', height: '12px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: 'var(--yellow)', borderRadius: '2px' }} />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary)', width: '40px', textAlign: 'right' }}>{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Activities */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-label">Atividades do Mês</div>
            <button onClick={() => setShowActForm(true)} style={{ fontSize: '10px', color: 'var(--yellow)', background: 'none', border: 'none', cursor: 'pointer' }}>+ Registrar</button>
          </div>
          <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            {['call','email','meeting','follow_up','proposal'].map(type => {
              const count = activitiesThisMonth.filter(a => a.type === type).length
              const labels: Record<string,string> = { call: '📞 Ligações', email: '✉️ E-mails', meeting: '🤝 Reuniões', follow_up: '🔔 Follow-ups', proposal: '📄 Propostas' }
              return (
                <div key={type} style={{ background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '2px', padding: '10px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: 'var(--yellow)', lineHeight: 1 }}>{count}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '2px' }}>{labels[type]}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Pipeline Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '24px' }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div className="section-label" style={{ flex: 1 }}>Pipeline</div>
          <select className="input" style={{ fontSize: '11px', width: 'auto' }} value={filterResponsible} onChange={e => setFilterResponsible(e.target.value)}>
            <option value="">Todos os vendedores</option>
            {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
          <select className="input" style={{ fontSize: '11px', width: 'auto' }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="">Todos os estágios</option>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Deal', 'Empresa', 'Responsável', 'Valor', 'Estágio', 'Prob.', 'Previsão', 'Ações'].map(h => (
                  <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredDeals.filter(d => !['closed_lost'].includes(d.stage)).map(deal => {
                const stage = STAGES.find(s => s.key === deal.stage)!
                const isStale = deal.stage === 'proposal' && deal.proposal_sent_at && (now.getTime() - new Date(deal.proposal_sent_at).getTime()) > 15 * 86400000
                return (
                  <tr key={deal.id} style={{ borderBottom: '1px solid var(--border)', background: isStale ? 'rgba(234,179,8,0.04)' : 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isStale ? 'rgba(234,179,8,0.04)' : 'transparent')}>
                    <td style={{ padding: '10px 14px', color: 'var(--text)', fontWeight: 500 }}>
                      {deal.title}
                      {isStale && <span style={{ marginLeft: '6px', fontSize: '10px', color: '#eab308' }}>⚠️ stale</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{deal.company}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{deal.responsible}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--yellow)', fontWeight: 600, fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px' }}>{fK(deal.value)}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <select value={deal.stage} onChange={e => updateStage(deal.id, e.target.value)}
                        style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '2px', background: stage.color + '20', border: `1px solid ${stage.color}40`, color: stage.color, cursor: 'pointer', fontWeight: 600, letterSpacing: '0.05em' }}>
                        {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{deal.probability}%</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{deal.expected_close_date ? new Date(deal.expected_close_date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => { setEditDeal(deal); setDealForm({ title: deal.title, company: deal.company ?? '', contact_name: deal.contact_name ?? '', responsible: deal.responsible ?? '', responsible_id: deal.responsible_id ?? '', stage: deal.stage, value: String(deal.value), probability: String(deal.probability), origin: deal.origin, service_type: deal.service_type ?? 'gestao_midia', expected_close_date: deal.expected_close_date ?? '', first_contact_at: deal.first_contact_at ?? '', notes: deal.notes ?? '' }); setShowDealForm(true) }}
                        style={{ fontSize: '11px', color: 'var(--yellow)', background: 'none', border: 'none', cursor: 'pointer' }}>
                        Editar
                      </button>
                    </td>
                  </tr>
                )
              })}
              {filteredDeals.filter(d => !['closed_lost'].includes(d.stage)).length === 0 && (
                <tr><td colSpan={8} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>Nenhum deal no pipeline.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deal Form Modal */}
      {showDealForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="section-label">{editDeal ? 'Editar Deal' : 'Novo Deal'}</div>
              <button onClick={() => { setShowDealForm(false); setEditDeal(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div><label className="label">Título *</label><input className="input" value={dealForm.title} onChange={e => setDealForm(f => ({ ...f, title: e.target.value }))} /></div>
                <div><label className="label">Empresa</label><input className="input" value={dealForm.company} onChange={e => setDealForm(f => ({ ...f, company: e.target.value }))} /></div>
                <div><label className="label">Contato</label><input className="input" value={dealForm.contact_name} onChange={e => setDealForm(f => ({ ...f, contact_name: e.target.value }))} /></div>
                <div>
                  <label className="label">Responsável</label>
                  <select className="input" value={dealForm.responsible} onChange={e => { const m = team.find(t => t.name === e.target.value); setDealForm(f => ({ ...f, responsible: e.target.value, responsible_id: m?.id ?? '' })) }}>
                    <option value="">Selecionar...</option>
                    {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Valor (R$)</label><input className="input" type="number" value={dealForm.value} onChange={e => setDealForm(f => ({ ...f, value: e.target.value }))} /></div>
                <div>
                  <label className="label">Estágio</label>
                  <select className="input" value={dealForm.stage} onChange={e => { const s = STAGES.find(s => s.key === e.target.value); setDealForm(f => ({ ...f, stage: e.target.value, probability: String(s?.prob ?? 10) }) )}}>
                    {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Origem</label>
                  <select className="input" value={dealForm.origin} onChange={e => setDealForm(f => ({ ...f, origin: e.target.value }))}>
                    {Object.entries(ORIGINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Serviço</label>
                  <select className="input" value={dealForm.service_type} onChange={e => setDealForm(f => ({ ...f, service_type: e.target.value }))}>
                    {Object.entries(SERVICES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><label className="label">Primeiro contato</label><input type="date" className="input" value={dealForm.first_contact_at} onChange={e => setDealForm(f => ({ ...f, first_contact_at: e.target.value }))} /></div>
                <div><label className="label">Previsão fechamento</label><input type="date" className="input" value={dealForm.expected_close_date} onChange={e => setDealForm(f => ({ ...f, expected_close_date: e.target.value }))} /></div>
              </div>
              <div><label className="label">Probabilidade: {dealForm.probability}%</label><input type="range" min="0" max="100" step="5" value={dealForm.probability} onChange={e => setDealForm(f => ({ ...f, probability: e.target.value }))} style={{ width: '100%', accentColor: 'var(--yellow)' }} /></div>
              <div><label className="label">Observações</label><textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={dealForm.notes} onChange={e => setDealForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveDeal} disabled={saving || !dealForm.title} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => { setShowDealForm(false); setEditDeal(null) }} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Form Modal */}
      {showActForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ width: '100%', maxWidth: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div className="section-label">Registrar Atividade</div>
              <button onClick={() => setShowActForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}><X size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label className="label">Responsável</label>
                <select className="input" value={actForm.responsible} onChange={e => setActForm(f => ({ ...f, responsible: e.target.value }))}>
                  <option value="">Selecionar...</option>
                  {team.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Tipo</label>
                <select className="input" value={actForm.type} onChange={e => setActForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(ACT_TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Deal (opcional)</label>
                <select className="input" value={actForm.deal_id} onChange={e => setActForm(f => ({ ...f, deal_id: e.target.value }))}>
                  <option value="">Sem deal vinculado</option>
                  {deals_.filter(d => !['closed_won','closed_lost'].includes(d.stage)).map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
                </select>
              </div>
              <div><label className="label">Data/hora</label><input type="datetime-local" className="input" value={actForm.done_at} onChange={e => setActForm(f => ({ ...f, done_at: e.target.value }))} /></div>
              <div><label className="label">Observações</label><textarea className="input" style={{ minHeight: '80px', resize: 'vertical' }} value={actForm.notes} onChange={e => setActForm(f => ({ ...f, notes: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={saveActivity} disabled={saving} className="btn-primary"><Save size={13} /> {saving ? 'Salvando...' : 'Salvar'}</button>
                <button onClick={() => setShowActForm(false)} className="btn-ghost">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
