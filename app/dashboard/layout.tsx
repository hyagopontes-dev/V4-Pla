import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import ClientNav from '@/components/client/ClientNav'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('*, clients(name)').eq('id', user.id).single()
  if (!profile) redirect('/login')
  if (profile.role === 'admin') redirect('/admin')
  const clientName = (profile as any).clients?.name ?? 'Dashboard'
  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav clientName={clientName} userEmail={user.email ?? ''} />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
