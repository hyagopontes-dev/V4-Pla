import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('name').eq('id', clientId).single()
  const { data: p } = await supabase.from('strategic_planning').select('*').eq('client_id', clientId).single()

  if (!p) return NextResponse.json({ error: 'Planejamento não encontrado' }, { status: 404 })

  const date = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  function section(emoji: string, title: string, fields: [string, string | null | undefined][]) {
    const rows = fields.filter(([_, v]) => v).map(([label, value]) => `
      <div style="margin-bottom:14px;">
        <div style="font-size:9px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">${label}</div>
        <div style="font-size:11px;color:#1f2937;line-height:1.6;white-space:pre-wrap;padding:8px 10px;background:#f9fafb;border-radius:6px;border-left:3px solid #dc2626;">${value}</div>
      </div>`).join('')
    if (!rows) return ''
    return `
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <div style="background:#111827;color:white;padding:9px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:700;">
          ${emoji} ${title}
        </div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:14px;">${rows}</div>
      </div>`
  }

  function checkSection(emoji: string, title: string, checks: [string, boolean | null][], links: [string, string | null | undefined][]) {
    const checkHtml = checks.map(([label, val]) => `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="width:16px;height:16px;border-radius:4px;background:${val ? '#22c55e' : '#e5e7eb'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
          ${val ? '<span style="color:white;font-size:10px;">✓</span>' : ''}
        </div>
        <span style="font-size:11px;color:${val ? '#166534' : '#6b7280'};">${label}</span>
      </div>`).join('')
    
    const linkHtml = links.filter(([_, v]) => v).map(([label, url]) => `
      <div style="margin-bottom:6px;">
        <span style="font-size:9px;color:#6b7280;text-transform:uppercase;">${label}:</span>
        <a href="${url}" style="font-size:10px;color:#dc2626;margin-left:6px;">${url}</a>
      </div>`).join('')

    if (!checkHtml && !linkHtml) return ''
    return `
      <div style="margin-bottom:28px;page-break-inside:avoid;">
        <div style="background:#111827;color:white;padding:9px 14px;border-radius:8px 8px 0 0;font-size:12px;font-weight:700;">${emoji} ${title}</div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:14px;">
          ${checkHtml}
          ${linkHtml ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #f3f4f6;">${linkHtml}</div>` : ''}
        </div>
      </div>`
  }

  const scores = [
    p.phase1_score ?? 0, p.phase2_score ?? 0, p.phase3b_score ?? 0,
    p.phase3_score ?? 0, p.phase4_score ?? 0, p.phase5_score ?? 0,
    p.phase6_score ?? 0, p.phase7_score ?? 0, p.phase9_score ?? 0, p.phase10_score ?? 0,
  ]
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>Planejamento — ${client?.name}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color:#1f2937; background:white; }
  @media print { body { -webkit-print-color-adjust:exact; print-color-adjust:exact; } }
</style>
</head>
<body style="padding:40px; max-width:820px; margin:0 auto;">

  <!-- COVER -->
  <div style="margin-bottom:40px;padding-bottom:24px;border-bottom:4px solid #dc2626;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-size:10px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;">Planejamento Estratégico</div>
        <div style="font-size:28px;font-weight:900;color:#111827;margin-bottom:4px;">${client?.name}</div>
        <div style="font-size:13px;color:#6b7280;">Documento gerado em ${date}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:10px;color:#6b7280;margin-bottom:4px;">Score Operacional</div>
        <div style="font-size:48px;font-weight:900;color:#dc2626;line-height:1;">${overall}%</div>
      </div>
    </div>

    ${p.gargalo_atual || p.proximo_passo ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:20px;">
      ${p.gargalo_atual ? `<div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:12px;">
        <div style="font-size:9px;font-weight:700;color:#d97706;text-transform:uppercase;margin-bottom:4px;">⚠️ Gargalo Atual</div>
        <div style="font-size:11px;color:#92400e;">${p.gargalo_atual}</div>
      </div>` : ''}
      ${p.proximo_passo ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">
        <div style="font-size:9px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:4px;">▶ Próximo Passo</div>
        <div style="font-size:11px;color:#166534;">${p.proximo_passo}</div>
      </div>` : ''}
    </div>` : ''}
  </div>

  ${section('🔍', 'FASE 1 — Diagnóstico Inicial', [
    ['Quem compra', p.p1_quem_compra],
    ['Por que compra', p.p1_por_que_compra],
    ['De quem compra', p.p1_de_quem_compra],
    ['Quanto paga', p.p1_quanto_paga],
    ['Onde está', p.p1_onde_esta],
    ['Como escalar', p.p1_como_escalar],
    ['Observações', p.p1_observacoes],
  ])}

  ${section('📊', 'FASE 2 — Análise de Mercado', [
    ['Posicionamento', p.p2_posicionamento],
    ['Autoridade', p.p2_autoridade],
    ['Tráfego', p.p2_trafego],
    ['Anúncios', p.p2_anuncios],
    ['Redes sociais', p.p2_redes_sociais],
    ['Páginas e funis', p.p2_paginas],
    ['Reputação', p.p2_reputacao],
    ['Processo comercial', p.p2_processo_comercial],
    ['Pontos críticos', p.p2_pontos_criticos],
  ])}

  ${section('🏆', 'FASE 3 — Benchmark de Concorrentes', [
    ['Concorrentes diretos', p.p3b_concorrentes_diretos],
    ['Concorrentes indiretos', p.p3b_concorrentes_indiretos],
    ['Ofertas deles', p.p3b_oferta],
    ['Ticket médio deles', p.p3b_ticket_medio],
    ['Diferenciais deles', p.p3b_diferenciais],
    ['Fraquezas e reclamações', p.p3b_reclamacoes],
    ['Oportunidade identificada', p.p3b_oportunidade],
  ])}

  ${section('🎯', 'FASE 4 — ICP e Grid de Público', [
    ['Quem é o público', p.p3_quem_e_publico],
    ['Dores', p.p3_dores],
    ['Desejos', p.p3_desejos],
    ['Objeções', p.p3_objecoes],
    ['Gatilhos de compra', p.p3_gatilhos],
    ['Onde está', p.p3_onde_esta],
    ['Como comunicar', p.p3_como_comunicar],
  ])}

  ${section('🔗', 'FASE 5 — Checklist Operacional', [
    ['Instagram', p.p4_instagram],
    ['Facebook', p.p4_facebook],
    ['Domínio / Site', p.p4_dominio],
    ['YouTube', p.p4_youtube],
    ['Conta de anúncio', p.p4_conta_anuncio],
    ['Hospedagem', p.p4_hospedagem],
    ['WhatsApp', p.p4_whatsapp],
    ['CRM', p.p4_crm],
    ['Landing pages', p.p4_landing_pages],
  ])}

  ${section('⚡', 'FASE 6 — Fast Traffic', [
    ['Criativos solicitados', p.p5_criativos],
    ['Provas sociais', p.p5_provas_sociais],
    ['Verba disponível', p.p5_verba],
  ])}

  ${checkSection('🎨', 'FASE 7 — Identidade Visual',
    [
      ['Logo', p.p7_logo], ['Manual da marca', p.p7_manual],
      ['Paleta de cores', p.p7_paleta], ['Fontes', p.p7_fontes],
      ['Criativos anteriores', p.p7_criativos_anteriores],
      ['Vídeos', p.p7_videos], ['Fotos', p.p7_fotos],
      ['Materiais institucionais', p.p7_materiais],
    ],
    [
      ['Logo', p.p7_link_logo], ['Manual', p.p7_link_manual],
      ['Criativos', p.p7_link_criativos], ['Vídeos', p.p7_link_videos],
      ['Fotos', p.p7_link_fotos], ['Materiais', p.p7_link_materiais],
    ]
  )}

  ${section('💰', 'FASE 9 — Budget de Mídia', [
    ['Verba mensal', p.p9_verba_mensal],
    ['Verba diária', p.p9_verba_diaria],
    ['Canais', p.p9_canais],
    ['Divisão por canal', p.p9_divisao_canal],
    ['Divisão por campanha', p.p9_divisao_campanha],
  ])}

  ${section('🏁', 'FASE 10 — Metas e Próximo Passo', [
    ['Meta de leads', p.p10_meta_leads],
    ['Meta de vendas', p.p10_meta_vendas],
    ['Meta de faturamento', p.p10_meta_faturamento],
    ['KPI principal', p.p10_kpi_principal],
    ['KPI secundário', p.p10_kpi_secundario],
    ['Apresentação', p.p10_apresentacao],
    ['Próximas reuniões', p.p10_proximas_reunioes],
    ['Pendências', p.p10_pendencias],
    ['Aprovações', p.p10_aprovacoes],
  ])}

  <!-- FOOTER -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:9px;color:#9ca3af;">Documento confidencial — uso interno</div>
    <div style="font-size:9px;color:#9ca3af;">${date}</div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  })
}
