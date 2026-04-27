import { NextRequest, NextResponse } from 'next/server'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, account_id, date_preset } = body

    // Debug: log what we received
    console.log('[Google Ads] body keys:', Object.keys(body))
    console.log('[Google Ads] access_token present:', !!access_token, 'length:', access_token?.length ?? 0)
    console.log('[Google Ads] account_id:', account_id)
    console.log('[Google Ads] devToken present:', !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN)

    if (!access_token || !account_id) {
      return NextResponse.json({ 
        error: `Token ou Customer ID ausente. token=${!!access_token}(len=${access_token?.length ?? 0}), id=${account_id ?? 'undefined'}` 
      }, { status: 400 })
    }

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken) {
      return NextResponse.json({ 
        error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado no servidor' 
      }, { status: 500 })
    }

    const cleanId = account_id.replace(/-/g, '')
    const cacheKey = `google-${cleanId}-${date_preset}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

    // Calcular datas baseado no preset
    const today = new Date()
    let startDate: string
    let endDate: string

    const pad = (n: number) => String(n).padStart(2,'0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    switch (date_preset) {
      case 'today':
        startDate = endDate = fmt(today)
        break
      case 'yesterday':
        const yd = new Date(today); yd.setDate(yd.getDate()-1)
        startDate = endDate = fmt(yd)
        break
      case 'last_7d':
        const w = new Date(today); w.setDate(w.getDate()-7)
        startDate = fmt(w); endDate = fmt(today)
        break
      case 'last_30d':
        const m30 = new Date(today); m30.setDate(m30.getDate()-30)
        startDate = fmt(m30); endDate = fmt(today)
        break
      case 'last_month':
        const lm = new Date(today.getFullYear(), today.getMonth()-1, 1)
        const lme = new Date(today.getFullYear(), today.getMonth(), 0)
        startDate = fmt(lm); endDate = fmt(lme)
        break
      default: // this_month
        startDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`
        endDate = fmt(today)
    }

    const query = `
      SELECT
        metrics.cost_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpm,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.all_conversions,
        metrics.view_through_conversions
      FROM customer
      WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'
    `.trim()

    const res = await fetch(
      `https://googleads.googleapis.com/v16/customers/${cleanId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'developer-token': devToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    )

    const raw = await res.json()

    if (!res.ok) {
      const errMsg = raw.error?.message ?? raw.error?.status ?? JSON.stringify(raw).slice(0,200)
      return NextResponse.json({ error: errMsg }, { status: res.status })
    }

    const rows = raw.results ?? []
    if (!rows.length) {
      return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })
    }

    // Agregar todas as linhas
    let totalCost = 0, totalImpressions = 0, totalClicks = 0
    let totalConversions = 0, totalCostPerConv = 0
    let totalCtr = 0, totalCpm = 0, count = 0

    for (const row of rows) {
      const m = row.metrics ?? {}
      totalCost += (m.costMicros ?? 0) / 1_000_000
      totalImpressions += m.impressions ?? 0
      totalClicks += m.clicks ?? 0
      totalConversions += m.conversions ?? 0
      totalCtr += (m.ctr ?? 0) * 100
      totalCpm += (m.averageCpm ?? 0) / 1_000_000
      count++
    }

    const avgCtr = count > 0 ? totalCtr / count : 0
    const avgCpm = count > 0 ? totalCpm / count : 0
    const cpr = totalConversions > 0 ? totalCost / totalConversions : 0

    const result = {
      platform: 'google',
      period: `${startDate} → ${endDate}`,
      overview: {
        spend: totalCost,
        impressions: totalImpressions,
        clicks: totalClicks,
        ctr: avgCtr,
        cpm: avgCpm,
        reach: 0,
        frequency: 0,
        conversions: Math.round(totalConversions),
        cpr,
        result_label: 'Conversões',
        link_clicks: totalClicks,
        landing_page_views: 0,
        messages_started: 0,
        video_views: 0,
      },
      campaigns: [],
      daily: [],
    }

    CACHE.set(cacheKey, { data: result, ts: Date.now() })
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Erro interno' }, { status: 500 })
  }
}
