'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle, ChevronRight, ChevronLeft, Send } from 'lucide-react'

interface Client { id: string; name: string; slug: string; logo_url?: string }
interface Props { client: Client; alreadySubmitted: boolean; submittedAt?: string }

const SECTIONS = [
  {
    title: 'Sobre a empresa e a marca',
    emoji: '🏢',
    color: 'from-red-600 to-red-700',
    fields: [
      { key: 'alma_negocio', label: 'A alma do negócio', question: 'Como você descreveria o que sua empresa faz em apenas uma frase curta?' },
      { key: 'comeco_tudo', label: 'O começo de tudo', question: 'Por que você decidiu criar este negócio? Qual era o objetivo principal?' },
      { key: 'jeito_ser', label: 'Jeito de ser', question: 'Se a sua empresa fosse uma pessoa, como ela falaria? (Ex: séria, engraçada, direta ao ponto, acolhedora)' },
      { key: 'valores', label: 'Valores', question: 'O que é proibido ou o que você nunca faria na sua empresa, não importa o que aconteça?' },
      { key: 'inspiracao', label: 'Inspiração', question: 'Existe alguma outra empresa ou perfil na internet que você olha e pensa: "gostaria que o meu perfil passasse essa mesma sensação"?' },
    ]
  },
  {
    title: 'Sobre o produto e quem compra',
    emoji: '🛍️',
    color: 'from-orange-600 to-orange-700',
    fields: [
      { key: 'o_que_vende', label: 'O que você vende', question: 'Quais são os seus produtos ou serviços que mais dão dinheiro ou que você mais quer vender agora?' },
      { key: 'cliente_ideal', label: 'O cliente ideal', question: 'Para quem você vende? Descreva uma pessoa real: qual a idade dela, o que ela faz da vida e o que ela gosta de fazer no tempo livre?' },
      { key: 'problema_resolve', label: 'O problema que você resolve', question: 'Qual é a maior dificuldade que seu cliente tem hoje e que o seu produto resolve?' },
      { key: 'perguntas_frequentes', label: 'Perguntas frequentes', question: 'O que os clientes mais perguntam para você antes de decidirem comprar?' },
    ]
  },
  {
    title: 'Concorrência e Diferenciais',
    emoji: '🏆',
    color: 'from-blue-600 to-blue-700',
    fields: [
      { key: 'quem_sao_concorrentes', label: 'Quem são os vizinhos', question: 'Quem são as outras empresas que vendem a mesma coisa que você e que estão ativas na internet?' },
      { key: 'por_que_voce', label: 'Por que você', question: 'Se um cliente tiver o seu produto e o do concorrente na frente dele, por que ele deve escolher o seu?' },
      { key: 'o_que_evitar', label: 'O que evitar', question: 'Tem algo que seus concorrentes fazem nas redes sociais que você acha ruim ou que não quer que a gente repita?' },
    ]
  },
  {
    title: 'Produção de Conteúdo',
    emoji: '🎬',
    color: 'from-purple-600 to-purple-700',
    fields: [
      { key: 'fotos_videos', label: 'Fotos e Vídeos', question: 'Você ou alguém da sua equipe consegue gravar vídeos simples e tirar fotos do dia a dia com frequência?' },
      { key: 'quem_aprova', label: 'Quem manda', question: 'Quem será a pessoa responsável por olhar o que criamos e dizer "está aprovado"?' },
      { key: 'o_que_ja_foi_feito', label: 'O que já foi feito', question: 'Você já tentou vender pelas redes sociais antes? O que funcionou e o que não funcionou?' },
    ]
  },
  {
    title: 'Objetivos e Resultados',
    emoji: '🎯',
    color: 'from-green-600 to-green-700',
    fields: [
      { key: 'sonho_curto_prazo', label: 'Sonho de curto prazo', question: 'Daqui a 3 ou 6 meses, o que precisa ter acontecido para você sentir que nosso trabalho valeu a pena?' },
      { key: 'o_que_medir', label: 'O que vamos medir', question: 'Para você, o que é mais importante: ter muitos seguidores, receber muitas mensagens de interessados ou o número de vendas no final do mês?' },
      { key: 'dinheiro_anuncios', label: 'Dinheiro para anúncios', question: 'Quanto você pretende investir por semana para que o Facebook e o Instagram mostrem seus posts para mais pessoas?' },
    ]
  },
  {
    title: 'Métricas e Financeiro',
    emoji: '💰',
    color: 'from-yellow-600 to-yellow-700',
    fields: [
      { key: 'faturamento_atual', label: 'Faturamento atual', question: 'Qual o faturamento médio mensal atual?' },
      { key: 'meta_faturamento', label: 'Meta de faturamento', question: 'Qual a meta de faturamento para os próximos 3 e 6 meses?' },
      { key: 'ticket_medio', label: 'Ticket médio', question: 'Qual o ticket médio por cliente?' },
      { key: 'produto_mais_vende', label: 'Produto que mais vende', question: 'Qual produto ou serviço mais vende hoje?' },
      { key: 'produto_mais_lucro', label: 'Produto mais lucrativo', question: 'Qual produto ou serviço dá mais lucro?' },
      { key: 'margem_lucro', label: 'Margem de lucro', question: 'Qual a margem de lucro média?' },
      { key: 'cac', label: 'CAC', question: 'Quanto custa, em média, conquistar um novo cliente?' },
      { key: 'cpl', label: 'CPL', question: 'Quanto custa, em média, gerar um lead?' },
      { key: 'taxa_conversao', label: 'Taxa de conversão', question: 'De cada 10 leads, quantos viram clientes?' },
      { key: 'tempo_fechamento', label: 'Tempo de fechamento', question: 'Em quanto tempo, em média, uma venda é fechada?' },
      { key: 'recorrencia', label: 'Recorrência', question: 'O cliente costuma comprar mais de uma vez ou é venda única?' },
      { key: 'investimento_marketing', label: 'Investimento em marketing', question: 'Quanto é investido hoje em marketing e anúncios?' },
      { key: 'canal_principal', label: 'Canal principal', question: 'Qual canal mais gera vendas hoje? (Instagram, indicação, Google, WhatsApp, etc.)' },
      { key: 'principal_gargalo', label: 'Principal gargalo', question: 'Qual o principal gargalo hoje: gerar leads, fechar vendas ou operação?' },
    ]
  },
  {
    title: 'Combinados e Acessos',
    emoji: '🤝',
    color: 'from-gray-700 to-gray-800',
    fields: [
      { key: 'reunioes', label: 'Reuniões', question: 'Podemos confirmar nossas conversas de acompanhamento toda quinta-feira, no mesmo horário?' },
      { key: 'whatsapp', label: 'Conversa rápida', question: 'Podemos usar o WhatsApp para resolver dúvidas urgentes do dia a dia?' },
      { key: 'contatos', label: 'Contatos', question: 'Se o dono não estiver, quem é a pessoa de confiança que podemos procurar?' },
      { key: 'acessos', label: 'Chaves da casa', question: 'Você já tem os acessos ou sabe como nos dar permissão para gerenciar seu Instagram, Facebook, TikTok e a sua ficha no Google?' },
      { key: 'materiais', label: 'Materiais', question: 'Você tem uma pasta com seu logotipo, fotos dos produtos e manuais de como usar a sua marca?' },
    ]
  },
]

