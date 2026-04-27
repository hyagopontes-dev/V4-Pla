import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://graph.facebook.com/v19.0'
const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

// Mapeia action_type para label legível
function getResultLabel(objective: string, actions: any[]): { value: number; label: string; costLabel: string } {
  const OBJ_MAP: Record<string, { types: string[]; label: string }> = {
    OUTCOME_LEADS:         { types: ['lead','onsite_conversion.lead_grouped'], label: 'Leads' },
    OUTCOME_SALES:         { types: ['purchase','offsite_conversion.fb_pixel_purchase'], label: 'Compras' },
    OUTCOME_TRAFFIC:       { types: ['link_click','landing_page_view'], label: 'Cliques no link' },
    OUTCOME_ENGAGEMENT:    { types: ['post_engagement','page_engagement'], label: 'Engajamentos' },
    OUTCOME_APP_PROMOTION: { types: ['app_install','mobile_app_install'], label: 'Instalações' },
    OUTCOME_AWARENESS:     { types: ['reach'], label: 'Alcance' },
    LEAD_GENERATION:       { types: ['lead','onsite_conversion.lead_grouped'], label: 'Leads' },
    CONVERSIONS:           { types: ['purchase','offsite_conversion.fb_pixel_purchase','lead'], label: 'Conversões' },
    MESSAGES:              { types: ['onsite_conversion.messaging_conversation_started_7d','onsite_conversion.messaging_first_reply'], label: 'Conversas' },
    LINK_CLICKS:           { types: ['link_click'], label: 'Cliques no link' },
    POST_ENGAGEMENT:       { types: ['post_engagement'], label: 'Engajamentos' },
    VIDEO_VIEWS:           { types: ['video_view','thruplay'], label: 'Visualizações' },
    REACH:                 { types: ['reach'], label: 'Alcance' },
    PAGE_LIKES:            { types: ['like'], label: 'Curtidas na página' },
  }

  const mapping = OBJ_MAP[objective] ?? { types: ['link_click','lead','purchase'], label: 'Resultados' }

  let bestAction = null
  for (const type of mapping.types) {
    const found = actions.find((a: any) => a.action_type === type)
    if (found) { bestAction = found; break }
  }

  return {
    value: bestAction ? parseInt(bestAction.value) : 0,
    label: mapping.label,
    costLabel: `Custo por ${mapping.label.toLowerCase().replace('s','').trim()}`,
  }
}

function getCostPerResult(objective: string, costPerActions: any[]): number {
  const OBJ_MAP: Record<string, string[]> = {
    OUTCOME_LEADS:         ['lead','onsite_conversion.lead_grouped'],
    OUTCOME_SALES:         ['purchase','offsite_conversion.fb_pixel_purchase'],
    OUTCOME_TRAFFIC:       ['link_click','landing_page_view'],
    OUTCOME_ENGAGEMENT:    ['post_engagement'],
    LEAD_GENERATION:       ['lead','onsite_conversion.lead_grouped'],
    CONVERSIONS:           ['purchase','offsite_conversion.fb_pixel_purchase','lead'],
    MESSAGES:              ['onsite_conversion.messaging_conversation_started_7d'],
    LINK_CLICKS:           ['link_click'],
    POST_ENGAGEMENT:       ['post_engagement'],
    VIDEO_VIEWS:           ['video_view','thruplay'],
  }

  const types = OBJ_MAP[objective] ?? ['link_click','lead','purchase']
  for (const type of types) {
    const found = costPerActions.find((a: any) => a.action_type === type)
    if (found) return parseFloat(found.value)
  }
  return 0
}

export async function POST(request: NextRequest) {
  const { access_token, account_id, date_preset, time_range } = await request.json()
  if (!access_token || !account_id)
    return NextResponse.json({ error: 'Token ou Account ID ausente' }, { status: 400 })

  const cleanId = account_id.replace('act_', '')
  const cacheKey = `meta-${cleanId}-${date_preset}-${JSON.stringify(time_range)}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

  const baseParams: Record<string,string> = { access_token }
  if (date_preset) baseParams.date_preset = date_preset
  if (time_range) baseParams.time_range = JSON.stringify(time_range)

  // Busca conta, campanhas e diário em paralelo
  const [accountRes, campaignInsightsRes, campaignListRes, dailyRes] = await Promise.all([
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({
      ...baseParams, level: 'account',
      fields: 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,date_start,date_stop,unique_clicks'
    })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({
      ...baseParams, level: 'campaign', limit: '20',
      fields: 'campaign_id,campaign_name,objective,spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type'
    })}`),
    fetch(`${BASE}/act_${cleanId}/campaigns?${new URLSearchParams({
      access_token, fields: 'id,name,objective,status', limit: '50'
    })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({
      ...baseParams, level: 'account', time_increment: '1',
      fields: 'spend,impressions,clicks,actions,date_start'
    })}`),
  ])

  const [accountRaw, campaignInsightsRaw, campaignListRaw, dailyRaw] = await Promise.all([
    accountRes.json(), campaignInsightsRes.json(), campaignListRes.json(), dailyRes.json()
  ])

  if (accountRaw.error) return NextResponse.json({ error: accountRaw.error.message }, { status: 400 })

  const insight = accountRaw.data?.[0]
  if (!insight) return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  // Mapeia campaign_id → objective
  const objectiveMap: Record<string, string> = {}
  ;(campaignListRaw.data ?? []).forEach((c: any) => { objectiveMap[c.id] = c.objective })

  // Overview
  const CONV_TYPES = ['purchase','lead','offsite_conversion.fb_pixel_purchase','complete_registration','onsite_conversion.lead_grouped']
  const actions = insight.actions ?? []
  const costPer = insight.cost_per_action_type ?? []
  const convAction = actions.find((a: any) => CONV_TYPES.includes(a.action_type))
  const cprAction = costPer.find((a: any) => CONV_TYPES.includes(a.action_type))
  const linkClicks = actions.find((a: any) => a.action_type === 'link_click')
  const landingViews = actions.find((a: any) => a.action_type === 'landing_page_view')
  const msgStarts = actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
  const videoViews = actions.find((a: any) => a.action_type === 'video_view')

  // Campanhas com objetivo e resultado correto
  const campaigns = (campaignInsightsRaw.data ?? []).map((c: any) => {
    const objective = c.objective ?? objectiveMap[c.campaign_id] ?? 'OUTCOME_TRAFFIC'
    const cActions = c.actions ?? []
    const cCostPer = c.cost_per_action_type ?? []
    const result = getResultLabel(objective, cActions)
    const cpr = getCostPerResult(objective, cCostPer)

    return {
      name: c.campaign_name,
      objective,
      spend: parseFloat(c.spend ?? '0'),
      impressions: parseInt(c.impressions ?? '0'),
      clicks: parseInt(c.clicks ?? '0'),
      ctr: parseFloat(c.ctr ?? '0'),
      cpm: parseFloat(c.cpm ?? '0'),
      reach: parseInt(c.reach ?? '0'),
      result_value: result.value,
      result_label: result.label,
      result_cost: cpr,
      result_cost_label: result.costLabel,
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
