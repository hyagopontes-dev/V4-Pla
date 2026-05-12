'use client'
// v2 - unified deliverables
import { useState } from 'react'
import DeliverableView from './DeliverableView'
import TrafficView from './TrafficView'
import LiveTrafficView from './LiveTrafficView'
import BlockerView from './BlockerView'
import HighlightView from './HighlightView'
import CommLogView from './CommLogView'
import OrganicView from './OrganicView'
import ReferencesView from './ReferencesView'
import ScopeView from './ScopeView'
import PlannerView from './PlannerView'
import SeasonalCalendar from './SeasonalCalendar'
import type {
  Client, Deliverable, TrafficMetric, CommLog, Blocker,
  Highlight, OrganicAnalysis, MonthlyObjective, ClientReference,
  ContentPlanner, OtherDeliverable, AdsIntegration
} from '@/types'

interface Props {
  client: Client
  deliverables: Deliverable[]
  otherDeliverables: OtherDeliverable[]
  metrics: TrafficMetric[]
  commLogs: CommLog[]
  blockers: Blocker[]
  highlights: Highlight[]
  organicAnalyses: OrganicAnalysis[]
  monthlyObjectives: MonthlyObjective[]
  references: ClientReference[]
  planner: ContentPlanner[]
  integrations: AdsIntegration[]
}

const TABS = [
  { key: 'entregas',   label: 'Entregas' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'planner',    label: 'Planner de Conteúdo' },
]

export default function DashboardClient({
  client, deliverables, otherDeliverables, metrics, commLogs,
  blockers, highlights, organicAnalyses, monthlyObjectives,
  references, planner, integrations
}: Props) {
  const [tab, setTab] = useState('entregas')
  const hasLiveIntegrations = integrations.length > 0

  return (
    <div>
      {/* HEADER */}
      <div className="card" style={{ padding: 0, marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '52px', height: '52px', border: '1px solid var(--border)', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {client.logo_url
                ? <img src={client.logo_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: 'var(--yellow)', letterSpacing: '0.05em' }}>{client.name.charAt(0)}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="section-label" style={{ marginBottom: '4px' }}>Cliente</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '26px', letterSpacing: '0.05em', color: 'var(--text)', lineHeight: 1 }}>{client.name}</h1>
              {client.about && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.6, maxWidth: '600px', fontWeight: 300 }}>{client.about}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className="badge-warning">{client.contract_pieces} peças/mês</span>
                {client.active ? <span className="badge-success">Ativo</span> : <span className="badge-neutral">Inativo</span>}
                {hasLiveIntegrations && <span className="badge-warning">⚡ Tempo real</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid var(--border)' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '11px', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              background: tab === t.key ? 'var(--yellow-bg)' : 'transparent',
              color: tab === t.key ? 'var(--yellow)' : 'var(--text-muted)',
              border: 'none', borderBottom: tab === t.key ? '2px solid var(--yellow)' : '2px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="space-y-6">
        {tab === 'entregas' && (
          <>
            <DeliverableView deliverables={deliverables} contractPieces={client.contract_pieces} otherDeliverables={otherDeliverables} />
            {blockers.length > 0 && <BlockerView blockers={blockers} />}
            {highlights.length > 0 && <HighlightView highlights={highlights} />}
            <CommLogView logs={commLogs} />
            <OrganicView analyses={organicAnalyses} />
            {references.length > 0 && <ReferencesView references={references} />}
            <ScopeView scope={client.scope_description} objectives={monthlyObjectives} />
          </>
        )}
        {tab === 'resultados' && (
          <>
            {hasLiveIntegrations && <LiveTrafficView integrations={integrations} dashboardType={client.dashboard_type ?? 'inside_sales'} />}
            {metrics.length > 0 && (
              <div>
                {hasLiveIntegrations && (
                  <p className="text-xs text-gray-500 mb-3 px-1">Histórico manual cadastrado:</p>
                )}
                <TrafficView metrics={metrics} />
              </div>
            )}
            {!hasLiveIntegrations && metrics.length === 0 && (
              <div className="bg-black rounded-xl border border-white/10 p-10 text-center">
                <p className="text-gray-500 text-sm">Nenhuma métrica de tráfego disponível ainda.</p>
              </div>
            )}
          </>
        )}
        {tab === 'planner' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PlannerView items={planner} />
            </div>
            <div>
              <SeasonalCalendar />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
