import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import DeliverableView from '@/components/client/DeliverableView'
import TrafficView from '@/components/client/TrafficView'
import ScopeView from '@/components/client/ScopeView'
import CommLogView from '@/components/client/CommLogView'
import BlockerView from '@/components/client/BlockerView'
import HighlightView from '@/components/client/HighlightView'
import OrganicView from '@/components/client/OrganicView'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()

  const { data: profile } = await supabase.from('profiles').select('client_id').eq('id', user.id).single()
  if (!profile?.client_id) return (
    <div className="text-center py-20">
      <p className="text-gray-400 text-sm">Sua conta ainda não foi vinculada a um cliente.</p>
    </div>
  )

  const clientId = profile.client_id
  const { data: client } = await supabase.from('clients').select('*').eq('id', clientId).single()

  const [
    { data: deliverables },
    { data: metrics },
    { data: commLogs },
    { data: blockers },
    { data: highlights },
    { data: organicAnalyses },
    { data: monthlyObjectives },
  ] = await Promise.all([
    supabase.from('deliverables').select('*').eq('client_id', clientId).order('year').order('month'),
    supabase.from('traffic_metrics').select('*').eq('client_id', clientId),
    supabase.from('comm_logs').select('*').eq('client_id', clientId).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('blockers').select('*').eq('client_id', clientId).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').eq('client_id', clientId).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('organic_analysis').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
    supabase.from('monthly_objectives').select('*').eq('client_id', clientId).order('year', { ascending: false }).order('month', { ascending: false }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{client?.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas entregas e métricas</p>
      </div>
      <ScopeView scope={client?.scope_description} objectives={monthlyObjectives ?? []} />
      <DeliverableView deliverables={deliverables ?? []} contractPieces={client?.contract_pieces ?? 8} />
      <TrafficView metrics={metrics ?? []} />
      <BlockerView blockers={blockers ?? []} />
      <HighlightView highlights={highlights ?? []} />
      <CommLogView logs={commLogs ?? []} />
      <OrganicView analyses={organicAnalyses ?? []} />
    </div>
  )
}
