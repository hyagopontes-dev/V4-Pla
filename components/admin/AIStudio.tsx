'use client'
import { useState } from 'react'
import { Sparkles, Copy, Check, RefreshCw, ChevronDown } from 'lucide-react'

interface Client {
  id: string
  name: string
  slug: string
  scope_description?: string
  about?: string
}

interface Props { clients: Client[] }

const TYPES = [
  {
    key: 'copy_criativo',
    label: 'Copy de Criativo',
    icon: '🎨',
    description: 'Texto para imagem ou vídeo nas redes sociais',
    fields: ['Produto/Serviço a destacar', 'Tom de voz', 'CTA desejado'],
  },
  {
    key: 'roteiro_reel',
    label: 'Roteiro de Reel',
    icon: '🎬',
    description: 'Roteiro completo com gancho, desenvolvimento e CTA',
    fields: ['Tema do vídeo', 'Duração (ex: 30s, 60s)', 'Objetivo'],
  },
  {
    key: 'legenda_post',
    label: 'Legenda de Post',
    icon: '📝',
    description: 'Legenda completa com hashtags para feed ou carrossel',
    fields: ['Assunto do post', 'Tom de voz', 'Incluir hashtags?'],
  },
  {
    key: 'carrossel',
    label: 'Conteúdo de Carrossel',
    icon: '🖼️',
    description: 'Textos slide a slide para carrossel no Instagram',
    fields: ['Tema', 'Quantidade de slides', 'Objetivo educativo ou de venda?'],
  },
  {
    key: 'story',
    label: 'Sequência de Stories',
    icon: '📱',
    description: 'Sequência de stories para engajamento ou venda',
    fields: ['Objetivo', 'Produto/Serviço', 'Incluir enquete/CTA?'],
  },
  {
    key: 'bio',
    label: 'Bio do Instagram',
    icon: '✍️',
    description: 'Bio otimizada para conversão no Instagram',
    fields: ['Diferencial principal', 'Público-alvo', 'Link da bio'],
  },
]

function buildPrompt(type: string, client: Client, extra: string[], inputs: string[]): string {
  const context = [
    client.about ? `Empresa: ${client.about}` : `Cliente: ${client.name}`,
    client.scope_description ? `Escopo: ${client.scope_description}` : '',
  ].filter(Boolean).join('\n')

  const fieldLines = extra.map((label, i) => `${label}: ${inputs[i] || 'não informado'}`).join('\n')

  const prompts: Record<string, string> = {
    copy_criativo: `Você é um copywriter especialista em marketing digital brasileiro.
Crie uma copy de criativo (para imagem ou vídeo) para redes sociais.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO:
- Gancho (primeira linha impactante)
- Texto principal (2-3 linhas)
- CTA claro

Escreva em português brasileiro. Tom direto, humano e persuasivo. Evite clichês.`,

    roteiro_reel: `Você é um roteirista especialista em vídeos curtos para Instagram e TikTok.
Crie um roteiro de Reel completo e detalhado.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO DO ROTEIRO:
[GANCHO - 0 a 3s]: texto do gancho
[DESENVOLVIMENTO]: pontos principais com tempo estimado
[VIRADA/SACADA]: o momento "aha" do vídeo
[CTA]: chamada para ação final

Use marcadores de tempo. Tom conversacional e autêntico.`,

    legenda_post: `Você é um copywriter especialista em redes sociais brasileiras.
Crie uma legenda completa para um post no Instagram.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO:
- Primeira linha (gancho - aparece antes do "ver mais")
- Desenvolvimento do texto
- CTA
- Hashtags relevantes (se solicitado)

Tom humanizado, sem exageros. Máximo 2200 caracteres.`,

    carrossel: `Você é um especialista em conteúdo educativo e de vendas para Instagram.
Crie os textos de um carrossel completo slide a slide.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO (para cada slide):
SLIDE 1 (CAPA): título impactante
SLIDE 2: ...
...
SLIDE FINAL: CTA

Seja direto. Cada slide deve ter no máximo 2-3 linhas de texto.`,

    story: `Você é especialista em estratégia de Stories para Instagram.
Crie uma sequência de Stories engajadora.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO (para cada story):
STORY 1: [tipo: texto/pergunta/imagem] - conteúdo
STORY 2: ...

Use recursos como enquetes, caixas de perguntas e CTAs. Máximo 10 stories.`,

    bio: `Você é especialista em otimização de perfis no Instagram para conversão.
Crie uma bio completa e otimizada.

CONTEXTO DO CLIENTE:
${context}

BRIEFING:
${fieldLines}

FORMATO:
- Linha 1: quem você é / o que faz (com emoji)
- Linha 2: resultado/benefício para o cliente
- Linha 3: prova social ou diferencial
- Linha 4: CTA + link

Máximo 150 caracteres no total. Use emojis estrategicamente.`,
  }

  return prompts[type] ?? prompts.copy_criativo
}

