import { createServerSupabase } from '@/lib/supabase-server'
import AIStudio from '@/components/admin/AIStudio'

export default async function AIPage() {
  const supabase = await createServerSupabase()
  const { data: clients } = await supabase
    .from('clients')
    .select('id, name, slug, scope_description, about')
    .eq('active', true)
    .order('name')

  return <AIStudio clients={clients ?? []} />
}
