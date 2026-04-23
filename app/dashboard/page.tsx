import { createServerSupabase } from '@/lib/supabase-server'
import DashboardClient from '@/components/client/DashboardClient'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientSlug } = await searchParams
  const supabase = await createServerSupabase()

  const { data: clients } = clientSlug
    ? await supabase.from('clients').select('*').eq('slug', clientSlug)
    : await supabase.from('clients').select('*').order('name').limit(1)

  const client = clients?.[0]
  if (!client) return (
    <div className="text-center py-20"><p className="text-gray-400 text-sm">Cliente não encontrado.</p></div>
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
    { data: references },
    { data: planner },
  ] = await Promise.all([
    supabase.from('deliverables').select('*').eq('client_id', client.id).order('year').order('month'),
    supabase.from('other_deliverables').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('traffic_metrics').select('*').eq('client_id', client.id),
    supabase.from('comm_logs').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('blockers').select('*').eq('client_id', client.id).eq('resolved', false).order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('organic_analysis').select('*').eq('client_id', client.id).order('created_at', { ascending: false }),
    supabase.from('monthly_objectives').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('client_references').select('*').eq('client_id', client.id).order('type').order('name'),
    supabase.from('content_planner').select('*').eq('client_id', client.id).order('year', { ascending: false }).order('month', { ascending: false }),
  ])

  return (
    <DashboardClient
      client={client}
      deliverables={deliverables ?? []}
      otherDeliverables={otherDeliverables ?? []}
      metrics={metrics ?? []}
      commLogs={commLogs ?? []}
      blockers={blockers ?? []}
      highlights={highlights ?? []}
      organicAnalyses={organicAnalyses ?? []}
      monthlyObjectives={monthlyObjectives ?? []}
      references={references ?? []}
      planner={planner ?? []}
    />
  )
}
