'use client'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

interface Props { clientName: string; userEmail: string }

export default function ClientNav({ clientName, userEmail }: Props) {
  const router = useRouter()
  const supabase = createClient()

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
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
