'use client'
import { useState } from 'react'
import DeliverableView from './DeliverableView'
import OtherDeliverableView from './OtherDeliverableView'
import TrafficView from './TrafficView'
import BlockerView from './BlockerView'
import HighlightView from './HighlightView'
import CommLogView from './CommLogView'
import OrganicView from './OrganicView'
import ReferencesView from './ReferencesView'
import ScopeView from './ScopeView'
import PlannerView from './PlannerView'
import type {
  Client, Deliverable, TrafficMetric, CommLog, Blocker,
  Highlight, OrganicAnalysis, MonthlyObjective, ClientReference,
  ContentPlanner, OtherDeliverable
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
}

const TABS = [
  { key: 'entregas',   label: 'Entregas' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'planner',    label: 'Planner de Conteúdo' },
]

export default function DashboardClient({
  client, deliverables, otherDeliverables, metrics, commLogs,
  blockers, highlights, organicAnalyses, monthlyObjectives, references, planner
}: Props) {
  const [tab, setTab] = useState('entregas')

  return (
    <div>
      {/* HEADER */}
      <div className="bg-black rounded-xl mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-5 flex-wrap">
            {/* Logo */}
            <div className="w-16 h-16 rounded-xl border border-white/20 bg-white/5 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {client.logo_url ? (
                <img src={client.logo_url} alt={client.name} className="w-full h-full object-contain p-1" />
              ) : (
                <span className="text-white font-bold text-2xl">{client.name.charAt(0)}</span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-2xl font-bold">{client.name}</h1>
              {client.about && (
                <p className="text-gray-400 text-sm mt-1 leading-relaxed max-w-2xl">{client.about}</p>
              )}
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded-full">
                  {client.contract_pieces} peças/mês
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${client.active ? 'bg-green-600/20 text-green-400 border border-green-600/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                  {client.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-t border-white/10">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                tab === t.key
                  ? 'text-red-400 border-b-2 border-red-500 bg-white/5'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
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
          <TrafficView metrics={metrics} />
        )}
        {tab === 'planner' && (
          <PlannerView items={planner} />
        )}
      </div>
    </div>
  )
}
