'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { KickoffResponse } from '@/types'
import { ExternalLink, Trash2, ClipboardList, Copy, Check, Download } from 'lucide-react'

interface Props { clientId: string; clientSlug: string; response: KickoffResponse | null }

const SECTIONS = [
  { title: 'Sobre a Empresa', emoji: '🏢', fields: [
    ['sobre_empresa','Sobre a empresa'],['alma_negocio','Frase curta'],
    ['comeco_tudo','Por que criou o negócio'],['valores','Valores / proibições'],['inspiracao','Inspiração'],
  ]},
  { title: 'Análise S.W.O.T', emoji: '📊', fields: [
    ['swot_forcas','Forças'],['swot_fraquezas','Fraquezas'],
    ['swot_oportunidades','Oportunidades'],['swot_ameacas','Ameaças'],
  ]},
  { title: 'Clientes e Públicos', emoji: '👥', fields: [
    ['cliente_ideal','Cliente ideal'],['problema_resolve','Problema que resolve'],
    ['publico_1','Público 1'],['publico_2','Público 2'],['publico_3','Público 3'],
  ]},
  { title: 'Diferenciais e Concorrência', emoji: '🏆', fields: [
    ['puv','PUV — Proposta Única de Valor'],['perguntas_frequentes','Perguntas frequentes'],
    ['quem_sao_concorrentes','Concorrentes'],['por_que_voce','Por que você'],['o_que_evitar','O que evitar'],
  ]},
  { title: 'Produção e Conteúdo', emoji: '🎬', fields: [
    ['fotos_videos','Fotos e vídeos'],['quem_aprova','Quem aprova'],['o_que_ja_foi_feito','O que já foi feito'],
  ]},
  { title: 'Objetivos e Combinados', emoji: '🎯', fields: [
    ['objetivo_v4','Objetivo com a v4'],['sonho_curto_prazo','Sonho de curto prazo'],['reuniao_horario','Dia e horário das reuniões'],
  ]},
]

export default function KickoffViewer({ clientId, clientSlug, response: initial }: Props) {
  const [response, setResponse] = useState(initial)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()
  const kickoffUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/kickoff?client=${clientSlug}`

  async function handleDelete() {
    if (!confirm('Deletar as respostas do kick-off? O cliente poderá preencher novamente.')) return
    setDeleting(true)
    await supabase.from('kickoff_responses').delete().eq('client_id', clientId)
    setResponse(null)
    setDeleting(false)
  }

  async function exportPDF() {
    setExporting(true)
    const url = `/api/kickoff-pdf?client_id=${clientId}`
    const win = window.open(url, '_blank')
    if (win) {
      // Wait for page to load then trigger print dialog (which allows save as PDF)
      setTimeout(() => {
        try { win.print() } catch {}
      }, 1500)
    }
    setExporting(false)
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
            <button onClick={exportPDF} disabled={exporting}
              className="flex items-center gap-1.5 text-xs bg-gray-900 hover:bg-gray-700 text-white border border-white/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60">
              <Download size={12} /> {exporting ? 'Gerando...' : 'Exportar PDF'}
            </button>
          )}
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
