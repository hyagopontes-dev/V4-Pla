import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

// Gera PPTX usando a API do Anthropic para criar conteúdo e PptxGenJS via require
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
  const { data: p } = await supabase.from('strategic_planning').select('*').eq('client_id', clientId).single()

  if (!p) return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 })

  // Dynamic import of pptxgenjs
  const PptxGenJS = (await import('pptxgenjs')).default
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_16x9'

  const BG = '0D0D0D', RED = 'CC1414', RED_DARK = '8B0000'
  const WHITE = 'FFFFFF', GRAY = 'AAAAAA', CARD_BG = '1A1A1A', CARD_BORDER = '2A2A2A'
  const clientName = client?.name ?? 'Cliente'
  const date = new Date().toLocaleDateString('pt-BR')

  function addBase(bg = BG) {
    const s = pres.addSlide()
    s.background = { color: bg }
    return s
  }

  function topBar(s: any, title: string, phase?: string) {
    s.addShape('rect', { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
    s.addText(title, { x: 0.3, y: 0, w: 8.8, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: 'middle' })
    if (phase) {
      s.addShape('rect', { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
      s.addText(phase, { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: 'center', valign: 'middle' })
    }
  }

  function cards(s: any, fields: [string, any][], phaseNum: string) {
    const valid = fields.filter(([_, v]) => v && String(v).trim())
    if (!valid.length) return
    const cols = valid.length > 4 ? 2 : 1
    const perCol = Math.ceil(valid.length / cols)
    valid.forEach(([label, value], i) => {
      const col = cols === 2 ? Math.floor(i / perCol) : 0
      const row = cols === 2 ? i % perCol : i
      const x = col === 0 ? 0.3 : 5.2
      const colW = cols === 2 ? 4.6 : 9.4
      const y = 0.75 + row * (4.5 / perCol)
      const h = (4.5 / perCol) - 0.12
      s.addShape('rect', { x, y, w: colW, h, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
      s.addShape('rect', { x, y, w: 0.05, h, fill: { color: RED } })
      s.addText(label.toUpperCase(), { x: x + 0.15, y: y + 0.08, w: colW - 0.2, h: 0.22, color: RED, fontSize: 8, bold: true, charSpacing: 1 })
      s.addText(String(value).slice(0, 400), { x: x + 0.15, y: y + 0.32, w: colW - 0.2, h: h - 0.4, color: WHITE, fontSize: 10, valign: 'top', wrap: true })
    })
  }

  function sectionHeader(emoji: string, title: string, subtitle: string, num: string) {
    const s = addBase()
    s.addShape('rect', { x: 0, y: 0, w: 0.5, h: 5.625, fill: { color: RED } })
    s.addText(`FASE ${num}`, { x: 0.7, y: 1.1, w: 6, h: 0.35, color: RED, fontSize: 11, bold: true, charSpacing: 4 })
    s.addText(emoji, { x: 0.7, y: 1.5, w: 1.2, h: 1.2, fontSize: 48 })
    s.addText(title.toUpperCase(), { x: 0.7, y: 2.8, w: 8.5, h: 0.7, color: WHITE, fontSize: 30, bold: true })
    s.addText(subtitle, { x: 0.7, y: 3.55, w: 7, h: 0.45, color: GRAY, fontSize: 13, italic: true })
  }

  // COVER
  const cover = addBase()
  cover.addShape('rect', { x: 0, y: 0, w: 0.55, h: 5.625, fill: { color: RED } })
  cover.addShape('rect', { x: 0.55, y: 3.4, w: 9.45, h: 0.04, fill: { color: RED } })
  cover.addText('PLANEJAMENTO', { x: 0.85, y: 1.1, w: 8, h: 0.7, color: GRAY, fontSize: 17, bold: true, charSpacing: 6 })
  cover.addText('ESTRATÉGICO', { x: 0.85, y: 1.75, w: 8, h: 1.1, color: WHITE, fontSize: 42, bold: true, charSpacing: 2 })
  cover.addText(clientName.toUpperCase(), { x: 0.85, y: 3.55, w: 7, h: 0.5, color: RED, fontSize: 15, bold: true, charSpacing: 3 })
  cover.addText(date, { x: 0.85, y: 4.25, w: 4, h: 0.35, color: GRAY, fontSize: 11 })

  // SUMÁRIO
  const sum = addBase()
  topBar(sum, 'SUMÁRIO')
  const phaseList = [
    ['Fase 1','Diagnóstico Inicial'], ['Fase 2','Análise de Mercado'],
    ['Fase 3','Benchmark de Concorrentes'], ['Fase 4','ICP e Grid de Público'],
    ['Fase 5','Checklist Operacional'], ['Fase 6','Fast Traffic'],
    ['Fase 7','Acessos'], ['Fase 8','Identidade Visual'],
    ['Fase 9','Budget de Mídia'], ['Fase 10','Metas e Próximos Passos'],
  ]
  phaseList.forEach(([num, title], i) => {
    const col = i < 5 ? 0 : 1
    const row = i < 5 ? i : i - 5
    const x = col === 0 ? 0.3 : 5.2
    const y = 0.75 + row * 0.88
    sum.addShape('rect', { x, y, w: 4.6, h: 0.75, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
    sum.addShape('rect', { x, y, w: 0.05, h: 0.75, fill: { color: RED } })
    sum.addText(num, { x: x + 0.18, y: y + 0.06, w: 1.5, h: 0.28, color: RED, fontSize: 9, bold: true })
    sum.addText(title, { x: x + 0.18, y: y + 0.38, w: 4.2, h: 0.28, color: WHITE, fontSize: 11 })
  })

  // STATUS
  if (p.gargalo_atual || p.proximo_passo) {
    const st = addBase()
    topBar(st, '⚡  STATUS DA OPERAÇÃO')
    if (p.gargalo_atual) {
      st.addShape('rect', { x: 0.3, y: 0.75, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: 'AA6600', width: 1 } })
      st.addShape('rect', { x: 0.3, y: 0.75, w: 4.5, h: 0.06, fill: { color: 'AA6600' } })
      st.addText('⚠️  GARGALO ATUAL', { x: 0.5, y: 0.9, w: 4.1, h: 0.32, color: 'FFAA00', fontSize: 11, bold: true })
      st.addText(p.gargalo_atual, { x: 0.5, y: 1.3, w: 4.0, h: 3.6, color: WHITE, fontSize: 12, wrap: true, valign: 'top' })
    }
    if (p.proximo_passo) {
      st.addShape('rect', { x: 5.2, y: 0.75, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: '006622', width: 1 } })
      st.addShape('rect', { x: 5.2, y: 0.75, w: 4.5, h: 0.06, fill: { color: '006622' } })
      st.addText('→  PRÓXIMO PASSO OBRIGATÓRIO', { x: 5.4, y: 0.9, w: 4.1, h: 0.32, color: '44EE44', fontSize: 11, bold: true })
      st.addText(p.proximo_passo, { x: 5.4, y: 1.3, w: 4.0, h: 3.6, color: WHITE, fontSize: 12, wrap: true, valign: 'top' })
    }
  }

  // FASE 1
  sectionHeader('🔍', 'Diagnóstico Inicial', 'Pesquisa de Mercado', '1')
  const s1 = addBase(); topBar(s1, '🔍  DIAGNÓSTICO INICIAL', 'FASE 1')
  cards(s1, [['Quem compra?',p.p1_quem_compra],['Por que compra?',p.p1_por_que_compra],['De quem compra?',p.p1_de_quem_compra],['Quanto paga?',p.p1_quanto_paga],['Onde está?',p.p1_onde_esta],['Como escalar?',p.p1_como_escalar]], '1')

  // FASE 2
  sectionHeader('📊', 'Análise de Mercado', 'Presença Digital', '2')
  const s2 = addBase(); topBar(s2, '📊  ANÁLISE DE MERCADO', 'FASE 2')
  cards(s2, [['Posicionamento',p.p2_posicionamento],['Autoridade digital',p.p2_autoridade],['Tráfego',p.p2_trafego],['Anúncios',p.p2_anuncios],['Redes sociais',p.p2_redes_sociais],['Reputação',p.p2_reputacao],['Processo comercial',p.p2_processo_comercial],['Pontos críticos',p.p2_pontos_criticos]], '2')

  // FASE 3
  sectionHeader('🏆', 'Benchmark de Concorrentes', 'Análise competitiva', '3')
  const s3 = addBase(); topBar(s3, '🏆  BENCHMARK DE CONCORRENTES', 'FASE 3')
  cards(s3, [['Concorrentes diretos',p.p3b_concorrentes_diretos],['Concorrentes indiretos',p.p3b_concorrentes_indiretos],['Ofertas deles',p.p3b_oferta],['Ticket médio',p.p3b_ticket_medio],['Diferenciais',p.p3b_diferenciais],['Fraquezas',p.p3b_reclamacoes],['Oportunidade',p.p3b_oportunidade]], '3')

  // FASE 4
  sectionHeader('🎯', 'ICP e Grid de Público', 'Identificação do cliente ideal', '4')
  const s4 = addBase(); topBar(s4, '🎯  ICP E GRID DE PÚBLICO', 'FASE 4')
  cards(s4, [['Quem é?',p.p3_quem_e_publico],['Dores',p.p3_dores],['Desejos',p.p3_desejos],['Objeções',p.p3_objecoes],['Gatilhos',p.p3_gatilhos],['Onde está?',p.p3_onde_esta],['Como comunicar?',p.p3_como_comunicar]], '4')

  // FASE 5
  sectionHeader('🔗', 'Checklist Operacional', 'Links e Estrutura', '5')
  const s5 = addBase(); topBar(s5, '🔗  CHECKLIST OPERACIONAL', 'FASE 5')
  cards(s5, [['Instagram',p.p4_instagram],['Facebook',p.p4_facebook],['Domínio',p.p4_dominio],['YouTube',p.p4_youtube],['Conta de anúncio',p.p4_conta_anuncio],['Hospedagem',p.p4_hospedagem],['WhatsApp',p.p4_whatsapp],['CRM',p.p4_crm],['Landing Pages',p.p4_landing_pages]], '5')

  // FASE 6
  sectionHeader('⚡', 'Fast Traffic', 'Preparação para lançamento', '6')
  const s6 = addBase(); topBar(s6, '⚡  FAST TRAFFIC', 'FASE 6')
  cards(s6, [['Criativos solicitados',p.p5_criativos],['Provas sociais',p.p5_provas_sociais],['Verba disponível',p.p5_verba]], '6')

  // FASE 7
  sectionHeader('🔐', 'Acessos', 'Controle operacional', '7')
  if (p.p6_link_planilha) {
    const s7 = addBase(); topBar(s7, '🔐  ACESSOS', 'FASE 7')
    s7.addShape('rect', { x: 0.5, y: 1.1, w: 9, h: 1.2, fill: { color: CARD_BG }, line: { color: RED, width: 1 } })
    s7.addText('PLANILHA DE ACESSOS', { x: 0.7, y: 1.25, w: 6, h: 0.32, color: RED, fontSize: 10, bold: true, charSpacing: 2 })
    s7.addText(p.p6_link_planilha, { x: 0.7, y: 1.6, w: 8.5, h: 0.35, color: WHITE, fontSize: 10, hyperlink: { url: p.p6_link_planilha } })
  }

  // FASE 8
  sectionHeader('🎨', 'Identidade Visual', 'Assets e materiais da marca', '8')
  const s8 = addBase(); topBar(s8, '🎨  IDENTIDADE VISUAL', 'FASE 8')
  const checks = [['Logo',p.p7_logo],['Manual',p.p7_manual],['Paleta',p.p7_paleta],['Fontes',p.p7_fontes],['Criativos anteriores',p.p7_criativos_anteriores],['Vídeos',p.p7_videos],['Fotos',p.p7_fotos],['Materiais',p.p7_materiais]]
  checks.forEach(([label, val], i) => {
    const col = i < 4 ? 0 : 1; const row = i < 4 ? i : i - 4
    const x = col === 0 ? 0.3 : 5.2; const y = 0.75 + row * 1.1
    s8.addShape('rect', { x, y, w: 4.6, h: 0.95, fill: { color: val ? '0D2A0D' : CARD_BG }, line: { color: val ? '006622' : CARD_BORDER, width: 0.5 } })
    s8.addShape('rect', { x, y, w: 0.45, h: 0.95, fill: { color: val ? '006622' : '333333' } })
    s8.addText(val ? '✓' : '✗', { x, y, w: 0.45, h: 0.95, color: WHITE, fontSize: 16, bold: true, align: 'center', valign: 'middle' })
    s8.addText(String(label), { x: x + 0.55, y: y + 0.25, w: 3.9, h: 0.45, color: val ? WHITE : GRAY, fontSize: 11 })
  })
  const links8 = [['Logo',p.p7_link_logo],['Manual',p.p7_link_manual],['Criativos',p.p7_link_criativos],['Fotos',p.p7_link_fotos]].filter(([_,v]) => v)
  if (links8.length) {
    const s8b = addBase(); topBar(s8b, '🔗  LINKS — IDENTIDADE VISUAL', 'FASE 8')
    cards(s8b, links8 as [string,any][], '8')
  }

  // FASE 9
  sectionHeader('💰', 'Budget de Mídia', 'Planejamento financeiro', '9')
  const s9 = addBase(); topBar(s9, '💰  BUDGET DE MÍDIA', 'FASE 9')
  const budgets = [['Verba mensal',p.p9_verba_mensal],['Verba diária',p.p9_verba_diaria]].filter(([_,v]) => v)
  budgets.forEach(([label, val], i) => {
    const x = 0.3 + i * 4.85
    s9.addShape('rect', { x, y: 0.75, w: 4.5, h: 1.4, fill: { color: RED } })
    s9.addText(String(label).toUpperCase(), { x, y: 0.85, w: 4.5, h: 0.3, color: 'FFD0D0', fontSize: 9, bold: true, align: 'center', charSpacing: 2 })
    s9.addText(String(val), { x, y: 1.1, w: 4.5, h: 0.95, color: WHITE, fontSize: 26, bold: true, align: 'center', valign: 'middle' })
  })
  cards(s9, [['Canais',p.p9_canais],['Divisão por canal',p.p9_divisao_canal],['Divisão por campanha',p.p9_divisao_campanha]].filter(([_,v]) => v) as [string,any][], '9')

  // FASE 10
  sectionHeader('🏁', 'Metas e Próximos Passos', 'KPIs e roadmap de execução', '10')
  const s10 = addBase(); topBar(s10, '🏁  METAS E KPIs', 'FASE 10')
  const goals = [['Meta de leads',p.p10_meta_leads],['Meta de vendas',p.p10_meta_vendas],['Meta de faturamento',p.p10_meta_faturamento]].filter(([_,v]) => v)
  goals.forEach(([label, val], i) => {
    const x = 0.3 + i * 3.2
    s10.addShape('rect', { x, y: 0.75, w: 3.0, h: 1.3, fill: { color: CARD_BG }, line: { color: RED, width: 1.5 } })
    s10.addShape('rect', { x, y: 0.75, w: 3.0, h: 0.07, fill: { color: RED } })
    s10.addText(String(label).toUpperCase(), { x, y: 0.9, w: 3.0, h: 0.25, color: GRAY, fontSize: 8, bold: true, align: 'center', charSpacing: 1 })
    s10.addText(String(val), { x, y: 1.15, w: 3.0, h: 0.75, color: WHITE, fontSize: 15, bold: true, align: 'center', valign: 'middle', wrap: true })
  })
  cards(s10, [['KPI principal',p.p10_kpi_principal],['KPI secundário',p.p10_kpi_secundario],['Próximas reuniões',p.p10_proximas_reunioes],['Pendências',p.p10_pendencias],['Aprovações',p.p10_aprovacoes]].filter(([_,v]) => v) as [string,any][], '10')

  // FINAL
  const fin = addBase()
  fin.addShape('rect', { x: 0, y: 0, w: 0.55, h: 5.625, fill: { color: RED } })
  fin.addShape('rect', { x: 0.55, y: 2.6, w: 9.45, h: 0.04, fill: { color: RED } })
  fin.addText('VAMOS', { x: 0.85, y: 1.1, w: 8, h: 0.7, color: GRAY, fontSize: 20, bold: true, charSpacing: 6 })
  fin.addText('ESCALAR!', { x: 0.85, y: 1.8, w: 8, h: 1.0, color: WHITE, fontSize: 42, bold: true })
  fin.addText(clientName, { x: 0.85, y: 2.75, w: 7, h: 0.5, color: RED, fontSize: 15, bold: true })
  fin.addText('Planejamento Estratégico — Uso interno', { x: 0.85, y: 4.25, w: 7, h: 0.35, color: GRAY, fontSize: 10 })

  const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
  const fileName = `Planejamento-${(clientName).replace(/\s+/g, '-')}.pptx`

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    }
  })
}
