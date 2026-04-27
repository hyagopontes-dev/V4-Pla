import { createServerSupabase } from '@/lib/supabase-server'
import KickoffForm from '@/components/client/KickoffForm'
import { redirect } from 'next/navigation'

export default async function KickoffPage({ searchParams }: { searchParams: Promise<{ client?: string; token?: string }> }) {
  const { client: slug } = await searchParams
  if (!slug) redirect('/login')

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('id, name, slug, logo_url').eq('slug', slug).single()
  if (!client) redirect('/login')

  const { data: existing } = await supabase.from('kickoff_responses').select('id, submitted_at').eq('client_id', client.id).single()

  return <KickoffForm client={client} alreadySubmitted={!!existing} submittedAt={existing?.submitted_at} />
}
