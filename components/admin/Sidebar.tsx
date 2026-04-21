'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users } from 'lucide-react'
import clsx from 'clsx'

const nav = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
]

export default function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 min-h-screen bg-gray-900 flex flex-col">
      <div className="p-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">v4</span>
          </div>
          <div>
            <p className="text-white font-semibold text-sm">v4 Company</p>
            <p className="text-gray-500 text-xs">Admin</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
              pathname === href || (href !== '/admin' && pathname.startsWith(href))
                ? 'bg-brand-500 text-white'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            )}
          >
            <Icon size={16} /> {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
