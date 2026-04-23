'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import clsx from 'clsx'

const nav = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <aside className="w-56 min-h-screen bg-black flex flex-col">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">v4</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">v4 Company</p>
            <p className="text-white/40 text-xs">Admin</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href}
            className={clsx('flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-red-600 text-white'
                : 'text-white/60 hover:text-white hover:bg-white/10'
            )}>
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <button onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 w-full transition-colors">
          <LogOut size={16} /> Sair
        </button>
      </div>
    </aside>
  )
}
