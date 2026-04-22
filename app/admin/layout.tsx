import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AdminSidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase()

  const { data: { user }, error: userError } = await supabase.auth.getUser()

  console.log('AdminLayout - user:', user?.id ?? 'null', 'error:', userError?.message ?? 'none')

  if (!user) {
    console.log('AdminLayout - no user, redirecting to login')
    redirect('/login')
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  console.log('AdminLayout - profile role:', profile?.role ?? 'null', 'error:', profileError?.message ?? 'none')

  if (profile?.role !== 'admin') {
    redirect('/dashboard')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
