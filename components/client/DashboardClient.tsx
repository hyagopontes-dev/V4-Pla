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
      {/* HEADER */}
      <div className="bg-black rounded-xl mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-5 flex-wrap">
            <div className="w-16 h-16 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {client.logo_url
                ? <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain p-1" />
                : <span className="text-white font-bold text-2xl">{client.name.charAt(0)}</span>}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-2xl font-bold">{client.name}</h1>
              {client.about && <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-2xl">{client.about}</p>}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">
                  {client.contract_pieces} peças/mês
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${client.active ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                  {client.active ? 'Ativo' : 'Inativo'}
                </span>
                {hasLiveIntegrations && (
                  <span className="text-xs bg-blue-600/20 text-blue-400 border border-blue-600/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                    ⚡ Dados em tempo real
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex border-t border-white/10">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.key ? 'text-red-400 border-b-2 border-red-500 bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}>
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
