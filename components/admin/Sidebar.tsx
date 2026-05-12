'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, Sparkles, Trophy, CheckSquare } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ThemeToggle from './ThemeToggle'

const nav = [
  { href: '/admin', label: 'Painel', icon: LayoutDashboard },
  { href: '/admin/clients', label: 'Clientes', icon: Users },
  { href: '/admin/ai', label: 'IA Studio', icon: Sparkles },
  { href: '/admin/planning', label: 'Planejamento', icon: Trophy },
  { href: '/admin/tasks', label: 'Tarefas', icon: CheckSquare },
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
    <aside style={{
      width: '220px', minHeight: '100vh', flexShrink: 0,
      background: 'var(--bg-card)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column'
    }}>
      {/* Logo + theme toggle */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', letterSpacing: '0.08em', color: 'var(--text)', lineHeight: 1 }}>
            AVH<span style={{ color: 'var(--yellow)' }}>ANT</span>
          </div>
          <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>
            Admin
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link key={href} href={href} style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 12px', borderRadius: '2px', fontSize: '12px',
              fontWeight: active ? 600 : 400, letterSpacing: '0.03em',
              textDecoration: 'none', transition: 'all 0.15s',
              background: active ? 'var(--yellow-bg)' : 'transparent',
              color: active ? 'var(--yellow)' : 'var(--text-secondary)',
              borderLeft: `2px solid ${active ? 'var(--yellow)' : 'transparent'}`,
            }}>
              <Icon size={14} />
              {label}
              {href === '/admin/ai' && !active && (
                <span style={{
                  marginLeft: 'auto', fontSize: '9px', padding: '2px 6px',
                  background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)',
                  color: 'var(--yellow)', letterSpacing: '0.1em', borderRadius: '2px',
                  textTransform: 'uppercase'
                }}>IA</span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
        <button onClick={logout} style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '9px 12px', borderRadius: '2px', fontSize: '12px',
          color: 'var(--text-muted)', background: 'transparent',
          border: 'none', cursor: 'pointer', width: '100%',
          transition: 'color 0.15s', letterSpacing: '0.03em',
          fontFamily: "'DM Sans', sans-serif"
        }}>
          <LogOut size={14} /> Sair
        </button>
      </div>
    </aside>
  )
}