export default function KickoffForm({ client, alreadySubmitted, submittedAt }: Props) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  if (alreadySubmitted || done) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
          {client.logo_url && <img src={client.logo_url} alt={client.name} className="h-16 object-contain mx-auto mb-4" />}
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Kick-off preenchido!</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Suas respostas foram salvas com sucesso.
            {submittedAt && <span className="block mt-1 text-xs text-gray-400">Enviado em {new Date(submittedAt).toLocaleDateString('pt-BR')}</span>}
          </p>
          <p className="text-xs text-gray-400 mt-4">A equipe da v4 Company já pode acessar suas informações.</p>
        </div>
      </div>
    )
  }

  const section = SECTIONS[step]
  const totalFields = SECTIONS.reduce((acc, s) => acc + s.fields.length, 0)
  const filledBefore = SECTIONS.slice(0, step).reduce((acc, s) => acc + s.fields.length, 0)
  const progress = Math.round((filledBefore / totalFields) * 100)

  async function handleSubmit() {
    setSubmitting(true)
    await supabase.from('kickoff_responses').insert({ client_id: client.id, ...form })
    setSubmitting(false)
    setDone(true)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className={`bg-gradient-to-r ${section.color} text-white`}>
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="flex items-center gap-3 mb-4">
            {client.logo_url
              ? <img src={client.logo_url} alt={client.name} className="h-9 object-contain bg-white/10 rounded-lg p-1" />
              : <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center font-bold">{client.name[0]}</div>}
            <div>
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">Kick-off</p>
              <p className="text-white font-semibold text-sm">{client.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{section.emoji}</span>
            <div>
              <p className="text-white/70 text-xs mb-0.5">Etapa {step + 1} de {SECTIONS.length}</p>
              <h1 className="text-xl font-bold">{section.title}</h1>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-white/60 text-xs mt-1">{progress}% concluído</p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {section.fields.map(field => (
          <div key={field.key} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <label className="block text-sm font-semibold text-gray-800 mb-1">{field.label}</label>
            <p className="text-gray-500 text-sm mb-3 leading-relaxed">{field.question}</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none min-h-[100px]"
              placeholder="Escreva aqui..."
              value={form[field.key] ?? ''}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            />
          </div>
        ))}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 px-4 py-2.5 rounded-xl transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>

          {step < SECTIONS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors"
            >
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-60"
            >
              <Send size={15} /> {submitting ? 'Enviando...' : 'Enviar kick-off'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
