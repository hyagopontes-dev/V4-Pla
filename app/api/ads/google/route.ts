import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  if (!clientId || !clientSecret) return null
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refreshToken, client_id: clientId, client_secret: clientSecret }),
  })
  const data = await res.json()
  if (!res.ok || !data.access_token) return null
  return data.access_token
}

async function gaqlQuery(accessToken: string, customerId: string, devToken: string, query: string, mccId?: string) {
  const attempts = [
    { ver: 'v18', withLogin: true }, { ver: 'v18', withLogin: false },
    { ver: 'v17', withLogin: true }, { ver: 'v17', withLogin: false },
    { ver: 'v16', withLogin: false },
  ]
  for (const { ver, withLogin } of attempts) {
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${accessToken}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    }
    // MCC: login-customer-id = MCC ID, customer = client account ID
    if (mccId) headers['login-customer-id'] = mccId.replace(/-/g, '')
    else if (withLogin) headers['login-customer-id'] = customerId
    const url = `https://googleads.googleapis.com/${ver}/customers/${customerId}/googleAds:search`
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query }) })
    const text = await res.text()
    if (text.trim().startsWith('<')) continue
    let raw: any
    try { raw = JSON.parse(text) } catch { continue }
    if (res.status === 401) return { error: 'TOKEN_EXPIRED', status: 401 }
    if (res.status === 403) return { error: raw.error?.message ?? 'Acesso negado. Verifique o Developer Token.', status: 403 }
    if (res.status === 404) continue
    if (!res.ok) return { error: raw.error?.message ?? JSON.stringify(raw).slice(0, 200), status: res.status }
    return { data: raw.results ?? [], status: 200 }
  }
  return { error: 'Endpoint não encontrado. Certifique-se que a Google Ads API está ativa no Google Cloud Console e que o Developer Token tem Standard Access.', status: 404 }
}

function parseRows(rows: any[]) {
  let spend = 0, impressions = 0, clicks = 0, conversions = 0, convValue = 0
  let ctrTotal = 0, cpmTotal = 0, cpcTotal = 0, n = 0
  for (const row of rows) {
    const m = row.metrics ?? {}
    spend += (m.costMicros ?? 0) / 1_000_000
    impressions += parseInt(m.impressions ?? '0')
    clicks += parseInt(m.clicks ?? '0')
    conversions += parseFloat(m.conversions ?? '0')
    convValue += (m.conversionsValue ?? 0)
    ctrTotal += parseFloat(m.ctr ?? '0') * 100
    cpmTotal += (m.averageCpm ?? 0) / 1_000_000
    cpcTotal += (m.averageCpc ?? 0) / 1_000_000
    n++
  }
  return {
    spend: Math.round(spend * 100) / 100,
    impressions,
    clicks,
    conversions: Math.round(conversions),
    conversion_value: Math.round(convValue * 100) / 100,
    ctr: n > 0 ? ctrTotal / n : 0,
    cpm: n > 0 ? cpmTotal / n : 0,
    cpc: n > 0 ? cpcTotal / n : 0,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 && convValue > 0 ? convValue / spend : 0,
  }
}

