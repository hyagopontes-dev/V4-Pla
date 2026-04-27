'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { KickoffResponse } from '@/types'
import { ExternalLink, Trash2, ClipboardList, Copy, Check } from 'lucide-react'

interface Props { clientId: string; clientSlug: string; response: KickoffResponse | null }

const SECTIONS = [
  { title: 'Empresa e Marca', emoji: '🏢', fields: [
    ['alma_negocio','A alma do negócio'],['comeco_tudo','O começo de tudo'],
    ['jeito_ser','Jeito de ser'],['valores','Valores'],['inspiracao','Inspiração'],
  ]},
  { title: 'Produto e Clientes', emoji: '🛍️', fields: [
    ['o_que_vende','O que vende'],['cliente_ideal','Cliente ideal'],
    ['problema_resolve','Problema que resolve'],['perguntas_frequentes','Perguntas frequentes'],
  ]},
  { title: 'Concorrência', emoji: '🏆', fields: [
    ['quem_sao_concorrentes','Concorrentes'],['por_que_voce','Por que você'],['o_que_evitar','O que evitar'],
  ]},
  { title: 'Produção de Conteúdo', emoji: '🎬', fields: [
    ['fotos_videos','Fotos e vídeos'],['quem_aprova','Quem aprova'],['o_que_ja_foi_feito','O que já foi feito'],
  ]},
  { title: 'Objetivos', emoji: '🎯', fields: [
    ['sonho_curto_prazo','Sonho de curto prazo'],['o_que_medir','O que medir'],['dinheiro_anuncios','Verba para anúncios'],
  ]},
  { title: 'Métricas e Financeiro', emoji: '💰', fields: [
    ['faturamento_atual','Faturamento atual'],['meta_faturamento','Meta de faturamento'],
    ['ticket_medio','Ticket médio'],['produto_mais_vende','Produto que mais vende'],
    ['produto_mais_lucro','Produto mais lucrativo'],['margem_lucro','Margem de lucro'],
    ['cac','CAC'],['cpl','CPL'],['taxa_conversao','Taxa de conversão'],
    ['tempo_fechamento','Tempo de fechamento'],['recorrencia','Recorrência'],
    ['investimento_marketing','Investimento em marketing'],['canal_principal','Canal principal'],
    ['principal_gargalo','Principal gargalo'],
  ]},
  { title: 'Combinados e Acessos', emoji: '🤝', fields: [
    ['reunioes','Reuniões'],['whatsapp','WhatsApp'],['contatos','Contatos'],
    ['acessos','Acessos'],['materiais','Materiais'],
  ]},
]

export default function KickoffViewer({ clientId, clientSlug, response: initial }: Props) {
  const [response, setResponse] = useState(initial)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const kickoffUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/kickoff?client=${clientSlug}`

  async function handleDelete() {
    if (!confirm('Deletar as respostas do kick-off? O cliente poderá preencher novamente.')) return
    setDeleting(true)
    await supabase.from('kickoff_responses').delete().eq('client_id', clientId)
    setResponse(null)
    setDeleting(false)
  }

  async function copyLink() {
    await navigator.clipboard.writeText(kickoffUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <ClipboardList size={15} className="text-red-500" />
          <h2 className="font-medium text-gray-900">Kick-off</h2>
          {response && (
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Preenchido em {new Date(response.submitted_at).toLocaleDateString('pt-BR')}
            </span>
          )}
          {!response && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Aguardando preenchimento</span>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyLink}
            className="flex items-center gap-1.5 text-xs border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors text-gray-600">
            {copied ? <><Check size={12} className="text-green-600" /> Copiado!</> : <><Copy size={12} /> Copiar link</>}
          </button>
          <a href={kickoffUrl} target="_blank" rel="noopener"
            className="flex items-center gap-1.5 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg transition-colors">
            <ExternalLink size={12} /> Abrir formulário
          </a>
          {response && (
            <button onClick={handleDelete} disabled={deleting}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
              <Trash2 size={12} /> {deleting ? 'Deletando...' : 'Deletar respostas'}
            </button>
          )}
        </div>
      </div>

      {!response ? (
        <div className="p-10 text-center">
          <ClipboardList size={36} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm font-medium mb-1">Formulário ainda não preenchido</p>
          <p className="text-gray-400 text-xs mb-4">Compartilhe o link abaixo com o cliente para ele preencher o kick-off.</p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex items-center gap-3 max-w-lg mx-auto">
            <span className="text-xs text-gray-500 font-mono flex-1 truncate">{kickoffUrl}</span>
            <button onClick={copyLink}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg flex-shrink-0">
              {copied ? <><Check size={11} /> Copiado</> : <><Copy size={11} /> Copiar</>}
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-gray-50">
          {SECTIONS.map(section => {
            const filled = section.fields.filter(([k]) => (response as any)[k])
            if (!filled.length) return null
            return (
              <div key={section.title} className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{section.emoji}</span>
                  <h3 className="font-semibold text-gray-800 text-sm">{section.title}</h3>
                  <span className="text-xs text-gray-400">{filled.length}/{section.fields.length} respostas</span>
                </div>
                <div className="space-y-4">
                  {section.fields.map(([key, label]) => {
                    const value = (response as any)[key]
                    if (!value) return null
                    return (
                      <div key={key} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{value}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
