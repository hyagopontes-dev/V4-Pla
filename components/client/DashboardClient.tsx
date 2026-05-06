'use client'
import { useState } from 'react'
import DeliverableView from './DeliverableView'
import OtherDeliverableView from './OtherDeliverableView'
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
      {/* HEADER — AVHANT style */}
      <div style={{ background: '#111111', border: '1px solid #2A2A2A', borderRadius: '2px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <div style={{ width: '56px', height: '56px', border: '1px solid #2A2A2A', background: '#1A1A1A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              {client.logo_url
                ? <img src={client.logo_url} alt={client.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
                : <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', color: '#F5C518', letterSpacing: '0.05em' }}>{client.name.charAt(0)}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F5C518', fontWeight: 500, marginBottom: '4px' }}>Cliente</div>
              <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '0.05em', color: '#FAFAFA', lineHeight: 1 }}>{client.name}</h1>
              {client.about && <p style={{ fontSize: '12px', color: '#888', marginTop: '6px', lineHeight: 1.6, maxWidth: '600px', fontWeight: 300 }}>{client.about}</p>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                <span className="badge-warning">{client.contract_pieces} peças/mês</span>
                {client.active ? <span className="badge-success">Ativo</span> : <span className="badge-neutral">Inativo</span>}
                {hasLiveIntegrations && <span className="badge-warning">⚡ Tempo real</span>}
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', borderTop: '1px solid #2A2A2A' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex: 1, padding: '12px', fontSize: '10px', fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              background: tab === t.key ? 'rgba(245,197,24,0.06)' : 'transparent',
              color: tab === t.key ? '#F5C518' : 'rgba(250,250,250,0.35)',
              border: 'none', borderBottom: tab === t.key ? '2px solid #F5C518' : '2px solid transparent',
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
            <DeliverableView deliverables={deliverables} contractPieces={client.contract_pieces} />
            <OtherDeliverableView items={otherDeliverables} />
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
