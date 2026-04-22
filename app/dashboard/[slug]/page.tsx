export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase'
import DeliverableView from '@/components/client/DeliverableView'
import TrafficView from '@/components/client/TrafficView'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (!client) {
    return <div>Cliente não encontrado</div>
  }

  const clientId = client.id

  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('client_id', clientId)
    .order('year')
    .order('month')

  const { data: metrics } = await supabase
    .from('traffic_metrics')
    .select('*')
    .eq('client_id', clientId)
    .order('year')
    .order('month')

  return (
    <div className="space-y-6">
      <h1>{client.name}</h1>

      <DeliverableView
        deliverables={deliverables ?? []}
        contractPieces={client.contract_pieces ?? 8}
      />

      <TrafficView metrics={metrics ?? []} />
    </div>
  )
}