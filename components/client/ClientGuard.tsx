'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function ClientGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, client_id, clients(slug)')
        .eq('id', session.user.id)
        .single()

      // Admin pode ver qualquer dashboard
      if (profile?.role === 'admin') {
        setAllowed(true)
        setChecking(false)
        return
      }

      // Cliente só pode ver o próprio dashboard
      const clientSlug = (profile as any)?.clients?.slug
      const requestedSlug = searchParams.get('client')

      if (!clientSlug) {
        // Cliente sem vínculo
        router.replace('/login')
        return
      }

      if (requestedSlug && requestedSlug !== clientSlug) {
        // Tentou acessar dashboard de outro cliente → redireciona para o dele
        router.replace(`/dashboard?client=${clientSlug}`)
        return
      }

      if (!requestedSlug) {
        // Sem slug na URL → redireciona para o slug correto
        router.replace(`/dashboard?client=${clientSlug}`)
        return
      }

      setAllowed(true)
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Verificando acesso...</p>
        </div>
      </div>
    )
  }

  if (!allowed) return null

  return <>{children}</>
}
