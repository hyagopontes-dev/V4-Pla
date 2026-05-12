const pptxgen = require("pptxgenjs")

// Data passed via env
const data = JSON.parse(process.env.PLANNING_DATA)
const clientName = process.env.CLIENT_NAME || 'Cliente'
const outputPath = process.env.OUTPUT_PATH || '/tmp/planejamento.pptx'

// Colors
const BG = "0D0D0D"
const RED = "CC1414"
const RED_DARK = "8B0000"
const WHITE = "FFFFFF"
const GRAY = "AAAAAA"
const CARD_BG = "1A1A1A"
const CARD_BORDER = "2A2A2A"

function makeShadow() {
  return { type: "outer", blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.4 }
}

function makeRedAccent(slide, x, y, h) {
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: RED } })
}

function addSlideBase(pres, bgColor = BG) {
  const slide = pres.addSlide()
  slide.background = { color: bgColor }
  // Subtle logo watermark bottom right
  slide.addText("●", { x: 9.2, y: 5.2, w: 0.4, h: 0.3, color: RED, fontSize: 8, align: "right", transparency: 60 })
  return slide
}

function addSectionHeader(pres, emoji, title, subtitle, slideNum) {
  const slide = addSlideBase(pres)
  
  // Big red accent left
  slide.addShape("rect", { x: 0, y: 0, w: 0.4, h: 5.625, fill: { color: RED } })
  
  // Emoji
  slide.addText(emoji, { x: 0.7, y: 1.6, w: 1.5, h: 1.5, fontSize: 52, align: "left" })
  
  // Slide number
  slide.addText(`FASE ${slideNum}`, { x: 0.7, y: 1.2, w: 6, h: 0.35, color: RED, fontSize: 11, bold: true, charSpacing: 4, align: "left" })
  
  // Title
  slide.addText(title.toUpperCase(), { x: 0.7, y: 2.9, w: 8.5, h: 0.7, color: WHITE, fontSize: 32, bold: true, align: "left" })
  
  // Subtitle
  if (subtitle) {
    slide.addText(subtitle, { x: 0.7, y: 3.65, w: 7, h: 0.5, color: GRAY, fontSize: 14, align: "left", italic: true })
  }
  
  return slide
}

function addContentSlide(pres, title, fields, phaseNum) {
  const slide = addSlideBase(pres)
  
  // Top bar
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  slide.addText(title, { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: "middle" })
  
  // Phase badge
  slide.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED }, rectRadius: 0.05 })
  slide.addText(`FASE ${phaseNum}`, { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  const validFields = fields.filter(([_, v]) => v && String(v).trim())
  const cols = validFields.length > 4 ? 2 : 1
  const perCol = Math.ceil(validFields.length / cols)
  
  validFields.forEach(([label, value], i) => {
    const col = cols === 2 ? Math.floor(i / perCol) : 0
    const row = cols === 2 ? i % perCol : i
    const x = col === 0 ? 0.3 : 5.2
    const colW = cols === 2 ? 4.6 : 9.4
    const y = 0.75 + row * (4.5 / perCol)
    const h = (4.5 / perCol) - 0.1

    // Card bg
    slide.addShape("rect", { x, y, w: colW, h, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 }, shadow: makeShadow() })
    
    // Label
    slide.addText(label.toUpperCase(), { x: x + 0.12, y: y + 0.07, w: colW - 0.24, h: 0.22, color: RED, fontSize: 8, bold: true, charSpacing: 1 })
    
    // Value
    const txt = String(value).slice(0, 300)
    slide.addText(txt, { x: x + 0.12, y: y + 0.3, w: colW - 0.24, h: h - 0.4, color: WHITE, fontSize: 10, valign: "top", wrap: true })
  })
  
  return slide
}

