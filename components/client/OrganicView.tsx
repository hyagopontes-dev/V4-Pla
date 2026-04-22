'use client'
import { useState, useEffect } from 'react'
import { OrganicAnalysis, MONTH_FULL } from '@/types'
import { Instagram, ExternalLink } from 'lucide-react'

interface Props { analyses: OrganicAnalysis[] }

function uniqueSortedMonths(items: OrganicAnalysis[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(m => { seen[`${m.year}-${m.month}`] = true })
  return Object.keys(seen).sort().reverse()
}

function getInstagramEmbedUrl(url: string): string | null {
  if (!url) return null
  // Match reel or post URL
  const match = url.match(/instagram\.com\/(p|reel|reels)\/([A-Za-z0-9_-]+)/)
  if (!match) return null
  return `https://www.instagram.com/${match[1]}/${match[2]}/embed/`
}

function InstagramEmbed({ url }: { url: string }) {
  const embedUrl = getInstagramEmbedUrl(url)
  if (!embedUrl) {
    return (
      <a href={url} target="_blank" rel="noopener"
        className="flex items-center gap-2 text-sm text-pink-500 hover:text-pink-700">
        <ExternalLink size={14} /> Ver vídeo
      </a>
    )
  }
  return (
    <div className="w-full flex justify-center">
      <iframe
        src={embedUrl}
        width="320"
        height="440"
        frameBorder="0"
        scrolling="no"
        allowTransparency
        className="rounded-xl border border-gray-200 max-w-full"
        title="Instagram post"
      />
    </div>
  )
}

export default function OrganicView({ analyses }: Props) {
  const months = uniqueSortedMonths(analyses)
  const [curMonth, setCurMonth] = useState(months[0] ?? '')
  if (!analyses.length) return null

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
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Nenhum vídeo analisado neste período.</p>
        ) : (
          filtered.map((a, i) => (
            <div key={a.id} className="p-5">
              <p className="text-xs font-medium text-gray-400 mb-4">Vídeo #{i + 1}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {a.video_url && <InstagramEmbed url={a.video_url} />}
                {a.analysis && (
                  <div>
                    <p className="text-xs font-medium text-gray-500 mb-2">Análise crítica</p>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{a.analysis}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
