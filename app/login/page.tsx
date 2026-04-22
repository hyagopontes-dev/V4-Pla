'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebug('')

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    setDebug(JSON.stringify({ 
      hasSession: !!data.session, 
      hasUser: !!data.user,
      errorMsg: error?.message ?? null,
      errorCode: error?.status ?? null,
    }, null, 2))

    if (error || !data.session) {
      setError(error?.message ?? 'Sem sessão retornada.')
      setLoading(false)
      return
    }

    setDebug(prev => prev + '\n\n✅ Login OK — redirecionando...')
    window.location.replace('/')
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
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            {debug && (
              <pre className="text-xs bg-gray-100 p-3 rounded-lg overflow-auto text-gray-700 max-h-48">
                {debug}
              </pre>
            )}
            <button type="submit" disabled={loading}
              className="btn-primary w-full justify-center flex disabled:opacity-60">
              {loading ? 'Verificando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
