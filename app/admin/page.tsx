import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const fK = (v: number) => v >= 1000 ? `R$ ${(v / 1000).toFixed(1)}k` : `R$ ${v.toLocaleString('pt-BR')}`

const PDCA_CFG = {
  plan:  { label: 'PLAN',  color: '#6366f1' },
  do:    { label: 'DO',    color: '#F5C518' },
  check: { label: 'CHECK', color: '#f97316' },
  act:   { label: 'ACT',   color: '#22c55e' },
}

const STAGE_CFG: Record<string, { label: string; color: string }> = {
  estruturacao: { label: 'Estruturação', color: '#6366f1' },
  estavel:      { label: 'Estável',      color: '#22c55e' },
  escala:       { label: 'Escala',       color: '#F5C518' },
  alerta:       { label: 'Alerta',       color: '#ef4444' },
}

const DEAL_STAGES: Record<string, string> = {
  lead: 'Lead', qualified: 'Qualificado', proposal: 'Proposta',
  negotiation: 'Negociação', closed_won: 'Fechado',
}

function MiniBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ background: 'var(--bg-hover)', borderRadius: '2px', height: '5px', overflow: 'hidden', flex: 1 }}>
      <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: color, borderRadius: '2px' }} />
    </div>
  )
}

export default async function AdminHome() {
  const supabase = await createServerSupabase()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStr = `${year}-${String(month).padStart(2, '0')}`

  const [
    { data: clients },
    { data: deals },
    { data: csData },
    { data: tasks },
    { data: npsResponses },
  ] = await Promise.all([
    supabase.from('clients').select('id, name, active').order('name'),
    supabase.from('deals').select('id, stage, value, probability, title, company, closed_at').order('value', { ascending: false }),
    supabase.from('client_cs').select('client_id, stage, mrr, nps_score, last_contact_at, payment_on_time'),
    supabase.from('tasks').select('id, pdca, completed, client_id, title, priority').order('created_at', { ascending: false }),
    supabase.from('nps_responses').select('score, responded_at'),
  ])

  const activeClients = (clients ?? []).filter(c => c.active)

  // ── Comercial stats ──
  const activeDeals = (deals ?? []).filter(d => !['closed_won', 'closed_lost'].includes(d.stage))
  const pipeline = activeDeals.reduce((s, d) => s + ((d.value ?? 0) * (d.probability ?? 0) / 100), 0)
  const closedThisMonth = (deals ?? []).filter(d => d.stage === 'closed_won' && d.closed_at?.startsWith(monthStr))
  const closedMRR = closedThisMonth.reduce((s, d) => s + (d.value ?? 0), 0)
  const dealsByStage = Object.keys(DEAL_STAGES).map(s => ({
    key: s, label: DEAL_STAGES[s],
    count: (deals ?? []).filter(d => d.stage === s).length,
  })).filter(s => s.count > 0 || ['lead', 'qualified', 'proposal'].includes(s.key))

  // ── Operacional stats ──
  const totalMRR = (csData ?? []).reduce((s, c) => s + (c.mrr ?? 0), 0)
  const alertCount = (csData ?? []).filter(c => c.stage === 'alerta').length
  const stageGroups = ['estruturacao', 'estavel', 'escala', 'alerta'].map(s => ({
    key: s, ...STAGE_CFG[s],
    count: (csData ?? []).filter(c => c.stage === s).length,
  }))
  const last6NPS = (npsResponses ?? []).filter(n => {
    const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - 6)
    return new Date(n.responded_at) >= cutoff
  })
  const promoters = last6NPS.filter(n => n.score >= 9).length
  const detractors = last6NPS.filter(n => n.score <= 6).length
  const npsScore = last6NPS.length > 0 ? Math.round(((promoters - detractors) / last6NPS.length) * 100) : null

  // ── Tarefas stats ──
  const openTasks = (tasks ?? []).filter(t => !t.completed)
  const pdcaCounts = (['plan', 'do', 'check', 'act'] as const).map(p => ({
    key: p, ...PDCA_CFG[p],
    count: openTasks.filter(t => t.pdca === p).length,
  }))
  const totalOpen = openTasks.length
  const inProgress = openTasks.filter(t => t.pdca === 'do').length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <div className="section-label" style={{ marginBottom: '6px' }}>Painel</div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>
          CENTRAL DE GESTÃO
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>
          Visão geral da operação — {now.toLocaleString('pt-BR', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Clientes Ativos', value: String(activeClients.length), color: 'var(--yellow)', href: '/admin/clients' },
          { label: 'Pipeline Ponderado', value: fK(pipeline), color: 'var(--yellow)', href: '/admin/commercial' },
          { label: 'Em Alerta (CS)', value: String(alertCount), color: alertCount > 0 ? '#ef4444' : '#22c55e', href: '/admin/cs' },
          { label: 'Tarefas Abertas', value: String(totalOpen), color: totalOpen > 0 ? 'var(--yellow)' : '#22c55e', href: '/admin/tasks' },
        ].map(({ label, value, color, href }) => (
          <Link key={label} href={href} style={{ textDecoration: 'none' }}>
            <div className="card" style={{ padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <p style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>{label}</p>
              <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '0.03em', color, lineHeight: 1 }}>{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* 3 widgets */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>

        {/* ── COMERCIAL ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-label">Comercial</div>
            <Link href="/admin/commercial" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Fechado no mês', value: fK(closedMRR), color: '#22c55e' },
                { label: 'Pipeline', value: fK(pipeline), color: 'var(--yellow)' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>Funil de Deals</p>
              {dealsByStage.slice(0, 5).map(({ key, label, count }) => {
                const maxCount = Math.max(...dealsByStage.map(d => d.count), 1)
                return (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color: 'var(--text)' }}>{label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: key === 'closed_won' ? '#22c55e' : 'var(--text-secondary)' }}>{count}</span>
                    </div>
                    <MiniBar pct={(count / maxCount) * 100} color={key === 'closed_won' ? '#22c55e' : 'var(--yellow)'} />
                  </div>
                )
              })}
              {activeDeals.length === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '8px 0' }}>Nenhum deal ativo</p>
              )}
            </div>
          </div>
        </div>

        {/* ── OPERACIONAL ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-label">Operacional</div>
            <Link href="/admin/cs" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'MRR Total', value: fK(totalMRR), color: 'var(--yellow)' },
                { label: 'NPS Score', value: npsScore !== null ? (npsScore >= 0 ? '+' : '') + npsScore : '—', color: npsScore !== null && npsScore >= 50 ? '#22c55e' : '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>Estágios da Carteira</p>
              {stageGroups.map(({ key, label, color, count }) => {
                const pct = activeClients.length ? (count / activeClients.length) * 100 : 0
                return (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
                        <span style={{ fontSize: '11px', color: 'var(--text)' }}>{label}</span>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 700, color }}>{count}</span>
                    </div>
                    <MiniBar pct={pct} color={color} />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* ── TAREFAS ── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="section-label">Tarefas</div>
            <Link href="/admin/tasks" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Ver tudo <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ padding: '16px 20px', flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
              {[
                { label: 'Abertas', value: String(totalOpen), color: 'var(--yellow)' },
                { label: 'Em Execução', value: String(inProgress), color: '#F5C518' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '4px' }}>{label}</p>
                  <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color, lineHeight: 1 }}>{value}</p>
                </div>
              ))}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '14px' }}>
              <p style={{ fontSize: '9px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '10px' }}>Ciclo PDCA</p>
              {pdcaCounts.map(({ key, label, color, count }) => {
                const pct = totalOpen > 0 ? (count / totalOpen) * 100 : 0
                return (
                  <div key={key} style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                      <span style={{ fontSize: '11px', color, fontWeight: 600, letterSpacing: '0.06em' }}>{label}</span>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)' }}>{count}</span>
                    </div>
                    <MiniBar pct={pct} color={color} />
                  </div>
                )
              })}
              {totalOpen === 0 && (
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', padding: '8px 0' }}>Nenhuma tarefa aberta</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
