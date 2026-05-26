import { createServerSupabase } from '@/lib/supabase-server'
import CommercialPanel from '@/components/admin/CommercialPanel'

export default async function CommercialPage() {
  const supabase = await createServerSupabase()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const monthStart = `${year}-${String(month).padStart(2,'0')}-01`
  const monthEnd = `${year}-${String(month).padStart(2,'0')}-31`

  const [{ data: deals }, { data: activities }, { data: goals }, { data: team }] = await Promise.all([
    supabase.from('deals').select('*').order('created_at', { ascending: false }),
    supabase.from('sales_activities').select('*').order('done_at', { ascending: false }),
    supabase.from('sales_goals').select('*').eq('month', month).eq('year', year),
    supabase.from('team_members').select('*').eq('active', true).order('name'),
  ])

  return <CommercialPanel deals={deals ?? []} activities={activities ?? []} goals={goals ?? []} team={team ?? []} month={month} year={year} />
}
