import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://graph.facebook.com/v19.0'
const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

const ACTION_LABELS: Record<string, string> = {
  'lead': 'Leads',
  'onsite_conversion.lead_grouped': 'Leads',
  'purchase': 'Compras',
  'offsite_conversion.fb_pixel_purchase': 'Compras',
  'complete_registration': 'Cadastros',
  'link_click': 'Cliques no link',
  'landing_page_view': 'Views de landing page',
  'onsite_conversion.messaging_conversation_started_7d': 'Conversas iniciadas',
  'onsite_conversion.messaging_first_reply': 'Respostas no chat',
  'onsite_conversion.messaging_welcome_message_view': 'Mensagens abertas',
  'onsite_conversion.messaging_user_depth_2_message_send': 'Conversas aprofundadas',
  'post_engagement': 'Engajamentos',
  'page_engagement': 'Engajamentos',
  'video_view': 'Views de vídeo',
  'thruplay': 'ThruPlays',
  'app_install': 'Instalações',
  'mobile_app_install': 'Instalações',
  'omni_complete_registration': 'Cadastros',
  'omni_initiated_checkout': 'Checkouts iniciados',
  'omni_purchase': 'Compras',
  'omni_add_to_cart': 'Adições ao carrinho',
  'like': 'Curtidas',
  'comment': 'Comentários',
  'share': 'Compartilhamentos',
}

const OBJECTIVE_PRIORITY: Record<string, string[]> = {
  OUTCOME_LEADS: ['lead','onsite_conversion.lead_grouped','omni_complete_registration'],
  OUTCOME_SALES: ['purchase','offsite_conversion.fb_pixel_purchase','omni_purchase'],
  OUTCOME_TRAFFIC: ['landing_page_view','link_click'],
  OUTCOME_ENGAGEMENT: ['post_engagement','page_engagement','video_view'],
  OUTCOME_APP_PROMOTION: ['app_install','mobile_app_install'],
  OUTCOME_AWARENESS: ['video_view','thruplay','reach'],
  LEAD_GENERATION: ['lead','onsite_conversion.lead_grouped'],
  CONVERSIONS: ['purchase','offsite_conversion.fb_pixel_purchase','lead','omni_purchase'],
  MESSAGES: ['onsite_conversion.messaging_conversation_started_7d','onsite_conversion.messaging_first_reply','onsite_conversion.messaging_welcome_message_view'],
  OUTCOME_ENGAGEMENT_MESSAGING: ['onsite_conversion.messaging_conversation_started_7d','onsite_conversion.messaging_first_reply'],
  LINK_CLICKS: ['landing_page_view','link_click'],
  POST_ENGAGEMENT: ['post_engagement','video_view'],
  VIDEO_VIEWS: ['thruplay','video_view'],
  PAGE_LIKES: ['like'],
  REACH: ['reach'],
}

function getBestResult(objective: string, actions: any[], costPerActions: any[]) {
  const priority = OBJECTIVE_PRIORITY[objective] ?? []
  for (const type of priority) {
    const action = actions.find((a: any) => a.action_type === type)
    if (action && parseInt(action.value) > 0) {
      const costAction = costPerActions.find((a: any) => a.action_type === type)
      return { value: parseInt(action.value), label: ACTION_LABELS[type] ?? type, cost: costAction ? parseFloat(costAction.value) : 0 }
    }
  }
  const PREFER = ['lead','purchase','complete_registration','omni_purchase','omni_initiated_checkout','onsite_conversion.messaging_conversation_started_7d','onsite_conversion.messaging_first_reply','landing_page_view','link_click']
  const SKIP = ['reach','impression','frequency','post_reaction','onsite_conversion.post_save','onsite_conversion.post_share']
  for (const type of PREFER) {
    const action = actions.find((a: any) => a.action_type === type)
    if (action && parseInt(action.value ?? '0') > 0) {
      const costAction = costPerActions.find((a: any) => a.action_type === type)
      return { value: parseInt(action.value), label: ACTION_LABELS[type] ?? type, cost: costAction ? parseFloat(costAction.value) : 0 }
    }
  }
  let best: any = null; let bestVal = 0
  for (const action of actions) {
    if (SKIP.some(s => action.action_type.includes(s))) continue
    const val = parseInt(action.value ?? '0')
    if (val > bestVal) { bestVal = val; best = action }
  }
  if (best) {
    const costAction = costPerActions.find((a: any) => a.action_type === best.action_type)
    return { value: bestVal, label: ACTION_LABELS[best.action_type] ?? best.action_type, cost: costAction ? parseFloat(costAction.value) : 0 }
  }
  return { value: 0, label: 'Resultados', cost: 0 }
}

