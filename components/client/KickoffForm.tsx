'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CheckCircle, ChevronRight, ChevronLeft, Send } from 'lucide-react'

interface Client { id: string; name: string; slug: string; logo_url?: string }
interface Props { client: Client; alreadySubmitted: boolean; submittedAt?: string }

const SECTIONS = [
  {
    title: 'Sobre a Empresa',
    emoji: '🏢',
    color: 'from-red-600 to-red-700',
    fields: [
      { key: 'sobre_empresa', question: 'Primeiramente, conte um pouco sobre a empresa para que possamos entender mais sobre vocês.' },
      { key: 'alma_negocio', question: 'Como você descreveria o que sua empresa faz em apenas uma frase curta?' },
      { key: 'comeco_tudo', question: 'Por que você decidiu criar este negócio lá no início? Qual era o objetivo principal?' },
      { key: 'valores', question: 'O que é proibido ou o que você nunca faria na sua empresa, não importa o que aconteça?' },
      { key: 'inspiracao', question: 'Existe alguma outra empresa ou perfil na internet que você olha e pensa: "gostaria que o meu perfil passasse essa mesma sensação"?' },
    ]
  },
  {
    title: 'Análise S.W.O.T',
    emoji: '📊',
    color: 'from-blue-700 to-blue-800',
    fields: [
      { key: 'swot_forcas', question: 'Forças: Quais são os pontos fortes da sua empresa? O que vocês fazem melhor que os concorrentes?' },
      { key: 'swot_fraquezas', question: 'Fraquezas: Quais são os pontos fracos ou limitações da empresa que precisam melhorar?' },
      { key: 'swot_oportunidades', question: 'Oportunidades: Quais tendências ou situações externas podem ser aproveitadas pelo negócio?' },
      { key: 'swot_ameacas', question: 'Ameaças: Quais fatores externos podem prejudicar o crescimento da empresa?' },
    ]
  },
  {
    title: 'Clientes e Públicos',
    emoji: '👥',
    color: 'from-orange-600 to-orange-700',
    fields: [
      { key: 'cliente_ideal', question: 'Tente descrever seu cliente ideal: qual a idade dele, o que ele faz da vida e o que ele gosta de fazer no tempo livre?' },
      { key: 'problema_resolve', question: 'Qual é a maior dificuldade que seu cliente tem hoje e que o seu produto resolve?' },
      { key: 'publico_1', question: 'Público 1: Descreva um perfil de público levando em consideração Sexo › Idade › Renda › Filhos › Profissões › Interesses (Livros, Eventos, Documentários, Sites, Marcas) › Localidade › Peculiaridades regionais.' },
      { key: 'publico_2', question: 'Público 2: Descreva um perfil de público levando em consideração Sexo › Idade › Renda › Filhos › Profissões › Interesses › Localidade › Peculiaridades regionais.' },
      { key: 'publico_3', question: 'Público 3 (opcional): Descreva um perfil de público levando em consideração Sexo › Idade › Renda › Filhos › Profissões › Interesses › Localidade › Peculiaridades regionais.' },
    ]
  },
  {
    title: 'Diferenciais e Concorrência',
    emoji: '🏆',
    color: 'from-purple-600 to-purple-700',
    fields: [
      { key: 'puv', question: 'PUV — Proposta Única de Valor: Pense global ou por produto. O que te faz diferente dos demais concorrentes?' },
      { key: 'perguntas_frequentes', question: 'O que os clientes mais perguntam para você antes de decidirem comprar?' },
      { key: 'quem_sao_concorrentes', question: 'Quem são as outras empresas que vendem a mesma coisa que você e que estão ativas na internet?' },
      { key: 'por_que_voce', question: 'Se um cliente tiver o seu produto e o do concorrente na frente dele, por que ele deve escolher o seu?' },
      { key: 'o_que_evitar', question: 'Tem algo que seus concorrentes fazem nas redes sociais que você não goste ou que não quer que a gente repita?' },
    ]
  },
  {
    title: 'Produção e Conteúdo',
    emoji: '🎬',
    color: 'from-pink-600 to-pink-700',
    fields: [
      { key: 'fotos_videos', question: 'Você ou alguém da sua equipe consegue gravar vídeos simples e tirar fotos do dia a dia com frequência?' },
      { key: 'quem_aprova', question: 'Quem será a pessoa responsável por aprovar os conteúdos enviados?' },
      { key: 'o_que_ja_foi_feito', question: 'Você já tentou vender pelas redes sociais antes? O que funcionou e o que não funcionou?' },
    ]
  },
  {
    title: 'Objetivos e Combinados',
    emoji: '🎯',
    color: 'from-green-600 to-green-700',
    fields: [
      { key: 'objetivo_v4', question: 'Qual o principal objetivo que a empresa deseja alcançar com a v4 Company?' },
      { key: 'sonho_curto_prazo', question: 'Daqui a 3 ou 6 meses, o que precisa ter acontecido para você sentir que nosso trabalho valeu a pena?' },
      { key: 'reuniao_horario', question: 'Qual dia e horário podemos agendar as nossas reuniões de alinhamento?' },
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
    <div className="min-h-screen" style={{ background: "#f5f5f0", color: "#111111" }}>
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
          <div className="mt-4 bg-white/20 rounded-full h-1.5">
            <div className="bg-white rounded-full h-1.5 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-white/60 text-xs mt-1">{progress}% concluído</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {section.fields.map(field => (
          <div key={field.key} style={{ background: "#ffffff", borderRadius: "16px", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb" }}>
            <p style={{ color: "#111111", fontSize: "14px", fontWeight: 500, marginBottom: "12px", lineHeight: 1.6 }}>{field.question}</p>
            <textarea
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none min-h-[110px]"
              style={{ background: '#ffffff', color: '#111111' }}
              placeholder="Escreva aqui..."
              value={form[field.key] ?? ''}
              onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="flex items-center justify-between pt-2 pb-8">
          <button onClick={() => setStep(s => s - 1)} disabled={step === 0}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed border border-gray-200 px-4 py-2.5 rounded-xl transition-colors">
            <ChevronLeft size={16} /> Anterior
          </button>
          {step < SECTIONS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)}
              className="flex items-center gap-2 text-sm bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors">
              Próximo <ChevronRight size={16} />
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center gap-2 text-sm bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-60">
              <Send size={15} /> {submitting ? 'Enviando...' : 'Enviar kick-off'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
