import { createServerSupabase } from '@/lib/supabase-server'
import CSPanel from '@/components/admin/CSPanel'

export default async function CSPage() {
  const supabase = await createServerSupabase()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const [
    { data: clients },
    { data: csData },
    { data: csHistory },
    { data: npsResponses },
    { data: csActivities },
    { data: healthHistory },
    { data: team },
  ] = await Promise.all([
    supabase.from('clients').select('id, name, slug, active').eq('active', true).order('name'),

    supabase.from('client_cs').select('*'),
    supabase.from('client_cs_history').select('*').order('created_at', { ascending: false }),
    supabase.from('nps_responses').select('*').order('responded_at', { ascending: false }),
    supabase.from('cs_activities').select('*').order('done_at', { ascending: false }),
    supabase.from('health_score_history').select('*').order('recorded_at', { ascending: false }),
    supabase.from('team_members').select('*').eq('active', true).order('name'),
  ])

  return (
    <CSPanel
      clients={clients ?? []}
      csData={csData ?? []}
      csHistory={csHistory ?? []}
      npsResponses={npsResponses ?? []}
      csActivities={csActivities ?? []}
      healthHistory={healthHistory ?? []}
      team={team ?? []}
      month={month}
      year={year}
    />
  )
}
