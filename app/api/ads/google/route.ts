import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { access_token, account_id, date_preset } = body

    console.log('[Google] token length:', access_token?.length ?? 0)
    console.log('[Google] account_id:', account_id)
    console.log('[Google] devToken exists:', !!process.env.GOOGLE_ADS_DEVELOPER_TOKEN)

    if (!access_token || !account_id) {
      return NextResponse.json({
        error: `Dados ausentes: token=${!!access_token}, id=${!!account_id}`
      }, { status: 400 })
    }

    const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
    if (!devToken) {
      return NextResponse.json({
        error: 'GOOGLE_ADS_DEVELOPER_TOKEN não encontrado nas variáveis de ambiente'
      }, { status: 500 })
    }

    const cleanId = account_id.replace(/-/g, '')
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`

    let startDate: string
    let endDate = fmt(today)

    switch (date_preset) {
      case 'today': startDate = fmt(today); break
      case 'yesterday': {
        const d = new Date(today); d.setDate(d.getDate()-1)
        startDate = endDate = fmt(d); break
      }
      case 'last_7d': {
        const d = new Date(today); d.setDate(d.getDate()-7)
        startDate = fmt(d); break
      }
      case 'last_30d': {
        const d = new Date(today); d.setDate(d.getDate()-30)
        startDate = fmt(d); break
      }
      case 'last_month': {
        const s = new Date(today.getFullYear(), today.getMonth()-1, 1)
        const e = new Date(today.getFullYear(), today.getMonth(), 0)
        startDate = fmt(s); endDate = fmt(e); break
      }
      default:
        startDate = `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`
    }

    const query = `SELECT metrics.cost_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpm, metrics.conversions, metrics.cost_per_conversion FROM customer WHERE segments.date BETWEEN '${startDate}' AND '${endDate}'`

    const headers: Record<string,string> = {
      'Authorization': `Bearer ${access_token}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
      'login-customer-id': cleanId,
    }

    console.log('[Google] calling API for customer:', cleanId, 'period:', startDate, '->', endDate)

    // Try v17 then v16
    for (const ver of ['v17', 'v16']) {
      const url = `https://googleads.googleapis.com/${ver}/customers/${cleanId}/googleAds:search`
      const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ query }) })
      const raw = await res.json()

      console.log(`[Google] ${ver} status:`, res.status)
      if (res.status === 404) continue

      if (!res.ok) {
        const errMsg = raw.error?.message
          ?? raw.error?.details?.[0]?.errors?.[0]?.message
          ?? raw.error?.details?.[0]?.errorCode
          ?? JSON.stringify(raw).slice(0, 400)
        console.log('[Google] error:', errMsg)
        return NextResponse.json({ error: errMsg }, { status: res.status })
      }

      const rows = raw.results ?? []
      let spend = 0, impressions = 0, clicks = 0, conversions = 0, ctr = 0, cpm = 0, n = 0

      for (const row of rows) {
        const m = row.metrics ?? {}
        spend += (m.costMicros ?? 0) / 1_000_000
        impressions += m.impressions ?? 0
        clicks += m.clicks ?? 0
        conversions += m.conversions ?? 0
        ctr += (m.ctr ?? 0) * 100
        cpm += (m.averageCpm ?? 0) / 1_000_000
        n++
      }

      return NextResponse.json({
        platform: 'google',
        period: `${startDate} → ${endDate}`,
        overview: {
          spend,
          impressions,
          clicks,
          ctr: n > 0 ? ctr / n : 0,
          cpm: n > 0 ? cpm / n : 0,
          reach: 0,
          frequency: 0,
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
      })
    }

    return NextResponse.json({ error: 'Endpoint não encontrado nas versões v17 e v16' }, { status: 404 })

  } catch (e: any) {
    console.log('[Google] caught error:', e?.message, e?.stack?.slice(0,300))
    return NextResponse.json({ error: 'Erro interno: ' + (e?.message ?? 'desconhecido') }, { status: 500 })
  }
}
