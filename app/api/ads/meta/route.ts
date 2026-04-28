import { NextRequest, NextResponse } from 'next/server'

const BASE = 'https://graph.facebook.com/v19.0'
const CACHE = new Map<string, { data: any; ts: number }>()
const TTL = 5 * 60 * 1000

const ACTION_LABELS: Record<string, string> = {
  'lead': 'Leads', 'onsite_conversion.lead_grouped': 'Leads',
  'purchase': 'Compras', 'offsite_conversion.fb_pixel_purchase': 'Compras',
  'omni_purchase': 'Compras', 'complete_registration': 'Cadastros',
  'link_click': 'Cliques no link', 'landing_page_view': 'Views de landing page',
  'onsite_conversion.messaging_conversation_started_7d': 'Conversas iniciadas',
  'onsite_conversion.messaging_first_reply': 'Respostas no chat',
  'post_engagement': 'Engajamentos', 'video_view': 'Views de vídeo',
  'thruplay': 'ThruPlays', 'view_content': 'View Content',
  'add_to_cart': 'Add to Cart', 'initiate_checkout': 'Initiate Checkout',
  'offsite_conversion.fb_pixel_view_content': 'View Content',
  'offsite_conversion.fb_pixel_add_to_cart': 'Add to Cart',
  'offsite_conversion.fb_pixel_initiate_checkout': 'Initiate Checkout',
}

const OBJECTIVE_PRIORITY: Record<string, string[]> = {
  OUTCOME_LEADS: ['lead','onsite_conversion.lead_grouped'],
  OUTCOME_SALES: ['purchase','offsite_conversion.fb_pixel_purchase','omni_purchase'],
  OUTCOME_TRAFFIC: ['landing_page_view','link_click'],
  OUTCOME_ENGAGEMENT: ['post_engagement','video_view'],
  LEAD_GENERATION: ['lead','onsite_conversion.lead_grouped'],
  CONVERSIONS: ['purchase','offsite_conversion.fb_pixel_purchase','lead','omni_purchase'],
  MESSAGES: ['onsite_conversion.messaging_conversation_started_7d','onsite_conversion.messaging_first_reply'],
  LINK_CLICKS: ['landing_page_view','link_click'],
  VIDEO_VIEWS: ['thruplay','video_view'],
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
  const PREFER = ['lead','purchase','omni_purchase','onsite_conversion.messaging_conversation_started_7d','landing_page_view','link_click']
  for (const type of PREFER) {
    const action = actions.find((a: any) => a.action_type === type)
    if (action && parseInt(action.value ?? '0') > 0) {
      const costAction = costPerActions.find((a: any) => a.action_type === type)
      return { value: parseInt(action.value), label: ACTION_LABELS[type] ?? type, cost: costAction ? parseFloat(costAction.value) : 0 }
    }
  }
  return { value: 0, label: 'Resultados', cost: 0 }
}

function getActionValue(actions: any[], type: string): number {
  const a = actions.find((a: any) => a.action_type === type || a.action_type === `offsite_conversion.fb_pixel_${type}`)
  return a ? parseInt(a.value ?? '0') : 0
}

function getActionCost(costPer: any[], type: string): number {
  const a = costPer.find((a: any) => a.action_type === type || a.action_type === `offsite_conversion.fb_pixel_${type}`)
  return a ? parseFloat(a.value ?? '0') : 0
}

function buildTimeRange(date_preset: string): { preset?: string; range?: { since: string; until: string }; prevRange: { since: string; until: string } } {
  const today = new Date()
  const pad = (n: number) => String(n).padStart(2,'0')
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

  if (date_preset === 'this_week') {
    const day = today.getDay()
    const monday = addDays(today, -(day === 0 ? 6 : day - 1))
    const range = { since: fmt(monday), until: fmt(today) }
    const days = Math.ceil((today.getTime() - monday.getTime()) / 86400000)
    const prevRange = { since: fmt(addDays(monday, -7)), until: fmt(addDays(monday, -7 + days)) }
    return { range, prevRange }
  }
  if (date_preset === 'last_week') {
    const day = today.getDay()
    const lastMon = addDays(today, -(day === 0 ? 6 : day - 1) - 7)
    const lastSun = addDays(lastMon, 6)
    const range = { since: fmt(lastMon), until: fmt(lastSun) }
    const prevRange = { since: fmt(addDays(lastMon, -7)), until: fmt(addDays(lastSun, -7)) }
    return { range, prevRange }
  }
  if (date_preset?.startsWith('since:')) {
    const parts = date_preset.split(',')
    const since = parts[0]?.replace('since:','')
    const until = parts[1]?.replace('until:','')
    if (since && until) {
      const s = new Date(since), u = new Date(until)
      const days = Math.ceil((u.getTime() - s.getTime()) / 86400000)
      const range = { since, until }
      const prevRange = { since: fmt(addDays(s, -(days+1))), until: fmt(addDays(s, -1)) }
      return { range, prevRange }
    }
  }

  // Standard presets — compute prev period
  const presetDays: Record<string, number> = {
    today: 1, yesterday: 1, last_7d: 7, last_30d: 30,
    this_month: today.getDate(), last_month: new Date(today.getFullYear(), today.getMonth(), 0).getDate(),
    last_quarter: 90,
  }
  const days = presetDays[date_preset] ?? 30
  const prevRange = { since: fmt(addDays(today, -(days * 2))), until: fmt(addDays(today, -days - 1)) }
  return { preset: date_preset ?? 'this_month', prevRange }
}

