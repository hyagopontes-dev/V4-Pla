import { createServerSupabase } from '@/lib/supabase-server'
import DeliverableView from '@/components/client/DeliverableView'
import OtherDeliverableView from '@/components/client/OtherDeliverableView'
import TrafficView from '@/components/client/TrafficView'
import ScopeView from '@/components/client/ScopeView'
import CommLogView from '@/components/client/CommLogView'
import BlockerView from '@/components/client/BlockerView'
import HighlightView from '@/components/client/HighlightView'
import OrganicView from '@/components/client/OrganicView'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientSlug } = await searchParams
  const supabase = await createServerSupabase()

  const { data: clients } = clientSlug
    ? await supabase.from('clients').select('*').eq('slug', clientSlug)
    : await supabase.from('clients').select('*').order('name').limit(1)

  const client = clients?.[0]
  if (!client) return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm">Cliente não encontrado.</p>
    </div>
  )

  const [
    { data: deliverables },
    { data: otherDeliverables },
    { data: metrics },
    { data: commLogs },
    { data: blockers },
    { data: highlights },
    { data: organicAnalyses },
    { data: monthlyObjectives },
  ] = await Promise.all([
    supabase.from('deliverables').select('*').eq('client_id', client.id).order('year').order('month'),
    supabase.from('other_deliverables').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('traffic_metrics').select('*').eq('client_id', client.id),
    supabase.from('comm_logs').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('blockers').select('*').eq('client_id', client.id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('organic_analysis').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('monthly_objectives').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas entregas e métricas</p>
      </div>
      <DeliverableView deliverables={deliverables ?? []} contractPieces={client.contract_pieces} />
      <OtherDeliverableView items={otherDeliverables ?? []} />
      <TrafficView metrics={metrics ?? []} />
      <BlockerView blockers={blockers ?? []} />
      <HighlightView highlights={highlights ?? []} />
      <CommLogView logs={commLogs ?? []} />
      <OrganicView analyses={organicAnalyses ?? []} />
      <ScopeView scope={client.scope_description} objectives={monthlyObjectives ?? []} />
    </div>
  )
}
