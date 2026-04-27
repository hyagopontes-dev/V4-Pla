import { NextRequest, NextResponse } from 'next/server'

const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const { access_token, customer_id, start_date, end_date } = await request.json()
  if (!access_token || !customer_id)
    return NextResponse.json({ error: 'Token ou Customer ID ausente' }, { status: 400 })

  const cleanId = customer_id.replace(/-/g, '')
  const cacheKey = `google-${cleanId}-${start_date}-${end_date}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL)
    return NextResponse.json(cached.data)

  const today = new Date()
  const firstDay = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-01`
  const lastDay = new Date(today.getFullYear(), today.getMonth()+1, 0)
  const lastDayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(lastDay.getDate()).padStart(2,'0')}`

  const query = `
    SELECT
      metrics.cost_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.ctr,
      metrics.average_cpm,
      metrics.conversions,
      metrics.cost_per_conversion
    FROM customer
    WHERE segments.date BETWEEN '${start_date ?? firstDay}' AND '${end_date ?? lastDayStr}'
  `

  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken)
    return NextResponse.json({ error: 'GOOGLE_ADS_DEVELOPER_TOKEN não configurado' }, { status: 500 })

  const res = await fetch(
    `https://googleads.googleapis.com/v16/customers/${cleanId}/googleAds:search`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'developer-token': devToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: query.trim() }),
    }
  )

  const raw = await res.json()
  if (!res.ok)
    return NextResponse.json({ error: raw.error?.message ?? 'Erro Google Ads' }, { status: res.status })

  const row = raw.results?.[0]
  if (!row)
    return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  const m = row.metrics
  const result = {
    platform: 'google',
    period: `${start_date ?? firstDay} → ${end_date ?? lastDayStr}`,
    spend: (m.costMicros ?? 0) / 1_000_000,
    impressions: m.impressions ?? 0,
    clicks: m.clicks ?? 0,
    ctr: (m.ctr ?? 0) * 100,
    cpm: (m.averageCpm ?? 0) / 1_000_000,
    conversions: m.conversions ?? 0,
    cpr: (m.costPerConversion ?? 0) / 1_000_000,
    reach: 0,
  }

  CACHE.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json(result)
}
