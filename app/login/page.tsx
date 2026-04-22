'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error || !data.session) {
      setError(error?.message ?? 'Erro ao fazer login.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
    router.push(dest)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">v4</span>
          </div>
          <h1 className="text-white text-2xl font-semibold">Bem-vindo</h1>
          <p className="text-gray-400 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="seu@email.com"
                value={email} onChange={e => setEmail(e.target.value)}
                required autoComplete="email" />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)}
                required autoComplete="current-password" />
            </div>
            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center flex disabled:opacity-60">
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
