import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000 // 5 min memory cache

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { client_id, date_preset, n8n_webhook_url } = body

    if (!client_id) return NextResponse.json({ error: 'client_id obrigatório' }, { status: 400 })

    const cacheKey = `google-${client_id}-${date_preset ?? 'this_month'}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

    // Get N8N webhook URL from integration settings
    const supabase = await createServerSupabase()
    const { data: integration } = await supabase
      .from('ads_integrations')
      .select('n8n_webhook_url, account_id')
      .eq('client_id', client_id)
      .eq('platform', 'google')
      .eq('active', true)
      .single()

    const webhookUrl = n8n_webhook_url || integration?.n8n_webhook_url
    if (!webhookUrl) {
      return NextResponse.json({ error: 'N8N webhook URL não configurada. Configure nas integrações do cliente.' }, { status: 400 })
    }

    // Call N8N webhook - it will fetch Google Ads and return data
    const n8nRes = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id,
        customer_id: integration?.account_id,
        date_preset: date_preset ?? 'this_month',
      }),
    })

    if (!n8nRes.ok) {
      const errText = await n8nRes.text()
      return NextResponse.json({ error: `N8N retornou erro ${n8nRes.status}: ${errText.slice(0, 200)}` }, { status: 502 })
    }

    const data = await n8nRes.json()

    // Cache result
    CACHE.set(cacheKey, { data, ts: Date.now() })
    return NextResponse.json(data)

  } catch (e: any) {
    return NextResponse.json({ error: 'Erro: ' + (e?.message ?? 'desconhecido') }, { status: 500 })
  }
}
