'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut, ArrowLeft } from 'lucide-react'
import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Props { clientName: string; userEmail: string }

export default function ClientNav({ clientName, userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
        setIsAdmin(data?.role === 'admin')
      })
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header style={{
      background: '#111111', borderBottom: '1px solid #2A2A2A',
      position: 'sticky', top: 0, zIndex: 10
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 24px', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isAdmin && (
            <Link href="/admin" style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
              color: 'rgba(250,250,250,0.4)', textDecoration: 'none',
              padding: '5px 10px', border: '1px solid #2A2A2A', borderRadius: '2px',
              transition: 'color 0.15s'
            }}>
              <ArrowLeft size={11} /> Admin
            </Link>
          )}
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.08em', color: '#FAFAFA' }}>
            AVH<span style={{ color: '#F5C518' }}>ANT</span>
          </div>
          {clientName && clientName !== 'Dashboard' && (
            <>
              <div style={{ width: '1px', height: '16px', background: '#2A2A2A' }} />
              <span style={{ fontSize: '12px', color: 'rgba(250,250,250,0.5)', fontWeight: 300 }}>{clientName}</span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {userEmail && <span style={{ fontSize: '11px', color: '#888' }}>{userEmail}</span>}
          <button onClick={logout} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase',
            color: 'rgba(250,250,250,0.3)', background: 'none', border: 'none',
            cursor: 'pointer', transition: 'color 0.15s'
          }}>
            <LogOut size={12} /> Sair
          </button>
        </div>
      </div>
    </header>
  )
}
