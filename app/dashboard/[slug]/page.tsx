import { createClient } from '@/lib/supabase'
import DeliverableView from '@/components/client/DeliverableView'
import TrafficView from '@/components/client/TrafficView'

export default async function DashboardPage({ params }: { params: { slug: string } }) {
  const supabase = createClient()

  // 🔎 Buscar cliente pelo SLUG
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (clientError || !client) {
    return (
      <div className="text-center py-20">
        <p className="text-red-500">Cliente não encontrado</p>
      </div>
    )
  }

  const clientId = client.id

  // 📦 Buscar entregas
  const { data: deliverables } = await supabase
    .from('deliverables')
    .select('*')
    .eq('client_id', clientId)
    .order('year')
    .order('month')

  // 📊 Buscar métricas
  const { data: metrics } = await supabase
    .from('traffic_metrics')
    .select('*')
    .eq('client_id', clientId)
    .order('year')
    .order('month')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Acompanhe suas entregas e métricas de campanha
        </p>
      </div>

      <DeliverableView
        deliverables={deliverables ?? []}
        contractPieces={client.contract_pieces ?? 8}
      />

      <TrafficView metrics={metrics ?? []} />
    </div>
  )
}