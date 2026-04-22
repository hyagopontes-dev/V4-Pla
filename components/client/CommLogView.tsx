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
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <MessageSquare size={16} className="text-blue-500" />
        <h2 className="font-medium text-gray-900">Comunicação & Histórico</h2>
      </div>
      <div className="flex">
        <div className="w-28 border-r border-gray-100 bg-gray-50 flex-shrink-0">
          {logs.map(l => (
            <button key={l.id} onClick={() => setActiveId(l.id)}
              className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100 ${activeId === l.id ? 'bg-white font-medium text-gray-900' : 'text-gray-500 hover:bg-white'}`}>
              {MONTH_NAMES[l.month - 1]} {l.year}
            </button>
          ))}
        </div>
        <div className="flex-1 p-5">
          {active?.content
            ? <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{linkify(active.content)}</p>
            : <p className="text-gray-400 text-sm">Nenhum registro para este período.</p>}
        </div>
      </div>
    </div>
  )
}
