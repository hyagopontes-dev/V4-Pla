import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import StrategicPlanning from '@/components/admin/StrategicPlanning'

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ client?: string }> }) {
  const { client: clientId } = await searchParams
  const supabase = await createServerSupabase()
  
  const { data: clients } = await supabase.from('clients').select('id, name, slug').eq('active', true).order('name')
  
  let planning = null
  let selectedClient = null
  
  if (clientId) {
    selectedClient = clients?.find(c => c.id === clientId)
    const { data } = await supabase.from('strategic_planning').select('*').eq('client_id', clientId).single()
    planning = data
  }
  
  return <StrategicPlanning clients={clients ?? []} selectedClientId={clientId ?? ''} selectedClient={selectedClient} planning={planning} />
}
