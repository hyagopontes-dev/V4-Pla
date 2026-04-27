import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://graph.facebook.com/v19.0'
const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

export async function POST(request: NextRequest) {
  const { access_token, account_id, date_preset, time_range } = await request.json()
  if (!access_token || !account_id)
    return NextResponse.json({ error: 'Token ou Account ID ausente' }, { status: 400 })

  const cleanId = account_id.replace('act_', '')
  const cacheKey = `meta-${cleanId}-${date_preset}-${JSON.stringify(time_range)}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

  const accountFields = 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,date_start,date_stop,unique_clicks,unique_ctr'
  const campaignFields = 'campaign_name,spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type,date_start,date_stop'

  const baseParams: Record<string,string> = { access_token, level: 'account' }
  if (date_preset) baseParams.date_preset = date_preset
  if (time_range) baseParams.time_range = JSON.stringify(time_range)

  const [accountRes, campaignRes, dailyRes] = await Promise.all([
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, fields: accountFields })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, level: 'campaign', fields: campaignFields, limit: '10' })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, time_increment: '1', fields: 'spend,impressions,clicks,actions,date_start' })}`),
  ])

  const [accountRaw, campaignRaw, dailyRaw] = await Promise.all([
    accountRes.json(), campaignRes.json(), dailyRes.json()
  ])

  if (accountRaw.error) return NextResponse.json({ error: accountRaw.error.message }, { status: 400 })

  const insight = accountRaw.data?.[0]
  if (!insight) return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  const CONV_TYPES = ['purchase','lead','offsite_conversion.fb_pixel_purchase','complete_registration']
  const actions = insight.actions ?? []
  const costPer = insight.cost_per_action_type ?? []
  const convAction = actions.find((a: any) => CONV_TYPES.includes(a.action_type))
  const cprAction = costPer.find((a: any) => CONV_TYPES.includes(a.action_type))

  const linkClicks = actions.find((a: any) => a.action_type === 'link_click')
  const landingViews = actions.find((a: any) => a.action_type === 'landing_page_view')
  const msgStarts = actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
  const videoViews = actions.find((a: any) => a.action_type === 'video_view')

  const campaigns = (campaignRaw.data ?? []).map((c: any) => {
    const cActions = c.actions ?? []
    const cConv = cActions.find((a: any) => CONV_TYPES.includes(a.action_type))
    const cCost = (c.cost_per_action_type ?? []).find((a: any) => CONV_TYPES.includes(a.action_type))
    return {
      name: c.campaign_name,
      spend: parseFloat(c.spend ?? '0'),
      impressions: parseInt(c.impressions ?? '0'),
      clicks: parseInt(c.clicks ?? '0'),
      ctr: parseFloat(c.ctr ?? '0'),
      cpm: parseFloat(c.cpm ?? '0'),
      reach: parseInt(c.reach ?? '0'),
      conversions: cConv ? parseInt(cConv.value) : 0,
      cpr: cCost ? parseFloat(cCost.value) : 0,
    }
  })

  const daily = (dailyRaw.data ?? []).map((d: any) => {
    const dActions = d.actions ?? []
    const dConv = dActions.find((a: any) => CONV_TYPES.includes(a.action_type))
    return {
      date: d.date_start,
      spend: parseFloat(d.spend ?? '0'),
      impressions: parseInt(d.impressions ?? '0'),
      clicks: parseInt(d.clicks ?? '0'),
      conversions: dConv ? parseInt(dConv.value) : 0,
    }
  }).sort((a: any, b: any) => a.date.localeCompare(b.date))

  const result = {
    platform: 'meta',
    period: `${insight.date_start} → ${insight.date_stop}`,
    overview: {
      spend: parseFloat(insight.spend ?? '0'),
      impressions: parseInt(insight.impressions ?? '0'),
      clicks: parseInt(insight.clicks ?? '0'),
      ctr: parseFloat(insight.ctr ?? '0'),
      cpm: parseFloat(insight.cpm ?? '0'),
      reach: parseInt(insight.reach ?? '0'),
      frequency: parseFloat(insight.frequency ?? '0'),
      conversions: convAction ? parseInt(convAction.value) : 0,
      cpr: cprAction ? parseFloat(cprAction.value) : 0,
      link_clicks: linkClicks ? parseInt(linkClicks.value) : 0,
      landing_page_views: landingViews ? parseInt(landingViews.value) : 0,
      messages_started: msgStarts ? parseInt(msgStarts.value) : 0,
      video_views: videoViews ? parseInt(videoViews.value) : 0,
    },
    campaigns,
    daily,
  }

  CACHE.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json(result)
}