export async function POST(request: NextRequest) {
  const { access_token, account_id, date_preset, filter_campaign_id, filter_adset_id } = await request.json()
  if (!access_token || !account_id)
    return NextResponse.json({ error: 'Token ou Account ID ausente' }, { status: 400 })

  const cleanId = account_id.replace('act_', '')
  const cacheKey = `meta-v4-${cleanId}-${date_preset}-${filter_campaign_id ?? ''}-${filter_adset_id ?? ''}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

  // Convert custom presets to time_range for Meta API
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2,'0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  
  let metaDatePreset: string | null = null
  let metaTimeRange: { since: string; until: string } | null = null

  if (date_preset === 'this_week') {
    const day = today.getDay() // 0=sun
    const monday = new Date(today); monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1))
    metaTimeRange = { since: fmt(monday), until: fmt(today) }
  } else if (date_preset === 'last_week') {
    const day = today.getDay()
    const lastMonday = new Date(today); lastMonday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) - 7)
    const lastSunday = new Date(lastMonday); lastSunday.setDate(lastMonday.getDate() + 6)
    metaTimeRange = { since: fmt(lastMonday), until: fmt(lastSunday) }
  } else if (date_preset && date_preset.includes('since:')) {
    // Custom range: "since:2026-04-01,until:2026-04-27"
    const parts = date_preset.split(',')
    const since = parts[0]?.replace('since:','')
    const until = parts[1]?.replace('until:','')
    if (since && until) metaTimeRange = { since, until }
  } else {
    metaDatePreset = date_preset ?? 'this_month'
  }

  const baseParams: Record<string,string> = { access_token }
  if (metaDatePreset) baseParams.date_preset = metaDatePreset
  if (metaTimeRange) baseParams.time_range = JSON.stringify(metaTimeRange)

  // Determine level and ID based on filters
  let insightsUrl: string
  let campaignInsightsUrl: string
  let adsetInsightsUrl: string
  let adInsightsUrl: string

  if (filter_adset_id) {
    insightsUrl = `${BASE}/${filter_adset_id}/insights?${new URLSearchParams({ ...baseParams, level: 'adset', fields: 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,date_start,date_stop' })}`
    adInsightsUrl = `${BASE}/${filter_adset_id}/insights?${new URLSearchParams({ ...baseParams, level: 'ad', limit: '20', fields: 'ad_id,ad_name,spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type' })}`
    campaignInsightsUrl = ''
    adsetInsightsUrl = ''
  } else if (filter_campaign_id) {
    insightsUrl = `${BASE}/${filter_campaign_id}/insights?${new URLSearchParams({ ...baseParams, fields: 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,date_start,date_stop' })}`
    adsetInsightsUrl = `${BASE}/${filter_campaign_id}/insights?${new URLSearchParams({ ...baseParams, level: 'adset', limit: '20', fields: 'adset_id,adset_name,objective,spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type' })}`
    campaignInsightsUrl = ''
    adInsightsUrl = ''
  } else {
    insightsUrl = `${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, level: 'account', fields: 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,date_start,date_stop' })}`
    campaignInsightsUrl = `${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, level: 'campaign', limit: '20', fields: 'campaign_id,campaign_name,objective,spend,impressions,clicks,ctr,cpm,reach,actions,cost_per_action_type' })}`
    adsetInsightsUrl = ''
    adInsightsUrl = ''
  }

  const campaignListUrl = `${BASE}/act_${cleanId}/campaigns?${new URLSearchParams({ access_token, fields: 'id,name,objective', limit: '50' })}`
  const dailyUrl = `${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...baseParams, level: 'account', time_increment: '1', fields: 'spend,impressions,clicks,actions,date_start' })}`

  const fetches: Promise<Response>[] = [fetch(insightsUrl), fetch(campaignListUrl), fetch(dailyUrl)]
  if (campaignInsightsUrl) fetches.push(fetch(campaignInsightsUrl))
  if (adsetInsightsUrl) fetches.push(fetch(adsetInsightsUrl))
  if (adInsightsUrl) fetches.push(fetch(adInsightsUrl))

  const responses = await Promise.all(fetches)
  const jsons = await Promise.all(responses.map(r => r.json()))

  const [accountRaw, campaignListRaw, dailyRaw, breakdownRaw] = jsons

  if (accountRaw.error) return NextResponse.json({ error: accountRaw.error.message }, { status: 400 })
  const insight = accountRaw.data?.[0]
  if (!insight) return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  const objMap: Record<string, string> = {}
  ;(campaignListRaw.data ?? []).forEach((c: any) => { objMap[c.id] = c.objective })

  // Build campaign list for filters
  const campaignList = (campaignListRaw.data ?? []).map((c: any) => ({ id: c.id, name: c.name, objective: c.objective }))

  const actions = insight.actions ?? []
  const costPer = insight.cost_per_action_type ?? []
  const linkClicks = actions.find((a: any) => a.action_type === 'link_click')
  const landingViews = actions.find((a: any) => a.action_type === 'landing_page_view')
  const msgStarts = actions.find((a: any) => a.action_type === 'onsite_conversion.messaging_conversation_started_7d')
  const videoViews = actions.find((a: any) => a.action_type === 'video_view')
  const overviewResult = getBestResult('CONVERSIONS', actions, costPer)

  // Build rows (campaigns, adsets, or ads)
  const breakdownData = breakdownRaw?.data ?? []
  const rows = breakdownData.map((c: any) => {
    const objective = c.objective ?? objMap[c.campaign_id] ?? 'OUTCOME_TRAFFIC'
    const result = getBestResult(objective, c.actions ?? [], c.cost_per_action_type ?? [])
    return {
      id: c.campaign_id ?? c.adset_id ?? c.ad_id,
      name: c.campaign_name ?? c.adset_name ?? c.ad_name,
      objective,
      spend: parseFloat(c.spend ?? '0'),
      impressions: parseInt(c.impressions ?? '0'),
      clicks: parseInt(c.clicks ?? '0'),
      ctr: parseFloat(c.ctr ?? '0'),
      cpm: parseFloat(c.cpm ?? '0'),
      reach: parseInt(c.reach ?? '0'),
      result_value: result.value,
      result_label: result.label,
      result_cost: result.value > 0 ? parseFloat(c.spend ?? '0') / result.value : 0,
    }
  })

  // Adsets for filter options (when viewing campaign)
  let adsetList: any[] = []
  if (filter_campaign_id && adsetInsightsUrl === '' && breakdownData.length) {
    adsetList = breakdownData.map((a: any) => ({ id: a.adset_id, name: a.adset_name }))
  }

  const daily = (dailyRaw.data ?? []).map((d: any) => {
    const dActions = d.actions ?? []
    const dResult = getBestResult('CONVERSIONS', dActions, [])
    return { date: d.date_start, spend: parseFloat(d.spend ?? '0'), impressions: parseInt(d.impressions ?? '0'), clicks: parseInt(d.clicks ?? '0'), conversions: dResult.value }
  }).sort((a: any, b: any) => a.date.localeCompare(b.date))

  const result = {
    platform: 'meta', period: `${insight.date_start} → ${insight.date_stop}`,
    campaign_list: campaignList,
    adset_list: adsetList,
    overview: {
      spend: parseFloat(insight.spend ?? '0'),
      impressions: parseInt(insight.impressions ?? '0'),
      clicks: parseInt(insight.clicks ?? '0'),
      ctr: parseFloat(insight.ctr ?? '0'),
      cpm: parseFloat(insight.cpm ?? '0'),
      reach: parseInt(insight.reach ?? '0'),
      frequency: parseFloat(insight.frequency ?? '0'),
      conversions: overviewResult.value,
      cpr: overviewResult.cost,
      result_label: overviewResult.label,
      link_clicks: linkClicks ? parseInt(linkClicks.value) : 0,
      landing_page_views: landingViews ? parseInt(landingViews.value) : 0,
      messages_started: msgStarts ? parseInt(msgStarts.value) : 0,
      video_views: videoViews ? parseInt(videoViews.value) : 0,
    },
    campaigns: rows,
    daily,
  }

  CACHE.set(cacheKey, { data: result, ts: Date.now() })
  return NextResponse.json(result)
}
