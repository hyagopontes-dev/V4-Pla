import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import PptxGenJS from 'pptxgenjs'

export const runtime = 'nodejs'
export const maxDuration = 30

const BG = "0D0D0D", RED = "CC1414", RED_DARK = "8B0000"
const WHITE = "FFFFFF", GRAY = "AAAAAA", CARD_BG = "1A1A1A", CARD_BORDER = "2A2A2A"

function ms() { return { type: "outer" as const, blur: 8, offset: 2, angle: 135, color: "000000", opacity: 0.4 } }
function ra(slide: any, x: number, y: number, h: number) {
  slide.addShape("rect", { x, y, w: 0.06, h, fill: { color: RED } })
}

function base(pres: PptxGenJS) {
  const s = pres.addSlide()
  s.background = { color: BG }
  return s
}

function sectionSlide(pres: PptxGenJS, emoji: string, title: string, subtitle: string, num: string) {
  const s = base(pres)
  s.addShape("rect", { x: 0, y: 0, w: 0.4, h: 5.625, fill: { color: RED } })
  s.addText(`FASE ${num}`, { x: 0.7, y: 1.2, w: 6, h: 0.35, color: RED, fontSize: 11, bold: true, charSpacing: 4 })
  s.addText(emoji, { x: 0.7, y: 1.6, w: 1.2, h: 1.0, fontSize: 44 })
  s.addText(title.toUpperCase(), { x: 0.7, y: 2.85, w: 8.5, h: 0.7, color: WHITE, fontSize: 30, bold: true })
  if (subtitle) s.addText(subtitle, { x: 0.7, y: 3.65, w: 7, h: 0.45, color: GRAY, fontSize: 13, italic: true })
}

