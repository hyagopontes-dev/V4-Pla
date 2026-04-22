import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import DeliverableView from '@/components/client/DeliverableView'
import TrafficView from '@/components/client/TrafficView'

export default async function DashboardPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles').select('client_id').eq('id', user.id).single()

  if (!profile?.client_id) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Sua conta ainda não foi vinculada a um cliente.</p>
        <p className="text-gray-400 text-sm mt-1">Entre em contato com a agência.</p>
      </div>
    )
  }

  const clientId = profile.client_id

  const { data: client } = await supabase
    .from('clients').select('*').eq('id', clientId).single()

  const { data: deliverables } = await supabase
    .from('deliverables').select('*').eq('client_id', clientId).order('year').order('month')

  const { data: metrics } = await supabase
    .from('traffic_metrics').select('*').eq('client_id', clientId).order('year').order('month')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{client?.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">Acompanhe suas entregas e métricas de campanha</p>
      </div>
      <DeliverableView
        deliverables={deliverables ?? []}
        contractPieces={client?.contract_pieces ?? 8}
      />
      <TrafficView metrics={metrics ?? []} />
    </div>
  )
}
