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
        className="rounded-xl border border-gray-200

export default function OrganicView({ analyses }: Props) {
  const months = uniqueSortedMonths(analyses)
  const [curMonth, setCurMonth] = useState(months[0] ?? '')
  if (!analyses.length) return null

  const filtered = analyses.filter(a => `${a.year}-${a.month}` === curMonth)

  return (
    <div className="bg-transparent rounded-xl border border-gray-200 className="text-pink-500" />
        <h2 className="font-medium text-gray-900 onClick={() => setCurMonth(mk)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${curMonth === mk ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200" style={{borderColor:"var(--border)" text-gray-500" style={{color:"var(--text-secondary)" hover:bg-transparent'}`}>
              {MONTH_FULL[m - 1].slice(0, 3)} {y}
            </button>
          )
        })}
      </div>

      <div className="divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-gray-400 className="p-5">
              <p className="text-xs font-medium text-gray-400</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {a.video_url && <InstagramEmbed url={a.video_url} />}
                {a.analysis && (
                  <div>
                    <p className="text-xs font-medium text-gray-500</p>
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
