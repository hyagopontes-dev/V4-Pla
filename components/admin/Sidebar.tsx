'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, Sparkles, Trophy } from 'lucide-react'
import { createClient } from '@/lib/supabase'

const nav = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
  { href: '/admin/ai', label: 'IA Studio', icon: Sparkles },
  { href: '/admin/planning', label: 'Planejamento', icon: Trophy },
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
    <aside style={{ width: '220px', minHeight: '100vh', background: '#111111', borderRight: '1px solid #2A2A2A', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
      {/* Logo */}
      <div style={{ padding: '28px 24px', borderBottom: '1px solid #2A2A2A' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '0.08em', color: '#FAFAFA', lineHeight: 1 }}>
          AVH<span style={{ color: '#F5C518' }}>ANT</span>
        </div>
        <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', marginTop: '4px', fontWeight: 300 }}>
          Admin
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '2px', fontSize: '12px',
              fontWeight: active ? 500 : 400, letterSpacing: '0.03em',
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'rgba(245,197,24,0.1)' : 'transparent',
              color: active ? '#F5C518' : 'rgba(250,250,250,0.5)',
              borderLeft: active ? '2px solid #F5C518' : '2px solid transparent',
            }}>
              <Icon size={14} />
              {label}
              {href === '/admin/ai' && !active && (
                <span style={{
                  marginLeft: 'auto', fontSize: '9px', padding: '2px 6px',
                  background: 'rgba(245,197,24,0.12)', border: '1px solid rgba(245,197,24,0.25)',
                  color: '#F5C518', letterSpacing: '0.1em', borderRadius: '2px',
                  textTransform: 'uppercase'
                }}>NEW</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '12px', borderTop: '1px solid #2A2A2A' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', borderRadius: '2px', fontSize: '12px',
          color: 'rgba(250,250,250,0.3)', background: 'transparent',
          border: 'none', cursor: 'pointer', width: '100%',
          transition: 'color 0.15s', letterSpacing: '0.03em'
        }}>
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  )
}
