'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  ChevronDown, ChevronRight, CheckCircle, Circle, AlertTriangle, 
  Zap, Target, Users, Link2, Rocket, Lock, Palette, DollarSign, 
  Flag, Trophy, Clock, User, Save, ChevronLeft, ChevronUp, FileDown
} from 'lucide-react'

interface Client { id: string; name: string; slug: string }
interface Props {
  clients: Client[]
  selectedClientId: string
  selectedClient: Client | null
  planning: any
}

const PHASES = [
  {
    id: 1, key: 'p1', emoji: '🔍', icon: Target, color: 'from-blue-600 to-blue-700',
    title: 'Diagnóstico Inicial', subtitle: 'Pesquisa de Mercado',
    description: 'Descobrir quem compra, por que compra, de quem compra, quanto paga e onde está.',
    fields: [
      { key: 'quem_compra', label: 'Quem compra?', placeholder: 'Perfil do comprador...' },
      { key: 'por_que_compra', label: 'Por que compra?', placeholder: 'Motivações principais...' },
      { key: 'de_quem_compra', label: 'De quem compra (além de você)?', placeholder: 'Concorrentes que já usam...' },
      { key: 'quanto_paga', label: 'Quanto paga?', placeholder: 'Ticket médio e faixas de preço...' },
      { key: 'onde_esta', label: 'Onde está?', placeholder: 'Canais, plataformas, regiões...' },
      { key: 'como_escalar', label: 'Como escalar isso?', placeholder: 'Estratégia de escala...' },
      { key: 'observacoes', label: 'Observações', placeholder: 'Notas adicionais...' },
    ],
    checks: null,
  },
  {
    id: 2, key: 'p2', emoji: '📊', icon: Target, color: 'from-purple-600 to-purple-700',
    title: 'Análise de Mercado', subtitle: 'Google Meu Negócio + Presença Digital',
    description: 'Analisar a presença digital do cliente: posicionamento, autoridade, tráfego e reputação.',
    fields: [
      { key: 'posicionamento', label: 'Posicionamento atual', placeholder: 'Como o cliente se posiciona hoje...' },
      { key: 'autoridade', label: 'Autoridade digital', placeholder: 'Seguidores, avaliações, reconhecimento...' },
      { key: 'trafego', label: 'Tráfego atual', placeholder: 'Volume de tráfego orgânico e pago...' },
      { key: 'anuncios', label: 'Anúncios que já rodou', placeholder: 'Histórico de campanhas, o que funcionou...' },
      { key: 'redes_sociais', label: 'Presença em redes sociais', placeholder: 'Plataformas, engagement, frequência...' },
      { key: 'paginas', label: 'Páginas e funis existentes', placeholder: 'Landing pages, site, funis identificados...' },
      { key: 'reputacao', label: 'Reputação (Google, Reclame Aqui)', placeholder: 'Nota, avaliações, percepção...' },
      { key: 'processo_comercial', label: 'Processo comercial atual', placeholder: 'Como vende hoje, fluxo de atendimento...' },
      { key: 'pontos_criticos', label: '⚠️ Pontos críticos identificados', placeholder: 'Principais gaps e oportunidades...' },
    ],
    checks: null,
  },
  {
    id: 3, key: 'p3b', emoji: '🏆', icon: Target, color: 'from-violet-600 to-violet-700',
    title: 'Benchmark de Concorrentes', subtitle: 'Análise competitiva detalhada',
    description: 'Mapear concorrentes diretos e indiretos, diferenciais, pontos fracos e oportunidades.',
    fields: [
      { key: 'concorrentes_diretos', label: 'Concorrentes diretos', placeholder: 'Nome + URL + diferencial de cada um...' },
      { key: 'concorrentes_indiretos', label: 'Concorrentes indiretos', placeholder: 'Alternativas que o público usa...' },
      { key: 'oferta', label: 'Ofertas deles', placeholder: 'O que cada concorrente oferece...' },
      { key: 'ticket_medio', label: 'Ticket médio deles', placeholder: 'Faixa de preço praticada...' },
      { key: 'diferenciais', label: 'Diferenciais deles', placeholder: 'O que fazem bem, pontos fortes...' },
      { key: 'reclamacoes', label: 'Fraquezas e reclamações', placeholder: 'Reclame Aqui, reviews negativos, pontos fracos...' },
      { key: 'oportunidade', label: '🎯 Oportunidade identificada', placeholder: 'Onde podemos nos diferenciar e ganhar mercado...' },
    ],
    checks: null,
  },
  {
    id: 4, key: 'p3', emoji: '🎯', icon: Users, color: 'from-orange-600 to-orange-700',
    title: 'ICP e Grid de Público', subtitle: 'Identificação do cliente ideal',
    description: 'Mapear quem é o público, suas dores, desejos, objeções e gatilhos de compra.',
    fields: [
      { key: 'quem_e_publico', label: 'Quem é o público?', placeholder: 'Perfil detalhado...' },
      { key: 'dores', label: 'Dores principais', placeholder: 'Problemas que quer resolver...' },
      { key: 'desejos', label: 'Desejos e aspirações', placeholder: 'O que quer conquistar...' },
      { key: 'objecoes', label: 'Objeções comuns', placeholder: 'Por que não compra...' },
      { key: 'gatilhos', label: 'Gatilhos de compra', placeholder: 'O que faz decidir...' },
      { key: 'onde_esta', label: 'Onde esse público está?', placeholder: 'Plataformas, comunidades, eventos...' },
      { key: 'como_comunicar', label: 'Como se comunicar com ele?', placeholder: 'Tom, linguagem, canais...' },
    ],
    checks: null,
  },
  {
    id: 5, key: 'p4', emoji: '🔗', icon: Link2, color: 'from-cyan-600 to-cyan-700',
    title: 'Checklist Operacional', subtitle: 'Links e Estrutura',
    description: 'Centralizar todos os links e acessos necessários para a operação.',
    fields: [
      { key: 'instagram', label: '📷 Instagram', placeholder: 'https://instagram.com/...' },
      { key: 'facebook', label: '📘 Facebook', placeholder: 'https://facebook.com/...' },
      { key: 'dominio', label: '🌐 Domínio / Site', placeholder: 'https://...' },
      { key: 'youtube', label: '▶️ YouTube', placeholder: 'https://youtube.com/...' },
      { key: 'conta_anuncio', label: '📢 Conta de Anúncio (Meta/Google)', placeholder: 'ID da conta...' },
      { key: 'hospedagem', label: '🖥️ Hospedagem', placeholder: 'Provedor + acesso...' },
      { key: 'whatsapp', label: '💬 WhatsApp Business', placeholder: 'Número + link...' },
      { key: 'crm', label: '📋 CRM', placeholder: 'Plataforma + link de acesso...' },
      { key: 'landing_pages', label: '🏠 Landing Pages', placeholder: 'URLs das páginas...' },
    ],
    checks: null,
  },
  {
    id: 6, key: 'p5', emoji: '⚡', icon: Zap, color: 'from-yellow-600 to-yellow-700',
    title: 'Fast Traffic', subtitle: 'Preparação para lançamento imediato',
    description: 'Levantar criativos, provas sociais e verba para iniciar campanhas imediatamente.',
    fields: [
      { key: 'criativos', label: '🎨 Criativos solicitados', placeholder: 'Quais criativos foram pedidos, formatos, status...' },
      { key: 'provas_sociais', label: '⭐ Provas sociais levantadas', placeholder: 'Depoimentos, cases, screenshots coletados...' },
      { key: 'verba', label: '💰 Verba disponível para iniciar', placeholder: 'Valor aprovado para primeira campanha...' },
    ],
    checks: null,
  },
  {
    id: 7, key: 'p6', emoji: '🔐', icon: Lock, color: 'from-red-600 to-red-700',
    title: 'Acessos', subtitle: 'Controle operacional de acessos',
    description: 'Centralizar e controlar todos os acessos necessários para a operação.',
    fields: [
      { key: 'link_planilha', label: '📄 Link da Planilha de Acessos', placeholder: 'https://docs.google.com/...' },
    ],
    checks: null,
  },
  {
    id: 8, key: 'p7', emoji: '🎨', icon: Palette, color: 'from-pink-600 to-pink-700',
    title: 'Identidade Visual', subtitle: 'Assets e materiais da marca',
    description: 'Verificar disponibilidade de todos os materiais visuais necessários.',
    fields: [
      { key: 'link_logo', label: '🔗 Link da Logo', placeholder: 'https://drive.google.com/...' },
      { key: 'link_manual', label: '🔗 Link do Manual da Marca', placeholder: 'https://...' },
      { key: 'link_criativos', label: '🔗 Link dos Criativos', placeholder: 'https://drive.google.com/...' },
      { key: 'link_videos', label: '🔗 Link dos Vídeos', placeholder: 'https://...' },
      { key: 'link_fotos', label: '🔗 Link das Fotos', placeholder: 'https://drive.google.com/...' },
      { key: 'link_materiais', label: '🔗 Link dos Materiais Institucionais', placeholder: 'https://...' },
      { key: 'observacoes_vi', label: '📝 Observações', placeholder: 'Paleta de cores, fontes utilizadas, orientações...' },
    ],
    checks: [
      { key: 'logo', label: 'Logo (PNG/SVG em fundo transparente)' },
      { key: 'manual', label: 'Manual da marca / brand book' },
      { key: 'paleta', label: 'Paleta de cores (códigos HEX)' },
      { key: 'fontes', label: 'Fontes tipográficas' },
      { key: 'criativos_anteriores', label: 'Criativos anteriores de anúncios' },
      { key: 'videos', label: 'Vídeos institucionais / depoimentos' },
      { key: 'fotos', label: 'Fotos de produto / ambiente / equipe' },
      { key: 'materiais', label: 'Materiais institucionais (catálogo, flyer)' },
    ],
  },
  {
    id: 9, key: 'p9', emoji: '💰', icon: DollarSign, color: 'from-green-600 to-green-700',
    title: 'Budget de Mídia', subtitle: 'Planejamento financeiro de campanhas',
    description: 'Definir verba, canais e distribuição do investimento em mídia.',
    fields: [
      { key: 'verba_mensal', label: '📅 Verba mensal total', placeholder: 'R$ ...' },
      { key: 'verba_diaria', label: '📆 Verba diária', placeholder: 'R$ ... por dia' },
      { key: 'canais', label: '📡 Canais selecionados', placeholder: 'Meta, Google, TikTok...' },
      { key: 'divisao_canal', label: '📊 Divisão por canal (%)', placeholder: 'Meta 70%, Google 30%...' },
      { key: 'divisao_campanha', label: '🗂️ Divisão por campanha', placeholder: 'Topo 40%, Meio 30%, Fundo 30%...' },
    ],
    checks: null,
  },
  {
    id: 10, key: 'p10', emoji: '🏁', icon: Flag, color: 'from-indigo-600 to-indigo-700',
    title: 'Metas e Próximo Passo', subtitle: 'KPIs e roadmap de execução',
    description: 'Definir metas, KPIs, aprovações e próximas ações obrigatórias.',
    fields: [
      { key: 'meta_leads', label: '🎯 Meta de leads', placeholder: 'Ex: 200 leads/mês' },
      { key: 'meta_vendas', label: '🛒 Meta de vendas', placeholder: 'Ex: 30 vendas/mês' },
      { key: 'meta_faturamento', label: '💵 Meta de faturamento', placeholder: 'Ex: R$ 50.000/mês' },
      { key: 'kpi_principal', label: '📌 KPI principal', placeholder: 'Ex: CPL abaixo de R$ 25' },
      { key: 'kpi_secundario', label: '📌 KPI secundário', placeholder: 'Ex: CTR acima de 1.5%' },
      { key: 'apresentacao', label: '📊 Apresentação estratégica', placeholder: 'Link da apresentação...' },
      { key: 'proximas_reunioes', label: '📅 Próximas reuniões', placeholder: 'Datas e pautas...' },
      { key: 'pendencias', label: '⚠️ Pendências em aberto', placeholder: 'O que ainda está pendente...' },
      { key: 'aprovacoes', label: '✅ Aprovações necessárias', placeholder: 'O que precisa de aprovação...' },
    ],
    checks: null,
  },
]

