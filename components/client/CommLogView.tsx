'use client'
import { useState } from 'react'
import { CommLog, MONTH_FULL, MONTH_NAMES } from '@/types'
import { MessageSquare } from 'lucide-react'

interface Props { logs: CommLog[] }

export default function CommLogView({ logs }: Props) {
  const [activeId, setActiveId] = useState(logs[0]?.id ?? null)
  if (!logs.length) return null
  const active = logs.find(l => l.id === activeId)

  function linkify(text: string) {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.split(urlRegex).map((part, i) =>
      urlRegex.test(part)
        ? <a key={i} href={part} target="_blank" rel="noopener" className="text-blue-500 hover:underline break-all">{part}</a>
        : part
    )
  }

  return (
    <div className="bg-transparent rounded-xl border border-gray-200 className="text-blue-500" />
        <h2 className="font-medium text-gray-900 onClick={() => setActiveId(l.id)}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100" style={{borderColor:"var(--border)" ${activeId === l.id ? 'bg-transparent font-medium text-gray-900" style={{color:"var(--text)"' : 'text-gray-500" style={{color:"var(--text-secondary)" hover:bg-transparent'}`}>
              {MONTH_NAMES[l.month - 1]} {l.year}
            </button>
          ))}
        </div>
        <div className="flex-1 p-5">
          {active?.content
            ? <p className="text-sm text-gray-700</p>
            : <p className="text-gray-400
        </div>
      </div>
    </div>
  )
}