function addChecklistSlide(pres, title, checks, links, phaseNum) {
  const slide = addSlideBase(pres)
  
  // Top bar
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  slide.addText(title, { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: "middle" })
  slide.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
  slide.addText(`FASE ${phaseNum}`, { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  // Checklist items
  const checkItems = checks.filter(([_, v]) => v !== null && v !== undefined)
  checkItems.forEach(([label, val], i) => {
    const y = 0.75 + i * 0.52
    const done = val === true
    slide.addShape("rect", { x: 0.3, y, w: 0.4, h: 0.38, fill: { color: done ? RED : "222222" }, line: { color: done ? RED : "444444", width: 1 } })
    slide.addText(done ? "✓" : "", { x: 0.3, y, w: 0.4, h: 0.38, color: WHITE, fontSize: 14, bold: true, align: "center", valign: "middle" })
    slide.addText(label, { x: 0.85, y: y + 0.04, w: 8.8, h: 0.3, color: done ? WHITE : GRAY, fontSize: 11 })
  })
  
  // Links section
  const validLinks = links.filter(([_, v]) => v && String(v).trim())
  if (validLinks.length) {
    const startY = 0.75 + checkItems.length * 0.52 + 0.2
    slide.addShape("rect", { x: 0, y: startY - 0.05, w: 10, h: 0.25, fill: { color: "111111" } })
    slide.addText("LINKS E ACESSOS", { x: 0.3, y: startY - 0.05, w: 5, h: 0.25, color: RED, fontSize: 8, bold: true, charSpacing: 2, valign: "middle" })
    validLinks.forEach(([label, url], i) => {
      const y = startY + 0.25 + i * 0.38
      slide.addShape("rect", { x: 0.3, y, w: 9.4, h: 0.32, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
      slide.addText(`${label}: `, { x: 0.45, y: y + 0.04, w: 1.8, h: 0.24, color: GRAY, fontSize: 9, bold: true })
      slide.addText(String(url), { x: 2.2, y: y + 0.04, w: 7.3, h: 0.24, color: RED, fontSize: 9, hyperlink: { url: String(url) } })
    })
  }
  
  return slide
}

function addBudgetSlide(pres, data) {
  const slide = addSlideBase(pres)
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  slide.addText("💰  BUDGET DE MÍDIA", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: "middle" })
  slide.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
  slide.addText("FASE 9", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  // Big numbers
  const metrics = [
    ["Verba Mensal", data.p9_verba_mensal],
    ["Verba Diária", data.p9_verba_diaria],
  ].filter(([_, v]) => v)

  metrics.forEach(([label, value], i) => {
    const x = 0.3 + i * 4.8
    slide.addShape("rect", { x, y: 0.75, w: 4.5, h: 1.4, fill: { color: RED }, shadow: makeShadow() })
    slide.addText(label.toUpperCase(), { x, y: 0.82, w: 4.5, h: 0.3, color: "FFD0D0", fontSize: 9, bold: true, align: "center", charSpacing: 2 })
    slide.addText(String(value), { x, y: 1.1, w: 4.5, h: 0.9, color: WHITE, fontSize: 28, bold: true, align: "center", valign: "middle" })
  })

  const details = [
    ["Canais", data.p9_canais],
    ["Divisão por Canal", data.p9_divisao_canal],
    ["Divisão por Campanha", data.p9_divisao_campanha],
    ["Responsável", data.p9_responsavel],
  ].filter(([_, v]) => v)

  details.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = col === 0 ? 0.3 : 5.2
    const y = 2.35 + row * 1.4
    slide.addShape("rect", { x, y, w: 4.6, h: 1.25, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
    slide.addText(label.toUpperCase(), { x: x + 0.15, y: y + 0.1, w: 4.3, h: 0.25, color: RED, fontSize: 8, bold: true, charSpacing: 1 })
    slide.addText(String(value), { x: x + 0.15, y: y + 0.38, w: 4.3, h: 0.75, color: WHITE, fontSize: 11, wrap: true })
  })

  return slide
}

function addGoalsSlide(pres, data) {
  const slide = addSlideBase(pres)
  slide.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  slide.addText("🏁  METAS E KPIs", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: "middle" })
  slide.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
  slide.addText("FASE 10", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  const goals = [
    ["Meta de Leads", data.p10_meta_leads],
    ["Meta de Vendas", data.p10_meta_vendas],
    ["Meta de Faturamento", data.p10_meta_faturamento],
  ].filter(([_, v]) => v)

  goals.forEach(([label, value], i) => {
    const x = 0.3 + i * 3.2
    slide.addShape("rect", { x, y: 0.75, w: 3.0, h: 1.3, fill: { color: CARD_BG }, line: { color: RED, width: 1.5 }, shadow: makeShadow() })
    slide.addShape("rect", { x, y: 0.75, w: 3.0, h: 0.08, fill: { color: RED } })
    slide.addText(label.toUpperCase(), { x, y: 0.9, w: 3.0, h: 0.25, color: GRAY, fontSize: 8, bold: true, align: "center", charSpacing: 1 })
    slide.addText(String(value), { x, y: 1.15, w: 3.0, h: 0.75, color: WHITE, fontSize: 16, bold: true, align: "center", valign: "middle", wrap: true })
  })

  const kpis = [
    ["KPI Principal", data.p10_kpi_principal],
    ["KPI Secundário", data.p10_kpi_secundario],
    ["Próximas Reuniões", data.p10_proximas_reunioes],
    ["Pendências", data.p10_pendencias],
    ["Aprovações Necessárias", data.p10_aprovacoes],
  ].filter(([_, v]) => v)

  kpis.forEach(([label, value], i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = col === 0 ? 0.3 : 5.2
    const y = 2.25 + row * 1.1
    slide.addShape("rect", { x, y, w: 4.6, h: 0.95, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
    makeRedAccent(slide, x, y, 0.95)
    slide.addText(label.toUpperCase(), { x: x + 0.22, y: y + 0.08, w: 4.2, h: 0.22, color: RED, fontSize: 8, bold: true, charSpacing: 1 })
    slide.addText(String(value), { x: x + 0.22, y: y + 0.33, w: 4.2, h: 0.55, color: WHITE, fontSize: 10, wrap: true })
  })

  return slide
}

// ─── BUILD PRESENTATION ───────────────────────────────────────────────────

async function build() {
  const pres = new pptxgen()
  pres.layout = 'LAYOUT_16x9'

  // ── SLIDE 1: COVER ──
  const cover = addSlideBase(pres)
  cover.addShape("rect", { x: 0, y: 0, w: 10, h: 5.625, fill: { color: BG } })
  cover.addShape("rect", { x: 0, y: 0, w: 0.6, h: 5.625, fill: { color: RED } })
  cover.addShape("rect", { x: 0.6, y: 3.5, w: 9.4, h: 0.04, fill: { color: RED } })
  cover.addText("PLANEJAMENTO", { x: 0.9, y: 1.2, w: 8, h: 0.8, color: GRAY, fontSize: 18, bold: true, charSpacing: 6 })
  cover.addText("ESTRATÉGICO", { x: 0.9, y: 1.9, w: 8, h: 1.1, color: WHITE, fontSize: 44, bold: true, charSpacing: 2 })
  cover.addText(clientName.toUpperCase(), { x: 0.9, y: 3.65, w: 7, h: 0.55, color: RED, fontSize: 16, bold: true, charSpacing: 3 })
  cover.addText(new Date().toLocaleDateString('pt-BR'), { x: 0.9, y: 4.3, w: 4, h: 0.35, color: GRAY, fontSize: 11 })

  // ── SLIDE 2: SUMÁRIO ──
  const summary = addSlideBase(pres)
  summary.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  summary.addText("SUMÁRIO", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, charSpacing: 4, valign: "middle" })
  
  const phases = [
    ["Fase 1", "Diagnóstico Inicial"], ["Fase 2", "Análise de Mercado"],
    ["Fase 3", "Benchmark de Concorrentes"], ["Fase 4", "ICP e Grid de Público"],
    ["Fase 5", "Checklist Operacional"], ["Fase 6", "Fast Traffic"],
    ["Fase 7", "Acessos"], ["Fase 8", "Identidade Visual"],
    ["Fase 9", "Budget de Mídia"], ["Fase 10", "Metas e Próximos Passos"],
  ]
  phases.forEach(([num, title], i) => {
    const col = i < 5 ? 0 : 1
    const row = i < 5 ? i : i - 5
    const x = col === 0 ? 0.5 : 5.3
    const y = 0.8 + row * 0.85
    summary.addShape("rect", { x, y, w: 4.5, h: 0.7, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
    makeRedAccent(summary, x, y, 0.7)
    summary.addText(num, { x: x + 0.22, y: y + 0.06, w: 1.2, h: 0.25, color: RED, fontSize: 9, bold: true })
    summary.addText(title, { x: x + 0.22, y: y + 0.33, w: 4, h: 0.28, color: WHITE, fontSize: 11 })
  })

  // ── SLIDE 3: STATUS ──
  if (data.gargalo_atual || data.proximo_passo) {
    const status = addSlideBase(pres)
    status.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
    status.addText("STATUS DA OPERAÇÃO", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, charSpacing: 4, valign: "middle" })
    
    if (data.gargalo_atual) {
      status.addShape("rect", { x: 0.3, y: 0.8, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: "AA6600", width: 1 }, shadow: makeShadow() })
      status.addShape("rect", { x: 0.3, y: 0.8, w: 4.5, h: 0.06, fill: { color: "AA6600" } })
      status.addText("⚠️  GARGALO ATUAL", { x: 0.5, y: 0.95, w: 4.1, h: 0.35, color: "FFAA00", fontSize: 11, bold: true })
      status.addText(data.gargalo_atual, { x: 0.5, y: 1.4, w: 4.0, h: 3.6, color: WHITE, fontSize: 12, wrap: true, valign: "top" })
    }
    if (data.proximo_passo) {
      status.addShape("rect", { x: 5.2, y: 0.8, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: "006622", width: 1 }, shadow: makeShadow() })
      status.addShape("rect", { x: 5.2, y: 0.8, w: 4.5, h: 0.06, fill: { color: "006622" } })
      status.addText("→  PRÓXIMO PASSO OBRIGATÓRIO", { x: 5.4, y: 0.95, w: 4.1, h: 0.35, color: "44EE44", fontSize: 11, bold: true })
      status.addText(data.proximo_passo, { x: 5.4, y: 1.4, w: 4.0, h: 3.6, color: WHITE, fontSize: 12, wrap: true, valign: "top" })
    }
  }

  // ── FASE 1: DIAGNÓSTICO ──
  addSectionHeader(pres, "🔍", "Diagnóstico Inicial", "Pesquisa de Mercado", "1")
  addContentSlide(pres, "🔍  DIAGNÓSTICO INICIAL", [
    ["Quem compra?", data.p1_quem_compra],
    ["Por que compra?", data.p1_por_que_compra],
    ["De quem compra?", data.p1_de_quem_compra],
    ["Quanto paga?", data.p1_quanto_paga],
    ["Onde está?", data.p1_onde_esta],
    ["Como escalar?", data.p1_como_escalar],
  ].filter(([_, v]) => v), "1")

  // ── FASE 2: ANÁLISE DE MERCADO ──
  addSectionHeader(pres, "📊", "Análise de Mercado", "Presença Digital", "2")
  addContentSlide(pres, "📊  ANÁLISE DE MERCADO", [
    ["Posicionamento atual", data.p2_posicionamento],
    ["Autoridade digital", data.p2_autoridade],
    ["Tráfego atual", data.p2_trafego],
    ["Anúncios que já rodou", data.p2_anuncios],
    ["Presença em redes sociais", data.p2_redes_sociais],
    ["Reputação", data.p2_reputacao],
    ["Processo comercial", data.p2_processo_comercial],
    ["Pontos críticos", data.p2_pontos_criticos],
  ].filter(([_, v]) => v), "2")

  // ── FASE 3: BENCHMARK ──
  addSectionHeader(pres, "🏆", "Benchmark de Concorrentes", "Análise competitiva", "3")
  addContentSlide(pres, "🏆  BENCHMARK DE CONCORRENTES", [
    ["Concorrentes diretos", data.p3b_concorrentes_diretos],
    ["Concorrentes indiretos", data.p3b_concorrentes_indiretos],
    ["Ofertas deles", data.p3b_oferta],
    ["Ticket médio deles", data.p3b_ticket_medio],
    ["Diferenciais deles", data.p3b_diferenciais],
    ["Fraquezas e reclamações", data.p3b_reclamacoes],
    ["Oportunidade identificada", data.p3b_oportunidade],
  ].filter(([_, v]) => v), "3")

  // ── FASE 4: ICP ──
  addSectionHeader(pres, "🎯", "ICP e Grid de Público", "Identificação do cliente ideal", "4")
  addContentSlide(pres, "🎯  ICP E GRID DE PÚBLICO", [
    ["Quem é o público?", data.p3_quem_e_publico],
    ["Dores principais", data.p3_dores],
    ["Desejos e aspirações", data.p3_desejos],
    ["Objeções comuns", data.p3_objecoes],
    ["Gatilhos de compra", data.p3_gatilhos],
    ["Onde esse público está?", data.p3_onde_esta],
    ["Como se comunicar?", data.p3_como_comunicar],
  ].filter(([_, v]) => v), "4")

  // ── FASE 5: CHECKLIST ──
  addSectionHeader(pres, "🔗", "Checklist Operacional", "Links e Estrutura", "5")
  addContentSlide(pres, "🔗  CHECKLIST OPERACIONAL — LINKS", [
    ["Instagram", data.p4_instagram],
    ["Facebook", data.p4_facebook],
    ["Domínio / Site", data.p4_dominio],
    ["YouTube", data.p4_youtube],
    ["Conta de Anúncio", data.p4_conta_anuncio],
    ["Hospedagem", data.p4_hospedagem],
    ["WhatsApp Business", data.p4_whatsapp],
    ["CRM", data.p4_crm],
    ["Landing Pages", data.p4_landing_pages],
  ].filter(([_, v]) => v), "5")

  // ── FASE 6: FAST TRAFFIC ──
  addSectionHeader(pres, "⚡", "Fast Traffic", "Preparação para lançamento imediato", "6")
  addContentSlide(pres, "⚡  FAST TRAFFIC", [
    ["Criativos solicitados", data.p5_criativos],
    ["Provas sociais levantadas", data.p5_provas_sociais],
    ["Verba disponível para iniciar", data.p5_verba],
  ].filter(([_, v]) => v), "6")

  // ── FASE 7: ACESSOS ──
  addSectionHeader(pres, "🔐", "Acessos", "Controle operacional", "7")
  if (data.p6_link_planilha) {
    const s = addSlideBase(pres)
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
    s.addText("🔐  ACESSOS", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, valign: "middle" })
    s.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
    s.addText("FASE 7", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })
    s.addShape("rect", { x: 0.5, y: 1.2, w: 9, h: 1.2, fill: { color: CARD_BG }, line: { color: RED, width: 1 }, shadow: makeShadow() })
    s.addText("PLANILHA DE ACESSOS", { x: 0.7, y: 1.35, w: 6, h: 0.35, color: RED, fontSize: 11, bold: true, charSpacing: 2 })
    s.addText(data.p6_link_planilha, { x: 0.7, y: 1.72, w: 8.5, h: 0.35, color: WHITE, fontSize: 11, hyperlink: { url: data.p6_link_planilha } })
    s.addText("Clique no link para acessar a planilha completa de acessos do cliente.", { x: 0.5, y: 2.7, w: 9, h: 0.4, color: GRAY, fontSize: 11, italic: true, align: "center" })
  }

  // ── FASE 8: IDENTIDADE VISUAL ──
  addSectionHeader(pres, "🎨", "Identidade Visual", "Assets e materiais da marca", "8")
  addChecklistSlide(pres, "🎨  IDENTIDADE VISUAL", [
    ["Logo (PNG/SVG fundo transparente)", data.p7_logo],
    ["Manual da marca / brand book", data.p7_manual],
    ["Paleta de cores (HEX)", data.p7_paleta],
    ["Fontes tipográficas", data.p7_fontes],
    ["Criativos anteriores", data.p7_criativos_anteriores],
    ["Vídeos institucionais", data.p7_videos],
    ["Fotos", data.p7_fotos],
    ["Materiais institucionais", data.p7_materiais],
  ], [
    ["Logo", data.p7_link_logo],
    ["Manual", data.p7_link_manual],
    ["Criativos", data.p7_link_criativos],
    ["Vídeos", data.p7_link_videos],
    ["Fotos", data.p7_link_fotos],
    ["Materiais", data.p7_link_materiais],
  ], "8")

  // ── FASE 9: BUDGET ──
  addSectionHeader(pres, "💰", "Budget de Mídia", "Planejamento financeiro", "9")
  addBudgetSlide(pres, data)

  // ── FASE 10: METAS ──
  addSectionHeader(pres, "🏁", "Metas e Próximos Passos", "KPIs e roadmap de execução", "10")
  addGoalsSlide(pres, data)

  // ── FINAL SLIDE ──
  const final = addSlideBase(pres)
  final.addShape("rect", { x: 0, y: 0, w: 0.6, h: 5.625, fill: { color: RED } })
  final.addShape("rect", { x: 0.6, y: 2.6, w: 9.4, h: 0.04, fill: { color: RED } })
  final.addText("VAMOS", { x: 0.9, y: 1.2, w: 8, h: 0.8, color: GRAY, fontSize: 20, bold: true, charSpacing: 6 })
  final.addText("ESCALAR!", { x: 0.9, y: 1.9, w: 8, h: 1.0, color: WHITE, fontSize: 44, bold: true })
  final.addText(clientName, { x: 0.9, y: 2.75, w: 7, h: 0.5, color: RED, fontSize: 16, bold: true })
  final.addText("Planejamento Estratégico — Uso interno", { x: 0.9, y: 4.3, w: 7, h: 0.35, color: GRAY, fontSize: 10 })

  await pres.writeFile({ fileName: outputPath })
  console.log("OK:" + outputPath)
}

build().catch(e => { console.error(e); process.exit(1) })
