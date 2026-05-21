import { createServerSupabase } from '@/lib/supabase-server'
import TaskBoard from '@/components/admin/TaskBoard'

export default async function TasksPage() {
  const supabase = await createServerSupabase()
  const [{ data: clients }, { data: tasks }, { data: team }] = await Promise.all([
    supabase.from('clients').select('id, name, slug').eq('active', true).order('name'),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
    supabase.from('team_members').select('*').eq('active', true).order('name'),
  ])
  return <TaskBoard clients={clients ?? []} initialTasks={tasks ?? []} team={team ?? []} />
}
