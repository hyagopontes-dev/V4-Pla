import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DeliverableManager from '@/components/admin/DeliverableManager'
import MetricsManager from '@/components/admin/MetricsManager'
import UserManager from '@/components/admin/UserManager'
import ClientEditForm from '@/components/admin/ClientEditForm'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const { data: deliverables } = await supabase
    .from('deliverables').select('*').eq('client_id', id).order('year').order('month')

  const { data: metrics } = await supabase
    .from('traffic_metrics').select('*').eq('client_id', id).order('year').order('month')

  const { data: users } = await supabase
    .from('profiles').select('*').eq('client_id', id)

  return (
    <div>
      <Link href="/admin" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={14} /> Voltar para clientes
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{client.name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {client.contract_pieces} peças/mês · slug: <span className="font-mono">{client.slug}</span>
          </p>
        </div>
        <span className={client.active ? 'badge-success' : 'badge-neutral'}>
          {client.active ? 'Ativo' : 'Inativo'}
        </span>
      </div>

      <div className="space-y-6">
        <ClientEditForm client={client} />
        <DeliverableManager clientId={id} contractPieces={client.contract_pieces} deliverables={deliverables ?? []} />
        <MetricsManager clientId={id} metrics={metrics ?? []} />
        <UserManager clientId={id} users={users ?? []} />
      </div>
    </div>
  )
}