export default function AIStudio({ clients }: Props) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [selectedType, setSelectedType] = useState(TYPES[0])
  const [inputs, setInputs] = useState<string[]>(['', '', ''])
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    if (!selectedClient) { setError('Selecione um cliente.'); return }
    setLoading(true)
    setError('')
    setResult('')

    try {
      const prompt = buildPrompt(selectedType.key, selectedClient, selectedType.fields, inputs)

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      const data = await response.json()
      const text = data.content?.map((c: any) => c.text).join('') ?? ''
      if (!text) throw new Error('Resposta vazia')
      setResult(text)
    } catch (e: any) {
      setError('Erro ao gerar: ' + (e.message ?? 'tente novamente'))
    }
    setLoading(false)
  }

  async function copy() {
    await navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">IA Studio</h1>
          <p className="text-gray-500 text-sm">Gere copy e roteiros com IA para seus clientes</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* LEFT — Config */}
        <div className="col-span-1 space-y-4">

          {/* Cliente */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Cliente</h3>
            <div className="relative">
              <select
                className="input appearance-none pr-8"
                value={selectedClient?.id ?? ''}
                onChange={e => {
                  const c = clients.find(c => c.id === e.target.value) ?? null
                  setSelectedClient(c)
                  setResult('')
                }}
              >
                <option value="">Selecione um cliente</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {selectedClient?.about && (
              <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg p-2 leading-relaxed line-clamp-3">
                {selectedClient.about}
              </p>
            )}
          </div>

          {/* Tipo */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Tipo de conteúdo</h3>
            <div className="space-y-1.5">
              {TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => { setSelectedType(t); setInputs(['', '', '']); setResult('') }}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2.5 ${
                    selectedType.key === t.key
                      ? 'bg-red-600 text-white'
                      : 'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span>{t.icon}</span>
                  <div>
                    <p className="font-medium text-xs">{t.label}</p>
                    <p className={`text-xs mt-0.5 ${selectedType.key === t.key ? 'text-red-200' : 'text-gray-400'}`}>
                      {t.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Form + Result */}
        <div className="col-span-2 space-y-4">

          {/* Briefing */}
          <div className="card">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Briefing — {selectedType.label}
            </h3>
            <div className="space-y-3">
              {selectedType.fields.map((field, i) => (
                <div key={i}>
                  <label className="label">{field}</label>
                  <input
                    className="input"
                    placeholder={`Ex: ${field === 'Tom de voz' ? 'descontraído, profissional, inspirador...' : field === 'CTA desejado' ? 'Fale com a gente, Acesse o link...' : field}`}
                    value={inputs[i] ?? ''}
                    onChange={e => {
                      const next = [...inputs]
                      next[i] = e.target.value
                      setInputs(next)
                    }}
                  />
                </div>
              ))}
            </div>
            {error && <p className="text-red-500 text-xs mt-3 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
            <button
              onClick={generate}
              disabled={loading || !selectedClient}
              className="btn-primary mt-4 flex items-center gap-2 disabled:opacity-60 w-full justify-center"
            >
              {loading ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles size={15} />
                  Gerar com IA
                </>
              )}
            </button>
          </div>

          {/* Result */}
          {result && (
            <div className="card border-red-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Resultado gerado
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={generate}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-3 py-1.5 rounded-lg"
                  >
                    <RefreshCw size={12} /> Gerar novamente
                  </button>
                  <button
                    onClick={copy}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                      copied
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-900 text-white border-gray-900 hover:bg-gray-700'
                    }`}
                  >
                    {copied ? <><Check size={12} /> Copiado!</> : <><Copy size={12} /> Copiar</>}
                  </button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {result}
                </pre>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!result && !loading && (
            <div className="card border-dashed text-center py-12">
              <Sparkles size={32} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">
                {!selectedClient
                  ? 'Selecione um cliente para começar'
                  : 'Preencha o briefing e clique em "Gerar com IA"'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
