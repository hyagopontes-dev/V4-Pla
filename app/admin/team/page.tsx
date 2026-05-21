import { createServerSupabase } from '@/lib/supabase-server'
import TeamManager from '@/components/admin/TeamManager'

export default async function TeamPage() {
  const supabase = await createServerSupabase()
  const { data: members } = await supabase.from('team_members').select('*').order('name')
  return <TeamManager initialMembers={members ?? []} />
}
