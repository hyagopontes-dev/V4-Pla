import { createServerSupabase } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import DeliverableManager from '@/components/admin/DeliverableManager'
import MetricsManager from '@/components/admin/MetricsManager'
import UserManager from '@/components/admin/UserManager'
import ClientEditForm from '@/components/admin/ClientEditForm'
import ScopeManager from '@/components/admin/ScopeManager'
import CommLogManager from '@/components/admin/CommLogManager'
import BlockerManager from '@/components/admin/BlockerManager'
import HighlightManager from '@/components/admin/HighlightManager'
import OrganicAnalysisManager from '@/components/admin/OrganicAnalysisManager'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerSupabase()

  const { data: client } = await supabase.from('clients').select('*').eq('id', id).single()
  if (!client) notFound()

  const [
    { data: deliverables },
    { data: metrics },
    { data: users },
    { data: commLogs },
    { data: blockers },
    { data: highlights },
    { data: organicAnalyses },
  ] = await Promise.all([
    supabase.from('deliverables').select('*').eq('client_id', id).order('year').order('month'),
    supabase.from('traffic_metrics').select('*').eq('client_id', id).order('year').order('month'),
    supabase.from('profiles').select('*').eq('client_id', id),
    supabase.from('comm_logs').select('*').eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('blockers').select('*').eq('client_id', id).order('created_at', { ascending: false }),
    supabase.from('highlights').select('*').eq('client_id', id).order('year', { ascending: false }).order('month', { ascending: false }),
    supabase.from('organic_analysis').select('*').eq('client_id', id).order('created_at', { ascending: false }),
  ])

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
        <ScopeManager client={client} />
        <DeliverableManager clientId={id} contractPieces={client.contract_pieces} deliverables={deliverables ?? []} />
        <MetricsManager clientId={id} metrics={metrics ?? []} />
        <CommLogManager clientId={id} logs={commLogs ?? []} />
        <BlockerManager clientId={id} blockers={blockers ?? []} />
        <HighlightManager clientId={id} highlights={highlights ?? []} />
        <OrganicAnalysisManager clientId={id} analyses={organicAnalyses ?? []} />
        <UserManager clientId={id} users={users ?? []} />
      </div>
    </div>
  )
}