function parseInsight(insight: any) {
  const actions = insight?.actions ?? []
  const costPer = insight?.cost_per_action_type ?? []
  const convValue = insight?.action_values?.find((a: any) => a.action_type === 'offsite_conversion.fb_pixel_purchase' || a.action_type === 'purchase' || a.action_type === 'omni_purchase')
  const spend = parseFloat(insight?.spend ?? '0')
  const purchases = getActionValue(actions, 'purchase') || getActionValue(actions, 'omni_purchase')
  const roas = spend > 0 && convValue ? parseFloat(convValue.value) / spend : 0
  const clicks = parseInt(insight?.clicks ?? '0')

  // CPL: usar apenas o valor mais alto de cada tipo para evitar duplicatas
  // lead_grouped já inclui lead, então usar apenas lead_grouped se existir, senão lead
  const leadsFormRaw = getActionValue(actions, 'onsite_conversion.lead_grouped') || getActionValue(actions, 'lead')
  // messaging_conversation_started_7d é o mais completo para conversas
  const leadsMessagesRaw = getActionValue(actions, 'onsite_conversion.messaging_conversation_started_7d')
  // complete_registration separado (não duplica com lead)
  const leadsRegistrationRaw = getActionValue(actions, 'omni_complete_registration') || getActionValue(actions, 'complete_registration')

  const leadsForm = leadsFormRaw
  const leadsMessages = leadsMessagesRaw
  // Só conta cadastro se não for o mesmo evento que lead
  const leadsRegistration = leadsRegistrationRaw > leadsFormRaw ? leadsRegistrationRaw - leadsFormRaw : 0

  // Total de leads sem duplicatas
  const totalLeads = leadsForm + leadsMessages + leadsRegistration

  // Para compatibilidade
  const messages = leadsMessages

  return {
    spend,
    impressions: parseInt(insight?.impressions ?? '0'),
    clicks,
    reach: parseInt(insight?.reach ?? '0'),
    ctr: parseFloat(insight?.ctr ?? '0'),
    cpm: parseFloat(insight?.cpm ?? '0'),
    cpc: parseFloat(insight?.cpc ?? '0'),
    frequency: parseFloat(insight?.frequency ?? '0'),
    purchases,
    cpa: purchases > 0 ? spend / purchases : 0,
    conversion_value: convValue ? parseFloat(convValue.value) : 0,
    roas,
    leads: totalLeads,
    leads_form: leadsForm,
    leads_messages: leadsMessages,
    leads_registration: leadsRegistration,
    cpl: totalLeads > 0 ? spend / totalLeads : 0,
    messages,
    cpm_messages: messages > 0 ? spend / messages : 0,
    // Funnel
    view_content: getActionValue(actions, 'view_content'),
    add_to_cart: getActionValue(actions, 'add_to_cart'),
    initiate_checkout: getActionValue(actions, 'initiate_checkout'),
    cost_view_content: getActionCost(costPer, 'offsite_conversion.fb_pixel_view_content'),
    cost_add_to_cart: getActionCost(costPer, 'offsite_conversion.fb_pixel_add_to_cart'),
    cost_initiate_checkout: getActionCost(costPer, 'offsite_conversion.fb_pixel_initiate_checkout'),
    conv_rate_clicks_lead: clicks > 0 && totalLeads > 0 ? (totalLeads / clicks) * 100 : 0,
    conv_rate_clicks_purchase: clicks > 0 && purchases > 0 ? (purchases / clicks) * 100 : 0,
  }
}

