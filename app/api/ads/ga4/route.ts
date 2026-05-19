import { NextRequest, NextResponse } from 'next/server'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

function buildDateRange(date_preset: string) {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  if (date_preset?.startsWith('since:')) {
    const parts = date_preset.split(',')
    return { start: parts[0].replace('since:',''), end: parts[1].replace('until:','') }
  }

  const t = fmt(today)
  switch (date_preset) {
    case 'today': return { start: t, end: t }
    case 'yesterday': { const y = fmt(addDays(today,-1)); return { start: y, end: y } }
    case 'this_week': {
      const d = today.getDay()
      return { start: fmt(addDays(today, -(d===0?6:d-1))), end: t }
    }
    case 'last_week': {
      const d = today.getDay()
      const mon = addDays(today, -(d===0?6:d-1)-7)
      return { start: fmt(mon), end: fmt(addDays(mon, 6)) }
    }
    case 'last_7d': return { start: fmt(addDays(today,-7)), end: t }
    case 'last_30d': return { start: fmt(addDays(today,-30)), end: t }
    case 'last_month': {
      return {
        start: fmt(new Date(today.getFullYear(), today.getMonth()-1, 1)),
        end: fmt(new Date(today.getFullYear(), today.getMonth(), 0))
      }
    }
    case 'last_quarter': return { start: fmt(addDays(today,-90)), end: t }
    default: return { start: fmt(new Date(today.getFullYear(), today.getMonth(), 1)), end: t }
  }
}

