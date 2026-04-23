'use client'
import { useState } from 'react'
import { ExternalLink, Instagram } from 'lucide-react'
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
import type { Client, InstagramProfile, Deliverable, TrafficMetric, CommLog, Blocker, Highlight, OrganicAnalysis, MonthlyObjective, ClientReference, ContentPlanner, OtherDeliverable } from '@/types'

interface Props {
  client: Client
  igProfile: InstagramProfile | null
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

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return String(n)
}

const TABS = [
  { key: 'entregas',  label: 'Entregas' },
  { key: 'resultados', label: 'Resultados' },
  { key: 'planner',   label: 'Planner de Conteúdo' },
]

export default function DashboardClient({ client, igProfile, deliverables, otherDeliverables, metrics, commLogs, blockers, highlights, organicAnalyses, monthlyObjectives, references, planner }: Props) {
  const [tab, setTab] = useState('entregas')

  return (
    <div>
      {/* HEADER — Instagram style */}
      <div className="bg-black rounded-xl mb-6 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-5 flex-wrap">
            {/* Avatar + info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {igProfile?.avatar_url ? (
                <img src={igProfile.avatar_url} alt={client.name}
                  className="w-16 h-16 rounded-full border-2 border-red-500 object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-full border-2 border-red-500 bg-gray-800 flex items-center justify-center flex-shrink-0">
                  <Instagram size={24} className="text-red-500" />
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-white text-xl font-bold">{client.name}</h1>
                  {igProfile?.instagram_url && (
                    <a href={igProfile.instagram_url} target="_blank" rel="noopener"
                      className="text-red-400 hover:text-red-300">
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
                {igProfile?.username && <p className="text-gray-400 text-sm">{igProfile.username}</p>}
                {igProfile && (
                  <div className="flex items-center gap-4 mt-2">
                    <span className="text-white text-sm"><span className="font-bold">{fmt(igProfile.seguidores)}</span> <span className="text-gray-400 text-xs">seguidores</span></span>
                    <span className="text-white text-sm"><span className="font-bold">{igProfile.posts}</span> <span className="text-gray-400 text-xs">posts</span></span>
                    <span className="text-white text-sm"><span className="font-bold">{igProfile.seguindo}</span> <span className="text-gray-400 text-xs">seguindo</span></span>
                  </div>
                )}
              </div>
            </div>

            {/* Stats grid */}
            {igProfile && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-900 rounded-lg p-3 text-center min-w-[90px]">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Seguidores</p>
                  <p className="text-red-400 text-lg font-bold">{fmt(igProfile.seguidores)}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 text-center min-w-[90px]">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Eng. Médio</p>
                  <p className="text-red-400 text-lg font-bold">{igProfile.eng_medio}%</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 text-center min-w-[90px]">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Views totais</p>
                  <p className="text-white text-lg font-bold">{fmt(igProfile.views_totais)}</p>
                </div>
                <div className="bg-gray-900 rounded-lg p-3 text-center min-w-[90px]">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Likes totais</p>
                  <p className="text-white text-lg font-bold">{fmt(igProfile.likes_totais)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TABS */}
        <div className="flex border-t border-white/10">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${tab === t.key
                ? 'text-red-400 border-b-2 border-red-500 bg-white/5'
                : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
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