function contentSlide(pres: PptxGenJS, title: string, fields: [string, string][], num: string) {
  const valid = fields.filter(([_, v]) => v?.trim())
  if (!valid.length) return
  const s = base(pres)
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  s.addText(title, { x: 0.3, y: 0, w: 8.3, h: 0.55, color: WHITE, fontSize: 12, bold: true, valign: "middle" })
  s.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
  s.addText(`FASE ${num}`, { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  const cols = valid.length > 4 ? 2 : 1
  const perCol = Math.ceil(valid.length / cols)
  valid.forEach(([label, value], i) => {
    const col = cols === 2 ? Math.floor(i / perCol) : 0
    const row = cols === 2 ? i % perCol : i
    const x = col === 0 ? 0.3 : 5.2
    const colW = cols === 2 ? 4.6 : 9.4
    const y = 0.72 + row * (4.6 / perCol)
    const h = (4.6 / perCol) - 0.12
    s.addShape("rect", { x, y, w: colW, h, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 }, shadow: ms() })
    s.addText(label.toUpperCase(), { x: x + 0.12, y: y + 0.07, w: colW - 0.24, h: 0.2, color: RED, fontSize: 8, bold: true, charSpacing: 1 })
    s.addText(String(value).slice(0, 280), { x: x + 0.12, y: y + 0.3, w: colW - 0.24, h: h - 0.38, color: WHITE, fontSize: 10, valign: "top", wrap: true })
  })
}

function checklistSlide(pres: PptxGenJS, title: string, checks: [string, boolean][], links: [string, string][], num: string) {
  const s = base(pres)
  s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  s.addText(title, { x: 0.3, y: 0, w: 8.3, h: 0.55, color: WHITE, fontSize: 12, bold: true, valign: "middle" })
  s.addShape("rect", { x: 8.7, y: 0.05, w: 1.1, h: 0.45, fill: { color: RED } })
  s.addText(`FASE ${num}`, { x: 8.7, y: 0.05, w: 1.1, h: 0.45, color: WHITE, fontSize: 9, bold: true, align: "center", valign: "middle" })

  checks.forEach(([label, val], i) => {
    const y = 0.72 + i * 0.5
    s.addShape("rect", { x: 0.3, y, w: 0.38, h: 0.36, fill: { color: val ? RED : "222222" }, line: { color: val ? RED : "444444", width: 1 } })
    if (val) s.addText("✓", { x: 0.3, y, w: 0.38, h: 0.36, color: WHITE, fontSize: 13, bold: true, align: "center", valign: "middle" })
    s.addText(label, { x: 0.82, y: y + 0.05, w: 8.8, h: 0.28, color: val ? WHITE : GRAY, fontSize: 11 })
  })

  const validLinks = links.filter(([_, v]) => v?.trim())
  if (validLinks.length) {
    const startY = 0.72 + checks.length * 0.5 + 0.15
    s.addShape("rect", { x: 0, y: startY, w: 10, h: 0.22, fill: { color: "111111" } })
    s.addText("LINKS", { x: 0.3, y: startY, w: 3, h: 0.22, color: RED, fontSize: 8, bold: true, charSpacing: 2, valign: "middle" })
    validLinks.forEach(([label, url], i) => {
      const y = startY + 0.28 + i * 0.36
      s.addShape("rect", { x: 0.3, y, w: 9.4, h: 0.3, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
      s.addText(`${label}:`, { x: 0.45, y: y + 0.05, w: 1.6, h: 0.22, color: GRAY, fontSize: 9, bold: true })
      s.addText(url, { x: 2.1, y: y + 0.05, w: 7.4, h: 0.22, color: RED, fontSize: 9, hyperlink: { url } })
    })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
  const { data: p } = await supabase.from('strategic_planning').select('*').eq('client_id', clientId).single()

  if (!p) return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 })

  const name = client?.name ?? 'Cliente'
  const pres = new PptxGenJS()
  pres.layout = 'LAYOUT_16x9'

  // CAPA
  const cover = base(pres)
  cover.addShape("rect", { x: 0, y: 0, w: 0.6, h: 5.625, fill: { color: RED } })
  cover.addShape("rect", { x: 0.6, y: 3.5, w: 9.4, h: 0.04, fill: { color: RED } })
  cover.addText("PLANEJAMENTO", { x: 0.9, y: 1.2, w: 8, h: 0.7, color: GRAY, fontSize: 18, bold: true, charSpacing: 6 })
  cover.addText("ESTRATÉGICO", { x: 0.9, y: 1.85, w: 8, h: 1.0, color: WHITE, fontSize: 42, bold: true })
  cover.addText(name.toUpperCase(), { x: 0.9, y: 3.65, w: 7, h: 0.5, color: RED, fontSize: 15, bold: true, charSpacing: 3 })
  cover.addText(new Date().toLocaleDateString('pt-BR'), { x: 0.9, y: 4.3, w: 4, h: 0.35, color: GRAY, fontSize: 11 })

  // SUMÁRIO
  const sum = base(pres)
  sum.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  sum.addText("SUMÁRIO", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, charSpacing: 4, valign: "middle" })
  const phases = [
    ["1","Diagnóstico Inicial"],["2","Análise de Mercado"],["3","Benchmark de Concorrentes"],
    ["4","ICP e Grid de Público"],["5","Checklist Operacional"],["6","Fast Traffic"],
    ["7","Acessos"],["8","Identidade Visual"],["9","Budget de Mídia"],["10","Metas e Próximos Passos"],
  ]
  phases.forEach(([num, title], i) => {
    const col = i < 5 ? 0 : 1
    const row = i < 5 ? i : i - 5
    const x = col === 0 ? 0.5 : 5.3
    const y = 0.8 + row * 0.85
    sum.addShape("rect", { x, y, w: 4.5, h: 0.7, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 0.5 } })
    ra(sum, x, y, 0.7)
    sum.addText(`Fase ${num}`, { x: x + 0.22, y: y + 0.06, w: 1.2, h: 0.25, color: RED, fontSize: 9, bold: true })
    sum.addText(title, { x: x + 0.22, y: y + 0.33, w: 4, h: 0.28, color: WHITE, fontSize: 11 })
  })

  // STATUS
  if (p.gargalo_atual || p.proximo_passo) {
    const st = base(pres)
    st.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
    st.addText("STATUS DA OPERAÇÃO", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 13, bold: true, charSpacing: 4, valign: "middle" })
    if (p.gargalo_atual) {
      st.addShape("rect", { x: 0.3, y: 0.8, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: "AA6600", width: 1 }, shadow: ms() })
      st.addShape("rect", { x: 0.3, y: 0.8, w: 4.5, h: 0.06, fill: { color: "AA6600" } })
      st.addText("GARGALO ATUAL", { x: 0.5, y: 0.95, w: 4.1, h: 0.32, color: "FFAA00", fontSize: 10, bold: true })
      st.addText(p.gargalo_atual, { x: 0.5, y: 1.35, w: 4.0, h: 3.7, color: WHITE, fontSize: 12, wrap: true, valign: "top" })
    }
    if (p.proximo_passo) {
      st.addShape("rect", { x: 5.2, y: 0.8, w: 4.5, h: 4.4, fill: { color: CARD_BG }, line: { color: "006622", width: 1 }, shadow: ms() })
      st.addShape("rect", { x: 5.2, y: 0.8, w: 4.5, h: 0.06, fill: { color: "006622" } })
      st.addText("PRÓXIMO PASSO", { x: 5.4, y: 0.95, w: 4.1, h: 0.32, color: "44EE44", fontSize: 10, bold: true })
      st.addText(p.proximo_passo, { x: 5.4, y: 1.35, w: 4.0, h: 3.7, color: WHITE, fontSize: 12, wrap: true, valign: "top" })
    }
  }

  // FASE 1
  sectionSlide(pres, "🔍", "Diagnóstico Inicial", "Pesquisa de Mercado", "1")
  contentSlide(pres, "🔍  DIAGNÓSTICO INICIAL", [
    ["Quem compra?", p.p1_quem_compra], ["Por que compra?", p.p1_por_que_compra],
    ["De quem compra?", p.p1_de_quem_compra], ["Quanto paga?", p.p1_quanto_paga],
    ["Onde está?", p.p1_onde_esta], ["Como escalar?", p.p1_como_escalar],
  ], "1")

  // FASE 2
  sectionSlide(pres, "📊", "Análise de Mercado", "Presença Digital", "2")
  contentSlide(pres, "📊  ANÁLISE DE MERCADO", [
    ["Posicionamento", p.p2_posicionamento], ["Autoridade digital", p.p2_autoridade],
    ["Tráfego", p.p2_trafego], ["Anúncios anteriores", p.p2_anuncios],
    ["Redes sociais", p.p2_redes_sociais], ["Reputação", p.p2_reputacao],
    ["Processo comercial", p.p2_processo_comercial], ["Pontos críticos", p.p2_pontos_criticos],
  ], "2")

  // FASE 3
  sectionSlide(pres, "🏆", "Benchmark de Concorrentes", "Análise competitiva", "3")
  contentSlide(pres, "🏆  BENCHMARK DE CONCORRENTES", [
    ["Concorrentes diretos", p.p3b_concorrentes_diretos], ["Concorrentes indiretos", p.p3b_concorrentes_indiretos],
    ["Ofertas deles", p.p3b_oferta], ["Ticket médio", p.p3b_ticket_medio],
    ["Diferenciais", p.p3b_diferenciais], ["Fraquezas", p.p3b_reclamacoes],
    ["Oportunidade", p.p3b_oportunidade],
  ], "3")

  // FASE 4
  sectionSlide(pres, "🎯", "ICP e Grid de Público", "Cliente ideal", "4")
  contentSlide(pres, "🎯  ICP E GRID DE PÚBLICO", [
    ["Quem é o público?", p.p3_quem_e_publico], ["Dores principais", p.p3_dores],
    ["Desejos", p.p3_desejos], ["Objeções", p.p3_objecoes],
    ["Gatilhos de compra", p.p3_gatilhos], ["Onde está?", p.p3_onde_esta],
    ["Como comunicar?", p.p3_como_comunicar],
  ], "4")

  // FASE 5
  sectionSlide(pres, "🔗", "Checklist Operacional", "Links e Estrutura", "5")
  contentSlide(pres, "🔗  CHECKLIST OPERACIONAL", [
    ["Instagram", p.p4_instagram], ["Facebook", p.p4_facebook],
    ["Domínio/Site", p.p4_dominio], ["YouTube", p.p4_youtube],
    ["Conta de anúncio", p.p4_conta_anuncio], ["Hospedagem", p.p4_hospedagem],
    ["WhatsApp", p.p4_whatsapp], ["CRM", p.p4_crm], ["Landing Pages", p.p4_landing_pages],
  ], "5")

  // FASE 6
  sectionSlide(pres, "⚡", "Fast Traffic", "Lançamento imediato", "6")
  contentSlide(pres, "⚡  FAST TRAFFIC", [
    ["Criativos solicitados", p.p5_criativos],
    ["Provas sociais", p.p5_provas_sociais],
    ["Verba disponível", p.p5_verba],
  ], "6")

  // FASE 7
  sectionSlide(pres, "🔐", "Acessos", "Controle operacional", "7")
  if (p.p6_link_planilha) {
    const s = base(pres)
    s.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
    s.addText("🔐  ACESSOS", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 12, bold: true, valign: "middle" })
    s.addShape("rect", { x: 0.5, y: 1.2, w: 9, h: 1.1, fill: { color: CARD_BG }, line: { color: RED, width: 1 }, shadow: ms() })
    s.addText("PLANILHA DE ACESSOS", { x: 0.7, y: 1.35, w: 6, h: 0.3, color: RED, fontSize: 10, bold: true, charSpacing: 2 })
    s.addText(p.p6_link_planilha, { x: 0.7, y: 1.68, w: 8.5, h: 0.3, color: WHITE, fontSize: 10, hyperlink: { url: p.p6_link_planilha } })
  }

  // FASE 8
  sectionSlide(pres, "🎨", "Identidade Visual", "Assets da marca", "8")
  checklistSlide(pres, "🎨  IDENTIDADE VISUAL", [
    ["Logo (PNG/SVG fundo transparente)", !!p.p7_logo],
    ["Manual da marca / brand book", !!p.p7_manual],
    ["Paleta de cores (HEX)", !!p.p7_paleta],
    ["Fontes tipográficas", !!p.p7_fontes],
    ["Criativos anteriores de anúncios", !!p.p7_criativos_anteriores],
    ["Vídeos institucionais / depoimentos", !!p.p7_videos],
    ["Fotos de produto / equipe", !!p.p7_fotos],
    ["Materiais institucionais", !!p.p7_materiais],
  ], [
    ["Logo", p.p7_link_logo], ["Manual", p.p7_link_manual],
    ["Criativos", p.p7_link_criativos], ["Vídeos", p.p7_link_videos],
    ["Fotos", p.p7_link_fotos], ["Materiais", p.p7_link_materiais],
  ], "8")

  // FASE 9
  sectionSlide(pres, "💰", "Budget de Mídia", "Planejamento financeiro", "9")
  const budget = base(pres)
  budget.addShape("rect", { x: 0, y: 0, w: 10, h: 0.55, fill: { color: RED_DARK } })
  budget.addText("💰  BUDGET DE MÍDIA", { x: 0.3, y: 0, w: 9, h: 0.55, color: WHITE, fontSize: 12, bold: true, valign: "middle" })
  const budgetMetrics: [string,string][] = [["Verba Mensal", p.p9_verba_mensal],["Verba Diária", p.p9_verba_diaria]].filter(([_,v])=>v) as [string,string][]
  budgetMetrics.forEach(([label, value], i) => {
    const x = 0.3 + i * 4.8
    budget.addShape("rect", { x, y: 0.75, w: 4.5, h: 1.3, fill: { color: RED }, shadow: ms() })
    budget.addText(label.toUpperCase(), { x, y: 0.82, w: 4.5, h: 0.28, color: "FFD0D0", fontSize: 9, bold: true, align: "center", charSpacing: 2 })
    budget.addText(String(value), { x, y: 1.05, w: 4.5, h: 0.85, color: WHITE, fontSize: 26, bold: true, align: "center", valign: "middle" })
  })
  contentSlide(pres, "💰  BUDGET — DETALHES", [
    ["Canais", p.p9_canais], ["Divisão por canal", p.p9_divisao_canal],
    ["Divisão por campanha", p.p9_divisao_campanha],
  ], "9")

  // FASE 10
  sectionSlide(pres, "🏁", "Metas e Próximos Passos", "KPIs e roadmap", "10")
  contentSlide(pres, "🏁  METAS E KPIs", [
    ["Meta de Leads", p.p10_meta_leads], ["Meta de Vendas", p.p10_meta_vendas],
    ["Meta de Faturamento", p.p10_meta_faturamento], ["KPI Principal", p.p10_kpi_principal],
    ["KPI Secundário", p.p10_kpi_secundario], ["Próximas reuniões", p.p10_proximas_reunioes],
    ["Pendências", p.p10_pendencias], ["Aprovações", p.p10_aprovacoes],
  ], "10")

  // FINAL
  const final = base(pres)
  final.addShape("rect", { x: 0, y: 0, w: 0.6, h: 5.625, fill: { color: RED } })
  final.addShape("rect", { x: 0.6, y: 2.6, w: 9.4, h: 0.04, fill: { color: RED } })
  final.addText("VAMOS", { x: 0.9, y: 1.2, w: 8, h: 0.8, color: GRAY, fontSize: 20, bold: true, charSpacing: 6 })
  final.addText("ESCALAR!", { x: 0.9, y: 1.9, w: 8, h: 1.0, color: WHITE, fontSize: 42, bold: true })
  final.addText(name, { x: 0.9, y: 2.75, w: 7, h: 0.5, color: RED, fontSize: 15, bold: true })

  const buffer = await pres.write({ outputType: 'nodebuffer' }) as Buffer
  const filename = `Planejamento-${name.replace(/\s+/g,'-')}.pptx`

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  })
}
