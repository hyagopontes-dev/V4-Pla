import { createClient } from '@/lib/supabase-server-route'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { supabase, response } = createClient(request)

  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error || !data.user) {
    return NextResponse.redirect(new URL('/login?error=invalid', request.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single()

  const dest = profile?.role === 'admin' ? '/admin' : '/dashboard'
  
  // Copiar cookies da resposta do supabase para o redirect
  const redirectResponse = NextResponse.redirect(new URL(dest, request.url), { status: 303 })
  response.cookies.getAll().forEach(cookie => {
    redirectResponse.cookies.set(cookie.name, cookie.value)
  })
  
  return redirectResponse
}
