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
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors mr-2"
            >
              <ArrowLeft size={13} /> Voltar ao admin
            </Link>
          )}
          <div className="w-7 h-7 bg-brand-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xs">v4</span>
          </div>
          <span className="font-medium text-gray-900 text-sm">{clientName}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 hidden sm:block">{userEmail}</span>
          <button onClick={logout} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 text-xs">
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>
    </header>
  )
}
