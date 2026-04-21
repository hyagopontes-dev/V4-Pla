import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import ClientNav from '@/components/client/ClientNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('*, clients(*)').eq('id', user.id).single()

  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')

  const client = (profile as any).clients

  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav clientName={client?.name ?? 'Dashboard'} userEmail={user.email ?? ''} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
