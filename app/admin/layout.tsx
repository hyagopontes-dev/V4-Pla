import { redirect } from 'next/navigation'
import { createServerSupabase } from '@/lib/supabase-server'
import AdminSidebar from '@/components/admin/Sidebar'
import { cookies } from 'next/headers'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()
  const supabaseCookies = allCookies.filter(c => c.name.includes('supabase') || c.name.includes('sb-'))
  
  console.log('AdminLayout cookies count:', allCookies.length)
  console.log('AdminLayout supabase cookies:', supabaseCookies.map(c => c.name))

  const supabase = await createServerSupabase()
  const { data: { user }, error } = await supabase.auth.getUser()

  console.log('AdminLayout user:', user?.id ?? 'NULL', 'error:', error?.message ?? 'none')

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  console.log('AdminLayout role:', profile?.role ?? 'NULL')

  if (profile?.role !== 'admin') redirect('/dashboard')

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">{children}</div>
      </main>
    </div>
  )
}