function buildDateRange(date_preset: string) {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  if (date_preset?.startsWith('since:')) {
    const parts = date_preset.split(',')
    const since = parts[0].replace('since:','')
    const until = parts[1].replace('until:','')
    const days = Math.ceil((new Date(until).getTime() - new Date(since).getTime()) / 86400000)
    return {
      start: since, end: until,
      prevStart: fmt(addDays(new Date(since), -(days+1))),
      prevEnd: fmt(addDays(new Date(since), -1)),
    }
  }

  const ranges: Record<string, { start: string; end: string; prevStart: string; prevEnd: string }> = {}
  const todayStr = fmt(today)

  const thisMonStart = fmt(new Date(today.getFullYear(), today.getMonth(), 1))
  const lastMonEnd = fmt(new Date(today.getFullYear(), today.getMonth(), 0))
  const lastMonStart = fmt(new Date(today.getFullYear(), today.getMonth()-1, 1))
  const last7 = fmt(addDays(today, -7))
  const last14 = fmt(addDays(today, -14))
  const last30 = fmt(addDays(today, -30))
  const last60 = fmt(addDays(today, -60))
  const yest = fmt(addDays(today, -1))
  const dayBefore = fmt(addDays(today, -2))

  const dayOfMonth = today.getDate()
  const prevMonthSameDay = fmt(addDays(new Date(today.getFullYear(), today.getMonth()-1, 1), dayOfMonth-1))

  switch (date_preset) {
    case 'today':      return { start: todayStr, end: todayStr, prevStart: yest, prevEnd: yest }
    case 'yesterday':  return { start: yest, end: yest, prevStart: dayBefore, prevEnd: dayBefore }
    case 'this_week': {
      const day = today.getDay()
      const mon = fmt(addDays(today, -(day === 0 ? 6 : day-1)))
      const prevMon = fmt(addDays(new Date(mon), -7))
      const prevSun = fmt(addDays(new Date(mon), -1))
      return { start: mon, end: todayStr, prevStart: prevMon, prevEnd: prevSun }
    }
    case 'last_week': {
      const day = today.getDay()
      const lastMon = fmt(addDays(today, -(day === 0 ? 6 : day-1) - 7))
      const lastSun = fmt(addDays(new Date(lastMon), 6))
      const prevMon = fmt(addDays(new Date(lastMon), -7))
      return { start: lastMon, end: lastSun, prevStart: prevMon, prevEnd: fmt(addDays(new Date(lastMon), -1)) }
    }
    case 'last_7d':    return { start: last7, end: todayStr, prevStart: last14, prevEnd: fmt(addDays(today, -8)) }
    case 'last_30d':   return { start: last30, end: todayStr, prevStart: last60, prevEnd: fmt(addDays(today, -31)) }
    case 'last_month': return { start: lastMonStart, end: lastMonEnd, prevStart: fmt(new Date(today.getFullYear(), today.getMonth()-2, 1)), prevEnd: fmt(new Date(today.getFullYear(), today.getMonth()-1, 0)) }
    case 'last_quarter': return { start: fmt(addDays(today, -90)), end: todayStr, prevStart: fmt(addDays(today, -180)), prevEnd: fmt(addDays(today, -91)) }
    default: // this_month
      return { start: thisMonStart, end: todayStr, prevStart: lastMonStart, prevEnd: prevMonthSameDay }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { access_token, account_id, date_preset, client_id: supabaseClientId, refresh_token, mcc_id } = await request.json()
    if (!account_id) return NextResponse.json({ error: 'Customer ID ausente' }, { status: 400 })
    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken) return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado' }, { status: 500 })

    const cleanId = account_id.replace(/-/g, '')
    const cacheKey = `google-v2-${cleanId}-${date_preset}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

    // Check N8N webhook cache in Supabase first
    if (supabaseClientId) {
      try {
        const supabase = await createServerSupabase()
        const { data: webhookCache } = await supabase
          .from('ads_cache')
          .select('data, fetched_at')
          .eq('client_id', supabaseClientId)
          .eq('platform', 'google')
          .eq('date_preset', date_preset ?? 'this_month')
          .single()
        if (webhookCache) {
          const age = Date.now() - new Date(webhookCache.fetched_at).getTime()
          // Use webhook cache if less than 6 hours old
          if (age < 6 * 60 * 60 * 1000) {
            const parsed = typeof webhookCache.data === 'string' ? JSON.parse(webhookCache.data) : webhookCache.data
            return NextResponse.json({ ...parsed, _source: 'n8n_webhook', _fetched_at: webhookCache.fetched_at })
          }
        }
      } catch {}
    }

    const { start, end, prevStart, prevEnd } = buildDateRange(date_preset ?? 'this_month')

    const accountQuery = `SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpm, metrics.average_cpc, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion FROM customer WHERE segments.date BETWEEN '${start}' AND '${end}'`
    const prevQuery = accountQuery.replace(`'${start}' AND '${end}'`, `'${prevStart}' AND '${prevEnd}'`)
    const campaignQuery = `SELECT campaign.id, campaign.name, campaign.advertising_channel_type, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpm, metrics.average_cpc, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion FROM campaign WHERE segments.date BETWEEN '${start}' AND '${end}' AND campaign.status = 'ENABLED' ORDER BY metrics.cost_micros DESC LIMIT 20`
    const dailyQuery = `SELECT segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.conversions FROM customer WHERE segments.date BETWEEN '${start}' AND '${end}' ORDER BY segments.date ASC`

    let token = access_token

    const mccClean = mcc_id?.replace(/-/g, '')
    async function runQuery(q: string) {
      let result = await gaqlQuery(token, cleanId, devToken!, q, mccClean)
      if (result.error === 'TOKEN_EXPIRED' || result.status === 401) {
        if (!refresh_token) return result
        const newToken = await refreshAccessToken(refresh_token)
        if (!newToken) return result
        token = newToken
        if (supabaseClientId) {
          try {
            const supabase = await createServerSupabase()
            await supabase.from('ads_integrations').update({ access_token: newToken, updated_at: new Date().toISOString() }).eq('client_id', supabaseClientId).eq('platform', 'google')
          } catch {}
        }
        return gaqlQuery(token, cleanId, devToken!, q, mccClean)
      }
      return result
    }

    const [accountRes, prevRes, campaignRes, dailyRes] = await Promise.all([
      runQuery(accountQuery), runQuery(prevQuery), runQuery(campaignQuery), runQuery(dailyQuery)
    ])

    if (accountRes.error) return NextResponse.json({ error: accountRes.error }, { status: accountRes.status ?? 500 })
    if (!accountRes.data?.length) return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

    const current = parseRows(accountRes.data)
    const previous = parseRows(prevRes.data ?? [])

    const campaigns = (campaignRes.data ?? []).map((row: any) => {
      const m = row.metrics ?? {}
      const spend = (m.costMicros ?? 0) / 1_000_000
      const conv = parseFloat(m.conversions ?? '0')
      const convVal = m.conversionsValue ?? 0
      return {
        id: row.campaign?.id,
        name: row.campaign?.name ?? 'Campanha',
        type: row.campaign?.advertisingChannelType ?? '',
        spend: Math.round(spend * 100) / 100,
        impressions: parseInt(m.impressions ?? '0'),
        clicks: parseInt(m.clicks ?? '0'),
        ctr: parseFloat(m.ctr ?? '0') * 100,
        cpm: (m.averageCpm ?? 0) / 1_000_000,
        cpc: (m.averageCpc ?? 0) / 1_000_000,
        conversions: Math.round(conv),
        conversion_value: convVal,
        cpa: conv > 0 ? spend / conv : 0,
        roas: spend > 0 && convVal > 0 ? convVal / spend : 0,
      }
    })

    const daily = (dailyRes.data ?? []).map((row: any) => ({
      date: row.segments?.date,
      spend: (row.metrics?.costMicros ?? 0) / 1_000_000,
      impressions: parseInt(row.metrics?.impressions ?? '0'),
      clicks: parseInt(row.metrics?.clicks ?? '0'),
      conversions: parseFloat(row.metrics?.conversions ?? '0'),
    }))

    const response = {
      platform: 'google',
      period: `${start} → ${end}`,
      prev_period: `${prevStart} → ${prevEnd}`,
      refreshed_token: token !== access_token ? token : undefined,
      current,
      previous,
      campaigns,
      daily,
    }

    CACHE.set(cacheKey, { data: response, ts: Date.now() })
    return NextResponse.json(response)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message ?? 'desconhecido') }, { status: 500 })
  }
}
