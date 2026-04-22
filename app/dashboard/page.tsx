import { createServerSupabase } from '@/lib/supabase-server'
import DeliverableView from '@/components/client/DeliverableView'
import TrafficView from '@/components/client/TrafficView'
import ScopeView from '@/components/client/ScopeView'
import CommLogView from '@/components/client/CommLogView'
import BlockerView from '@/components/client/BlockerView'
import HighlightView from '@/components/client/HighlightView'
import OrganicView from '@/components/client/OrganicView'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientSlug } = await searchParams
  const supabase = await createServerSupabase()

  const query = supabase.from('clients').select('*')
  const { data: clients } = clientSlug
    ? await query.eq('slug', clientSlug)
    : await query.order('name')

  const client = clients?.[0]

  if (!client) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400 text-sm">Cliente não encontrado.</p>
      </div>
    )
  }

  const [
    { data: deliverables },
    { data: metrics },
    { data: commLogs },
    { data: blockers },
    { data: highlights },
    { data: organicAnalyses },
  ] = await Promise.all([
    supabase.from('deliverables').select('*').eq('client_id', client.id).order('year').order('month'),
    supabase.from('traffic_metrics').select('*').eq('client_id', client.id),
    supabase.from('comm_logs').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('blockers').select('*').eq('client_id', client.id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('organic_analysis').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas entregas e métricas de campanha</p>
      </div>
      <ScopeView scope={client.scope_description} objectives={client.monthly_objectives} />
      <DeliverableView deliverables={deliverables ?? []} contractPieces={client.contract_pieces} />
      <TrafficView metrics={metrics ?? []} />
      <BlockerView blockers={blockers ?? []} />
      <HighlightView highlights={highlights ?? []} />
      <CommLogView logs={commLogs ?? []} />
      <OrganicView analyses={organicAnalyses ?? []} />
    </div>
  )
}
