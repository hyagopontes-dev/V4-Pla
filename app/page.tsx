import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'

export default async function Home() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  redirect(profile?.role === 'admin' ? '/admin' : '/dashboard')
}
