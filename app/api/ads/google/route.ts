import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.log('[Google] Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET')
    return null
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
    }),
  })

  const data = await res.json()
  if (!res.ok || !data.access_token) {
    console.log('[Google] refresh failed:', JSON.stringify(data))
    return null
  }

  console.log('[Google] token refreshed successfully')
  return data.access_token
}

async function callGoogleAds(accessToken: string, customerId: string, devToken: string, startDate: string, endDate: string) {
  const query = `SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpm, metrics.conversions, metrics.cost_per_conversion FROM customer WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`

  // Try different combinations of version and headers
  const attempts = [
    { ver: 'v17', withLogin: true },
    { ver: 'v17', withLogin: false },
    { ver: 'v16', withLogin: true },
    { ver: 'v16', withLogin: false },
    { ver: 'v15', withLogin: false },
  ]

  for (const { ver, withLogin } of attempts) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    }
    if (withLogin) headers['login-customer-id'] = customerId

    const url = `https://googleads.googleapis.com/${ver}/customers/${customerId}/googleAds:search`
    console.log(`[Google] trying ${ver} withLogin=${withLogin} url=${url}`)

    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query }) })
    const text = await res.text()
    console.log(`[Google] ${ver} status:`, res.status, 'html:', text.trim().startsWith('<'), 'preview:', text.slice(0,100))

    if (text.trim().startsWith('<')) continue

    let raw: any
    try { raw = JSON.parse(text) } catch { continue }

    if (res.status === 401) return { error: 'TOKEN_EXPIRED', status: 401 }
    if (res.status === 403) {
      const msg = raw.error?.message ?? JSON.stringify(raw).slice(0,200)
      return { error: msg, status: 403 }
    }
    if (res.status === 404) continue
    if (!res.ok) {
      const errMsg = raw.error?.message ?? raw.error?.details?.[0]?.errors?.[0]?.message ?? JSON.stringify(raw).slice(0, 300)
      console.log(`[Google] error from ${ver}:`, errMsg)
      return { error: errMsg, status: res.status }
    }

    console.log(`[Google] SUCCESS with ${ver} withLogin=${withLogin}`)
    return { data: raw.results ?? [], status: 200 }
  }

  return { error: 'Endpoint não encontrado. Verifique se a Google Ads API está ativada no Google Cloud Console e se o Developer Token tem Standard Access.', status: 404 }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, account_id, date_preset, client_id: supabaseClientId, refresh_token } = body

    if (!account_id) return NextResponse.json({ error: 'Customer ID ausente' }, { status: 400 })

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken) return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado' }, { status: 500 })

    const cleanId = account_id.replace(/-/g, '')

    const cacheKey = `google-${cleanId}-${date_preset}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

    // Calcular datas
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
    let startDate: string, endDate = fmt(today)

    switch (date_preset) {
      case 'today': startDate = fmt(today); break
      case 'yesterday': { const d = new Date(today); d.setDate(d.getDate()-1); startDate = endDate = fmt(d); break }
      case 'last_7d': { const d = new Date(today); d.setDate(d.getDate()-7); startDate = fmt(d); break }
      case 'last_30d': { const d = new Date(today); d.setDate(d.getDate()-30); startDate = fmt(d); break }
      case 'last_month': { const s = new Date(today.getFullYear(), today.getMonth()-1, 1); const e = new Date(today.getFullYear(), today.getMonth(), 0); startDate = fmt(s); endDate = fmt(e); break }
      default: startDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`
    }

    let currentToken = access_token
    let result = await callGoogleAds(currentToken, cleanId, devToken, startDate, endDate)

    // Token expirado — tenta refresh automático
    if (result.error === 'TOKEN_EXPIRED' || result.status === 401) {
      console.log('[Google] token expired, attempting refresh...')

      if (!refresh_token) {
        return NextResponse.json({
          error: 'Token expirado. Adicione o refresh_token nas integrações para renovação automática.'
        }, { status: 401 })
      }

      const newToken = await refreshAccessToken(refresh_token)
      if (!newToken) {
        return NextResponse.json({
          error: 'Não foi possível renovar o token. Verifique as variáveis GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET.'
        }, { status: 401 })
      }

      // Salva novo token no banco
      if (supabaseClientId) {
        try {
          const supabase = await createServerSupabase()
          await supabase.from('ads_integrations')
            .update({ access_token: newToken, updated_at: new Date().toISOString() })
            .eq('client_id', supabaseClientId)
            .eq('platform', 'google')
          console.log('[Google] new token saved to DB')
        } catch (e) {
          console.log('[Google] failed to save new token:', e)
        }
      }

      currentToken = newToken
      result = await callGoogleAds(currentToken, cleanId, devToken, startDate, endDate)
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status ?? 500 })
    }

    const rows = result.data ?? []
    let spend = 0, impressions = 0, clicks = 0, conversions = 0, ctrSum = 0, cpmSum = 0, n = 0

    for (const row of rows) {
      const m = row.metrics ?? {}
      spend += (m.costMicros ?? 0) / 1_000_000
      impressions += m.impressions ?? 0
      clicks += m.clicks ?? 0
      conversions += m.conversions ?? 0
      ctrSum += (m.ctr ?? 0) * 100
      cpmSum += (m.averageCpm ?? 0) / 1_000_000
      n++
    }

    const response = {
      platform: 'google',
      period: `${startDate} → ${endDate}`,
      refreshed_token: currentToken !== access_token ? currentToken : undefined,
      overview: {
        spend, impressions, clicks,
        ctr: n > 0 ? ctrSum / n : 0,
        cpm: n > 0 ? cpmSum / n : 0,
        reach: 0, frequency: 0,
        conversions: Math.round(conversions),
        cpr: conversions > 0 ? spend / conversions : 0,
        result_label: 'Conversões',
        link_clicks: clicks,
        landing_page_views: 0,
        messages_started: 0,
        video_views: 0,
      },
      campaigns: [],
      daily: [],
    }

    CACHE.set(cacheKey, { data: response, ts: Date.now() })
    return NextResponse.json(response)

  } catch (e: any) {
    console.log('[Google] caught error:', e?.message)
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message ?? 'desconhecido') }, { status: 500 })
  }
}
