import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Webhook token for security
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? 'avhant-webhook-2026'

export async function POST(request: NextRequest) {
  try {
    // Validate secret
    const secret = request.headers.get('x-webhook-secret') ?? request.nextUrl.searchParams.get('secret')
    if (secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { client_id, platform, date_preset, data } = body

    if (!client_id || !platform || !data) {
      return NextResponse.json({ error: 'client_id, platform e data são obrigatórios' }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Upsert into ads_cache table
    const { error } = await supabase
      .from('ads_cache')
      .upsert({
        client_id,
        platform,
        date_preset: date_preset ?? 'this_month',
        data: JSON.stringify(data),
        fetched_at: new Date().toISOString(),
      }, {
        onConflict: 'client_id,platform,date_preset'
      })

    if (error) throw error

    return NextResponse.json({ ok: true, message: 'Dados recebidos com sucesso' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET to check what's cached for a client
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const platform = searchParams.get('platform') ?? 'google'
  const date_preset = searchParams.get('date_preset') ?? 'this_month'

  if (!client_id) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data } = await supabase
    .from('ads_cache')
    .select('data, fetched_at')
    .eq('client_id', client_id)
    .eq('platform', platform)
    .eq('date_preset', date_preset)
    .single()

  if (!data) return NextResponse.json({ error: 'Sem dados' }, { status: 404 })

  return NextResponse.json({
    ...JSON.parse(data.data),
    _fetched_at: data.fetched_at,
    _from_cache: true,
  })
}
