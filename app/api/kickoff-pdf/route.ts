import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  if (!clientId) return NextResponse.json({ error: 'client_id required' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: client } = await supabase.from('clients').select('name, slug').eq('id', clientId).single()
  const { data: kickoff } = await supabase.from('kickoff_responses').select('*').eq('client_id', clientId).single()

  if (!kickoff) return NextResponse.json({ error: 'Kickoff não encontrado' }, { status: 404 })

  // Build HTML for PDF
  const SECTIONS = [
    { title: '1. Sobre a Empresa', fields: [
      ['Sobre a empresa', 'sobre_empresa'],
      ['Frase curta', 'alma_negocio'],
      ['Por que criou o negócio', 'comeco_tudo'],
      ['Valores / proibições', 'valores'],
      ['Inspiração', 'inspiracao'],
    ]},
    { title: '2. Análise S.W.O.T', fields: [
      ['Forças', 'swot_forcas'],
      ['Fraquezas', 'swot_fraquezas'],
      ['Oportunidades', 'swot_oportunidades'],
      ['Ameaças', 'swot_ameacas'],
    ]},
    { title: '3. Clientes e Públicos', fields: [
      ['Cliente ideal', 'cliente_ideal'],
      ['Problema que resolve', 'problema_resolve'],
      ['Público 1', 'publico_1'],
      ['Público 2', 'publico_2'],
      ['Público 3', 'publico_3'],
    ]},
    { title: '4. Diferenciais e Concorrência', fields: [
      ['PUV — Proposta Única de Valor', 'puv'],
      ['Perguntas frequentes', 'perguntas_frequentes'],
      ['Concorrentes', 'quem_sao_concorrentes'],
      ['Por que você', 'por_que_voce'],
      ['O que evitar', 'o_que_evitar'],
    ]},
    { title: '5. Produção e Conteúdo', fields: [
      ['Fotos e vídeos', 'fotos_videos'],
      ['Quem aprova', 'quem_aprova'],
      ['O que já foi feito', 'o_que_ja_foi_feito'],
    ]},
    { title: '6. Objetivos e Combinados', fields: [
      ['Objetivo com a v4', 'objetivo_v4'],
      ['Sonho de curto prazo', 'sonho_curto_prazo'],
      ['Dia e horário das reuniões', 'reuniao_horario'],
    ]},
  ]

  const sectionHtml = SECTIONS.map(section => {
    const fieldsHtml = section.fields
      .filter(([_, key]) => kickoff[key])
      .map(([label, key]) => `
        <div style="margin-bottom:16px;">
          <div style="font-size:10px;font-weight:700;color:#dc2626;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">${label}</div>
          <div style="font-size:12px;color:#1f2937;line-height:1.6;white-space:pre-wrap;background:#f9fafb;padding:10px 12px;border-radius:6px;border-left:3px solid #dc2626;">${kickoff[key]}</div>
        </div>
      `).join('')
    
    if (!fieldsHtml) return ''
    
    return `
      <div style="margin-bottom:32px;page-break-inside:avoid;">
        <div style="background:#1f2937;color:white;padding:10px 16px;border-radius:8px 8px 0 0;font-size:13px;font-weight:700;">${section.title}</div>
        <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px;padding:16px;">${fieldsHtml}</div>
      </div>
    `
  }).join('')

  const date = new Date(kickoff.submitted_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; background: white; }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .no-break { page-break-inside: avoid; }
  }
</style>
</head>
<body style="padding:40px;max-width:800px;margin:0 auto;">
  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid #dc2626;">
    <div>
      <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:4px;">v4 Company</div>
      <div style="font-size:24px;font-weight:900;color:#111827;">Kick-off</div>
      <div style="font-size:18px;font-weight:700;color:#dc2626;">${client?.name ?? ''}</div>
    </div>
    <div style="text-align:right;">
      <div style="font-size:10px;color:#6b7280;">Preenchido em</div>
      <div style="font-size:12px;font-weight:600;color:#374151;">${date}</div>
    </div>
  </div>
  
  <!-- Content -->
  ${sectionHtml}
  
  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#9ca3af;">v4 Company — Documento confidencial</div>
    <div style="font-size:10px;color:#9ca3af;">v4-pla.vercel.app</div>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    }
  })
}
