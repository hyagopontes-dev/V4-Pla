'use client'
import { useState } from 'react'
import { OrganicAnalysis, MONTH_FULL } from '@/types'
import { Instagram, ExternalLink } from 'lucide-react'

interface Props { analyses: OrganicAnalysis[] }

function uniqueSortedMonths(items: OrganicAnalysis[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(m => { seen[`${m.year}-${m.month}`] = true })
  return Object.keys(seen).sort().reverse()
}

export default function OrganicView({ analyses }: Props) {
  const months = uniqueSortedMonths(analyses)
  const [curMonth, setCurMonth] = useState(months[0] ?? '')
  if (!analyses.length) return null

  const parts = curMonth.split('-')
  const filtered = analyses.filter(a => `${a.year}-${a.month}` === curMonth)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Instagram size={16} className="text-pink-500" />
        <h2 className="font-medium text-gray-900">Análise de Orgânico (Instagram)</h2>
      </div>
      <div className="px-5 pt-4 pb-2 flex gap-2 flex-wrap border-b border-gray-100">
        {months.map(mk => {
          const [y, m] = mk.split('-').map(Number)
          return (
            <button key={mk} onClick={() => setCurMonth(mk)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${curMonth === mk ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {MONTH_FULL[m - 1].slice(0, 3)} {y}
            </button>
          )
        })}
      </div>
      <div className="divide-y divide-gray-50">
        {filtered.map((a, i) => (
          <div key={a.id} className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-gray-500">Vídeo #{i + 1}</span>
              {a.video_url && (
                <a href={a.video_url} target="_blank" rel="noopener"
                  className="flex items-center gap-1 text-xs text-pink-500 hover:text-pink-700 ml-auto">
                  <ExternalLink size={11} /> Ver vídeo
                </a>
              )}
            </div>
            {a.analysis && (
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.analysis}</p>
            )}
          </div>
        ))}
        {!filtered.length && (
          <p className="text-gray-400 text-sm text-center py-6">Nenhum vídeo analisado neste período.</p>
        )}
      </div>
    </div>
  )
}