export async function POST(request: NextRequest) {
  try {
    const { access_token, property_id, date_preset } = await request.json()

    if (!access_token || !property_id) {
      return NextResponse.json({ error: 'access_token e property_id são obrigatórios' }, { status: 400 })
    }

    const cleanProperty = property_id.replace('properties/', '')
    const cacheKey = `ga4-${cleanProperty}-${date_preset}`
    const cached = CACHE.get(cacheKey)
    if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

    const { start, end } = buildDateRange(date_preset ?? 'this_month')

    // GA4 Data API - runReport
    const reportUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${cleanProperty}:runReport`

    const reportBody = {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'sessionGoogleAdsAdNetworkType' }],
      metrics: [
        { name: 'sessions' },
        { name: 'totalUsers' },
        { name: 'screenPageViews' },
        { name: 'conversions' },
        { name: 'advertiserAdCost' },
        { name: 'advertiserAdClicks' },
        { name: 'advertiserAdImpressions' },
        { name: 'returnOnAdSpend' },
      ],
      dimensionFilter: {
        filter: {
          fieldName: 'sessionGoogleAdsAdNetworkType',
          inListFilter: { values: ['GOOGLE_SEARCH', 'DISPLAY', 'YOUTUBE_WATCH', 'SMART', 'PERFORMANCE_MAX'] }
        }
      }
    }

    // Also get daily breakdown
    const dailyBody = {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'sessions' }, { name: 'totalUsers' },
        { name: 'conversions' }, { name: 'advertiserAdCost' }, { name: 'advertiserAdClicks' }
      ],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    }

    // Channel breakdown
    const channelBody = {
      dateRanges: [{ startDate: start, endDate: end }],
      dimensions: [{ name: 'sessionGoogleAdsAdNetworkType' }],
      metrics: [
        { name: 'sessions' }, { name: 'conversions' },
        { name: 'advertiserAdCost' }, { name: 'advertiserAdClicks' }
      ]
    }

    const headers = { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'application/json' }

    const [reportRes, dailyRes, channelRes] = await Promise.all([
      fetch(reportUrl, { method: 'POST', headers, body: JSON.stringify(reportBody) }),
      fetch(reportUrl, { method: 'POST', headers, body: JSON.stringify(dailyBody) }),
      fetch(reportUrl, { method: 'POST', headers, body: JSON.stringify(channelBody) }),
    ])

    if (reportRes.status === 401) return NextResponse.json({ error: 'TOKEN_EXPIRED' }, { status: 401 })
    if (reportRes.status === 403) {
      const err = await reportRes.json()
      return NextResponse.json({ error: err.error?.message ?? 'Sem permissão para acessar o GA4' }, { status: 403 })
    }
    if (!reportRes.ok) {
      const err = await reportRes.json()
      return NextResponse.json({ error: err.error?.message ?? 'Erro ao buscar GA4' }, { status: reportRes.status })
    }

    const [reportData, dailyData, channelData] = await Promise.all([reportRes.json(), dailyRes.json(), channelRes.json()])

    // Aggregate totals
    let totalSessions = 0, totalUsers = 0, totalPageViews = 0, totalConversions = 0
    let totalAdCost = 0, totalAdClicks = 0, totalAdImpressions = 0, totalRoas = 0, roasCount = 0

    for (const row of reportData.rows ?? []) {
      const vals = row.metricValues ?? []
      totalSessions += parseInt(vals[0]?.value ?? '0')
      totalUsers += parseInt(vals[1]?.value ?? '0')
      totalPageViews += parseInt(vals[2]?.value ?? '0')
      totalConversions += parseFloat(vals[3]?.value ?? '0')
      totalAdCost += parseFloat(vals[4]?.value ?? '0')
      totalAdClicks += parseInt(vals[5]?.value ?? '0')
      totalAdImpressions += parseInt(vals[6]?.value ?? '0')
      const roas = parseFloat(vals[7]?.value ?? '0')
      if (roas > 0) { totalRoas += roas; roasCount++ }
    }

    const daily = (dailyData.rows ?? []).map((row: any) => {
      const d = row.dimensionValues?.[0]?.value ?? ''
      const v = row.metricValues ?? []
      const dateStr = `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6,8)}`
      return {
        date: dateStr,
        sessions: parseInt(v[0]?.value ?? '0'),
        users: parseInt(v[1]?.value ?? '0'),
        conversions: parseFloat(v[2]?.value ?? '0'),
        spend: parseFloat(v[3]?.value ?? '0'),
        clicks: parseInt(v[4]?.value ?? '0'),
      }
    })

    const channels = (channelData.rows ?? []).map((row: any) => {
      const name = row.dimensionValues?.[0]?.value ?? ''
      const v = row.metricValues ?? []
      const cost = parseFloat(v[2]?.value ?? '0')
      const conv = parseFloat(v[1]?.value ?? '0')
      return {
        name: name.replace(/_/g, ' '),
        sessions: parseInt(v[0]?.value ?? '0'),
        conversions: conv,
        spend: cost,
        clicks: parseInt(v[3]?.value ?? '0'),
        cpa: conv > 0 ? cost / conv : 0,
      }
    }).filter((c: any) => c.sessions > 0 || c.spend > 0)

    const response = {
      platform: 'ga4',
      period: `${start} → ${end}`,
      current: {
        sessions: totalSessions,
        users: totalUsers,
        page_views: totalPageViews,
        conversions: Math.round(totalConversions),
        spend: Math.round(totalAdCost * 100) / 100,
        clicks: totalAdClicks,
        impressions: totalAdImpressions,
        ctr: totalAdImpressions > 0 ? (totalAdClicks / totalAdImpressions) * 100 : 0,
        cpc: totalAdClicks > 0 ? totalAdCost / totalAdClicks : 0,
        cpa: totalConversions > 0 ? totalAdCost / totalConversions : 0,
        roas: roasCount > 0 ? totalRoas / roasCount : 0,
        conv_rate: totalSessions > 0 ? (totalConversions / totalSessions) * 100 : 0,
      },
      channels,
      daily,
    }

    CACHE.set(cacheKey, { data: response, ts: Date.now() })
    return NextResponse.json(response)
  } catch (e: any) {
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message ?? 'desconhecido') }, { status: 500 })
  }
}