function calcScore(phase: typeof PHASES[0], data: any): number {
  if (!data) return 0
  const prefix = `${phase.key}_`
  
  if (phase.checks) {
    const total = phase.checks.length
    const done = phase.checks.filter(c => data[`${prefix}${c.key}`]).length
    return Math.round((done / total) * 100)
  }
  
  const total = phase.fields.length
  if (total === 0) return data[`${prefix}concluido`] ? 100 : 0
  const filled = phase.fields.filter(f => data[`${prefix}${f.key}`]?.trim()).length
  return Math.round((filled / total) * 100)
}

function calcOverallScore(data: any): number {
  if (!data) return 0
  const scores = PHASES.map(p => calcScore(p, data))
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

function ScoreBadge({ score }: { score: number }) {
  const color = score === 100 ? 'text-green-400 bg-green-900/30 border-green-700/30' 
    : score >= 50 ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700/30'
    : score > 0 ? 'text-orange-400 bg-orange-900/30 border-orange-700/30'
    : 'text-gray-500 bg-gray-900/30 border-gray-700/30'
  return (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${color}`}>{score}%</span>
  )
}

export default function StrategicPlanning({ clients, selectedClientId, selectedClient, planning: initialPlanning }: Props) {
  const [form, setForm] = useState<Record<string, any>>(initialPlanning ?? {})
  const [activePhase, setActivePhase] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedPhase, setSavedPhase] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    setForm(initialPlanning ?? {})
  }, [initialPlanning])

  function set(key: string, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function savePhase(phase: typeof PHASES[0]) {
    if (!selectedClientId) return
    setSaving(true)
    const score = calcScore(phase, form)
    const payload: any = {
      client_id: selectedClientId,
      [`phase${phase.id}_score`]: score,
      updated_at: new Date().toISOString(),
    }
    
    // Collect all fields for this phase
    const prefix = `${phase.key}_`
    phase.fields.forEach(f => { payload[`${prefix}${f.key}`] = form[`${prefix}${f.key}`] ?? null })
    if (phase.checks) phase.checks.forEach(c => { payload[`${prefix}${c.key}`] = form[`${prefix}${c.key}`] ?? false })
    payload[`${prefix}responsavel`] = form[`${prefix}responsavel`] ?? null
    payload[`${prefix}prazo`] = form[`${prefix}prazo`] ?? null
    payload[`${prefix}concluido`] = form[`${prefix}concluido`] ?? false

    // p3b fields are stored with p3b_ prefix in the same table (needs SQL column additions)
    const { data: existing } = await supabase.from('strategic_planning').select('id').eq('client_id', selectedClientId).single()
    if (existing) {
      await supabase.from('strategic_planning').update(payload).eq('client_id', selectedClientId)
    } else {
      await supabase.from('strategic_planning').insert(payload)
    }
    
    setSaving(false)
    setSavedPhase(phase.key)
    setTimeout(() => setSavedPhase(null), 2000)
    router.refresh()
  }

  async function saveGlobal() {
    if (!selectedClientId) return
    setSaving(true)
    const payload = { gargalo_atual: form.gargalo_atual, proximo_passo: form.proximo_passo, updated_at: new Date().toISOString() }
    await supabase.from('strategic_planning').upsert({ client_id: selectedClientId, ...payload })
    setSaving(false)
    router.refresh()
  }

  const overallScore = calcOverallScore(form)
  const phasesCompleted = PHASES.filter(p => calcScore(p, form) === 100).length

  return (
    <div className="min-h-screen bg-gray-950">
      {/* TOP BAR */}
      <div className="bg-black border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Trophy size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-base">Planejamento Estratégico</h1>
              <p className="text-gray-500 text-xs">Central de Comando Operacional — uso interno</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedClientId && (
              <button
                onClick={() => {
                  const url = `/api/planning-pdf?client_id=${selectedClientId}`
                  const win = window.open(url, '_blank')
                  if (win) setTimeout(() => { try { win.print() } catch {} }, 1500)
                }}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 border border-white/10 text-white text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <FileDown size={14} /> Exportar PDF
              </button>
            )}
          {/* Client selector */}
          <div className="flex items-center gap-3">
            {selectedClientId && (
              <button
                onClick={() => {
                  const url = `/api/planning-pdf?client_id=${selectedClientId}`
                  const win = window.open(url, '_blank')
                  if (win) setTimeout(() => { try { win.print() } catch {} }, 1800)
                }}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white border border-white/10 text-xs px-4 py-2 rounded-lg transition-colors"
              >
                <Download size={14} /> Exportar PDF
              </button>
            )}
            <select
              className="bg-gray-900 border border-white/10 text-white text-sm px-4 py-2 rounded-lg focus:outline-none focus:border-red-500"
              value={selectedClientId}
              onChange={e => router.push(`/admin/planning?client=${e.target.value}`)}
            >
              <option value="">Selecionar cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          </div>
        </div>
      </div>

      {!selectedClientId ? (
        <div className="flex items-center justify-center h-80">
          <div className="text-center">
            <Trophy size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">Selecione um cliente para iniciar</p>
            <p className="text-gray-600 text-sm mt-1">O planejamento estratégico é exclusivo para uso interno da equipe</p>
          </div>
        </div>
      ) : (
        <div className="px-8 py-6 space-y-6">
          
          {/* MISSION CARD */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Rocket size={16} className="text-red-400" />
                  <span className="text-red-400 text-xs font-bold uppercase tracking-widest">Missão Principal</span>
                </div>
                <p className="text-white font-semibold text-base">
                  Levar {selectedClient?.name} do onboarding até campanhas escaláveis com previsibilidade e controle.
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-gray-500 text-xs mb-1">Score operacional</p>
                <p className="text-4xl font-black text-white">{overallScore}<span className="text-gray-500 text-xl">%</span></p>
                <p className="text-gray-600 text-xs mt-0.5">{phasesCompleted}/{PHASES.length} fases completas</p>
              </div>
            </div>

            {/* Overall progress bar */}
            <div className="mt-4">
              <div className="bg-gray-800 rounded-full h-3 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 relative overflow-hidden"
                  style={{ width: `${overallScore}%`, background: 'linear-gradient(90deg, #dc2626, #f97316, #eab308)' }}
                >
                  <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </div>
              </div>
              <div className="flex justify-between mt-1.5">
                <span className="text-xs text-gray-600">Início</span>
                <span className="text-xs text-gray-600">Escalável 🚀</span>
              </div>
            </div>
          </div>

          {/* GARGALO + PRÓXIMO PASSO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900 rounded-xl border border-yellow-600/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={14} className="text-yellow-400" />
                <span className="text-yellow-400 text-xs font-bold uppercase tracking-wide">Gargalo Atual</span>
              </div>
              <textarea
                className="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder-gray-600 min-h-[60px]"
                placeholder="Qual é o principal bloqueio agora?"
                value={form.gargalo_atual ?? ''}
                onChange={e => set('gargalo_atual', e.target.value)}
                onBlur={saveGlobal}
              />
            </div>
            <div className="bg-gray-900 rounded-xl border border-green-600/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <ChevronRight size={14} className="text-green-400" />
                <span className="text-green-400 text-xs font-bold uppercase tracking-wide">Próximo Passo Obrigatório</span>
              </div>
              <textarea
                className="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder-gray-600 min-h-[60px]"
                placeholder="Qual é a próxima ação que desbloqueia o projeto?"
                value={form.proximo_passo ?? ''}
                onChange={e => set('proximo_passo', e.target.value)}
                onBlur={saveGlobal}
              />
            </div>
          </div>

          {/* PHASE OVERVIEW GRID */}
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
            {PHASES.map(phase => {
              const score = calcScore(phase, form)
              const done = score === 100
              const started = score > 0
              return (
                <button
                  key={phase.id}
                  onClick={() => setActivePhase(activePhase === phase.id ? null : phase.id)}
                  className={`relative rounded-xl p-3 border text-left transition-all ${
                    activePhase === phase.id
                      ? 'border-red-500 bg-red-900/20'
                      : done ? 'border-green-600/30 bg-green-900/10'
                      : started ? 'border-yellow-600/30 bg-yellow-900/10'
                      : 'border-white/5 bg-gray-900 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xl">{phase.emoji}</span>
                    {done
                      ? <CheckCircle size={14} className="text-green-400" />
                      : started ? <div className="w-2 h-2 rounded-full bg-yellow-400 mt-1" />
                      : <Circle size={14} className="text-gray-700" />}
                  </div>
                  <p className="text-white text-xs font-semibold leading-tight">{phase.title}</p>
                  <div className="mt-2 bg-gray-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${score}%`, background: done ? '#22c55e' : '#dc2626' }}
                    />
                  </div>
                  <p className={`text-xs mt-1 font-bold ${done ? 'text-green-400' : started ? 'text-yellow-400' : 'text-gray-600'}`}>
                    {score}%
                  </p>
                </button>
              )
            })}
          </div>

          {/* PHASE DETAIL */}
          {PHASES.map(phase => {
            if (activePhase !== phase.id) return null
            const score = calcScore(phase, form)
            const prefix = `${phase.key}_`

            return (
              <div key={phase.id} className="bg-gray-900 rounded-2xl border border-white/10 overflow-hidden">
                {/* Phase header */}
                <div className={`bg-gradient-to-r ${phase.color} px-6 py-5`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{phase.emoji}</span>
                        <div>
                          <p className="text-white/70 text-xs uppercase tracking-widest">Fase {phase.id}</p>
                          <h2 className="text-white font-bold text-lg">{phase.title}</h2>
                        </div>
                      </div>
                      <p className="text-white/70 text-sm mt-1">{phase.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-3xl font-black text-white">{score}%</div>
                      <div className={`text-xs mt-0.5 ${score === 100 ? 'text-green-300' : 'text-white/60'}`}>
                        {score === 100 ? '✓ Completo' : 'Em progresso'}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-black/20 rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-white/80 rounded-full transition-all" style={{ width: `${score}%` }} />
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {/* Checkboxes (Phase 7) */}
                  {phase.checks && (
                    <div className="grid grid-cols-2 gap-2">
                      {phase.checks.map(check => {
                        const checked = form[`${prefix}${check.key}`] ?? false
                        return (
                          <label key={check.key}
                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${checked ? 'border-green-600/30 bg-green-900/10' : 'border-white/5 bg-gray-800 hover:border-white/20'}`}>
                            <div onClick={() => set(`${prefix}${check.key}`, !checked)}
                              className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${checked ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                              {checked && <CheckCircle size={12} className="text-white" />}
                            </div>
                            <span className={`text-sm ${checked ? 'text-green-300' : 'text-gray-300'}`}>{check.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}

                  {/* Text fields */}
                  {phase.fields.map(field => {
                    const isUrl = field.key.startsWith('link_')
                    const val = form[`${prefix}${field.key}`] ?? ''
                    return (
                      <div key={field.key}>
                        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{field.label}</label>
                        {isUrl ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="url"
                              className="flex-1 bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-red-500"
                              placeholder={field.placeholder}
                              value={val}
                              onChange={e => set(`${prefix}${field.key}`, e.target.value)}
                            />
                            {val && (
                              <a href={val} target="_blank" rel="noopener"
                                className="flex-shrink-0 flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-3 rounded-xl transition-colors">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                Abrir
                              </a>
                            )}
                          </div>
                        ) : (
                          <textarea
                            className="w-full bg-gray-800 border border-white/10 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-red-500 resize-none min-h-[80px]"
                            placeholder={field.placeholder}
                            value={val}
                            onChange={e => set(`${prefix}${field.key}`, e.target.value)}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Meta fields */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <User size={11} /> Responsável
                      </label>
                      <input
                        className="w-full bg-gray-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
                        placeholder="Nome..."
                        value={form[`${prefix}responsavel`] ?? ''}
                        onChange={e => set(`${prefix}responsavel`, e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                        <Clock size={11} /> Prazo
                      </label>
                      <input
                        type="date"
                        className="w-full bg-gray-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500"
                        value={form[`${prefix}prazo`] ?? ''}
                        onChange={e => set(`${prefix}prazo`, e.target.value)}
                      />
                    </div>
                    <div className="flex items-end">
                      <label className={`flex items-center gap-2 cursor-pointer p-2 rounded-lg border transition-all w-full ${form[`${prefix}concluido`] ? 'border-green-600/30 bg-green-900/10' : 'border-white/10'}`}>
                        <div
                          onClick={() => set(`${prefix}concluido`, !form[`${prefix}concluido`])}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${form[`${prefix}concluido`] ? 'bg-green-500 border-green-500' : 'border-gray-600'}`}>
                          {form[`${prefix}concluido`] && <CheckCircle size={12} className="text-white" />}
                        </div>
                        <span className="text-xs text-gray-300">Marcar como concluído</span>
                      </label>
                    </div>
                  </div>

                  {/* Save button */}
                  <button
                    onClick={() => savePhase(phase)}
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60"
                  >
                    <Save size={15} />
                    {savedPhase === phase.key ? '✓ Salvo!' : saving ? 'Salvando...' : `Salvar Fase ${phase.id}`}
                  </button>
                </div>
              </div>
            )
          })}

          {/* BOTTOM SCOREBOARD */}
          <div className="bg-gray-900 rounded-2xl border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={16} className="text-yellow-400" />
              <h3 className="text-white font-semibold text-sm">Scoreboard da Operação</h3>
            </div>
            <div className="space-y-2">
              {PHASES.map(phase => {
                const score = calcScore(phase, form)
                const responsible = form[`${phase.key}_responsavel`]
                const deadline = form[`${phase.key}_prazo`]
                return (
                  <div key={phase.id} className="flex items-center gap-3">
                    <span className="w-6 text-center text-sm">{phase.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-400 truncate">{phase.title}</span>
                        <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                          {responsible && <span className="text-xs text-gray-600 hidden sm:block">{responsible}</span>}
                          {deadline && <span className="text-xs text-gray-600 hidden sm:block">{new Date(deadline).toLocaleDateString('pt-BR')}</span>}
                          <ScoreBadge score={score} />
                        </div>
                      </div>
                      <div className="bg-gray-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${score}%`, background: score === 100 ? '#22c55e' : score >= 50 ? '#eab308' : '#dc2626' }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-gray-400 text-sm font-medium">Score Total</span>
              <div className="flex items-center gap-3">
                <div className="bg-gray-800 rounded-full h-2 w-32 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${overallScore}%`, background: 'linear-gradient(90deg, #dc2626, #f97316, #eab308)' }} />
                </div>
                <span className="text-white font-black text-xl">{overallScore}%</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
