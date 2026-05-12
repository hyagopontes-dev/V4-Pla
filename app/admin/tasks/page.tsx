import { createServerSupabase } from '@/lib/supabase-server'
import TaskBoard from '@/components/admin/TaskBoard'

export default async function TasksPage() {
  const supabase = await createServerSupabase()
  const [{ data: clients }, { data: tasks }] = await Promise.all([
    supabase.from('clients').select('id, name, slug').eq('active', true).order('name'),
    supabase.from('tasks').select('*').order('created_at', { ascending: false }),
  ])
  return <TaskBoard clients={clients ?? []} initialTasks={tasks ?? []} />
}