export async function POST(request: NextRequest) {
  const { access_token, account_id, date_preset, filter_campaign_id, filter_adset_id, dashboard_type } = await request.json()
  if (!access_token || !account_id)
    return NextResponse.json({ error: 'Token ou Account ID ausente' }, { status: 400 })

  const cleanId = account_id.replace('act_', '')
  const cacheKey = `meta-v7-${cleanId}-${date_preset}-${filter_campaign_id ?? ''}-${filter_adset_id ?? ''}-${dashboard_type}`
  const cached = CACHE.get(cacheKey)
  if (cached && Date.now() - cached.ts < TTL) return NextResponse.json(cached.data)

  const { preset, range, prevRange } = buildTimeRange(date_preset ?? 'this_month')

  function makeParams(overrides: Record<string,string> = {}): Record<string,string> {
    const p: Record<string,string> = { access_token }
    if (preset) p.date_preset = preset
    if (range) p.time_range = JSON.stringify(range)
    return { ...p, ...overrides }
  }

  function makePrevParams(overrides: Record<string,string> = {}): Record<string,string> {
    return { access_token, time_range: JSON.stringify(prevRange), ...overrides }
  }

  const allFields = 'spend,impressions,clicks,ctr,cpm,cpc,reach,frequency,actions,cost_per_action_type,action_values,date_start,date_stop'
  const campaignFields = `campaign_id,campaign_name,objective,${allFields}`
  const adsetFields = `adset_id,adset_name,objective,${allFields}`
  const adFields = `ad_id,ad_name,${allFields}`

  // Determine breakdown level
  let breakdownFields = campaignFields
  let breakdownLevel = 'campaign'
  let breakdownBase = `${BASE}/act_${cleanId}/insights`

  if (filter_adset_id) { breakdownBase = `${BASE}/${filter_adset_id}/insights`; breakdownFields = adFields; breakdownLevel = 'ad' }
  else if (filter_campaign_id) { breakdownBase = `${BASE}/${filter_campaign_id}/insights`; breakdownFields = adsetFields; breakdownLevel = 'adset' }

  const [accountRes, prevAccountRes, breakdownRes, campaignListRes, dailyRes] = await Promise.all([
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...makeParams(), level: 'account', fields: allFields })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...makePrevParams(), level: 'account', fields: 'spend,impressions,clicks,ctr,cpm,reach,frequency,actions,cost_per_action_type,action_values' })}`),
    fetch(`${breakdownBase}?${new URLSearchParams({ ...makeParams(), level: breakdownLevel, limit: '20', fields: breakdownFields })}`),
    fetch(`${BASE}/act_${cleanId}/campaigns?${new URLSearchParams({ access_token, fields: 'id,name,objective', limit: '50' })}`),
    fetch(`${BASE}/act_${cleanId}/insights?${new URLSearchParams({ ...makeParams(), level: 'account', time_increment: '1', fields: 'spend,impressions,clicks,actions,action_values,date_start' })}`),
  ])

  const [accountRaw, prevAccountRaw, breakdownRaw, campaignListRaw, dailyRaw] = await Promise.all([
    accountRes.json(), prevAccountRes.json(), breakdownRes.json(), campaignListRes.json(), dailyRes.json()
  ])

  if (accountRaw.error) return NextResponse.json({ error: accountRaw.error.message }, { status: 400 })
  const insight = accountRaw.data?.[0]
  if (!insight) return NextResponse.json({ error: 'Sem dados para este período' }, { status: 404 })

  const prevInsight = prevAccountRaw.data?.[0]
  const current = parseInsight(insight)
  const previous = parseInsight(prevInsight)

  const objMap: Record<string, string> = {}
  ;(campaignListRaw.data ?? []).forEach((c: any) => { objMap[c.id] = c.objective })
  const campaignList = (campaignListRaw.data ?? []).map((c: any) => ({ id: c.id, name: c.name, objective: c.objective }))

  const rows = (breakdownRaw.data ?? []).map((c: any) => {
    const objective = c.objective ?? objMap[c.campaign_id] ?? 'OUTCOME_TRAFFIC'
    const parsed = parseInsight(c)
    // Per campaign: use parsed.leads (already sums all types) as the lead count
    const result = getBestResult(objective, c.actions ?? [], c.cost_per_action_type ?? [])
    // Campaign classification for ecommerce
    let classification = ''
    if (dashboard_type === 'ecommerce' && parsed.roas > 0) {
      classification = parsed.roas >= 3 ? 'Escalar' : parsed.roas >= 1.5 ? 'Manter' : 'Pausar'
    }
    return {
      id: c.campaign_id ?? c.adset_id ?? c.ad_id,
      name: c.campaign_name ?? c.adset_name ?? c.ad_name,
      objective, classification,
      ...parsed,
      result_value: result.value,
      result_label: result.label,
    }
  })

  const daily = (dailyRaw.data ?? []).map((d: any) => {
    const dActions = d.actions ?? []
    const dConvValue = d.action_values?.find((a: any) => ['purchase','offsite_conversion.fb_pixel_purchase','omni_purchase'].includes(a.action_type))
    const dSpend = parseFloat(d.spend ?? '0')
    const dPurchases = getActionValue(dActions, 'purchase') || getActionValue(dActions, 'omni_purchase')
    const dLeads = getActionValue(dActions, 'lead') || getActionValue(dActions, 'onsite_conversion.lead_grouped')
    return {
      date: d.date_start,
      spend: dSpend,
      impressions: parseInt(d.impressions ?? '0'),
      clicks: parseInt(d.clicks ?? '0'),
      purchases: dPurchases,
      leads: dLeads,
      roas: dSpend > 0 && dConvValue ? parseFloat(dConvValue.value) / dSpend : 0,
    }
  }).sort((a: any, b: any) => a.date.localeCompare(b.date))

  const response = {
    platform: 'meta',
    dashboard_type: dashboard_type ?? 'inside_sales',
    period: `${insight.date_start} → ${insight.date_stop}`,
    prev_period: `${prevRange.since} → ${prevRange.until}`,
    campaign_list: campaignList,
    current, previous,
    campaigns: rows,
    daily,
  }

  CACHE.set(cacheKey, { data: response, ts: Date.now() })
  return NextResponse.json(response)
}
