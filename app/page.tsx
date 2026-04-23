'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace('/login')
        return
      }
      supabase.from('profiles').select('role').eq('id', session.user.id).single().then(({ data }) => {
        router.replace(data?.role === 'admin' ? '/admin' : '/dashboard')
      })
    })
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}
