import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://graph.facebook.com/v19.0'
const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const { access_token, account_id, date_preset } = await request.json()
  if (!access_token || !account_id)
    return NextResponse.json({ error: 'Token ou Account ID ausente' }, { status: 400 })

  const cacheKey = `meta-${account_id}-${date_preset}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL)
    return NextResponse.json(cached.data)

  const fields = 'spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type,date_start,date_stop'
  const params = new URLSearchParams({
    fields, date_preset: date_preset ?? 'this_month',
    access_token, level: 'account',
  })

  const res = await fetch(`${BASE}/act_${account_id.replace('act_','')}/insights?${params}`)
  const raw = await res.json()

  if (raw.error)
    return NextResponse.json({ error: raw.error.message }, { status: 400 })

  const insight = raw.data?.[0]
  if (!insight)
    return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  const actions = insight.actions ?? []
  const costPer = insight.cost_per_action_type ?? []
  const CONV_TYPES = ['purchase','lead','offsite_conversion.fb_pixel_purchase']
  const convAction = actions.find((a: any) => CONV_TYPES.includes(a.action_type))
  const cprAction = costPer.find((a: any) => CONV_TYPES.includes(a.action_type))

  const result = {
    platform: 'meta', period: `${insight.date_start} → ${insight.date_stop}`,
    spend: parseFloat(insight.spend ?? '0'),
    impressions: parseInt(insight.impressions ?? '0'),
    clicks: parseInt(insight.clicks ?? '0'),
    ctr: parseFloat(insight.ctr ?? '0'),
    cpm: parseFloat(insight.cpm ?? '0'),
    reach: parseInt(insight.reach ?? '0'),
    conversions: convAction ? parseInt(convAction.value) : 0,
    cpr: cprAction ? parseFloat(cprAction.value) : 0,
  }

  CACHE.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json(result)
}
