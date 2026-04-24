'use client'
import { useState } from 'react'
import { ContentPlanner, MONTH_FULL, MONTH_NAMES } from '@/types'
import { ExternalLink, X, Calendar, ChevronRight } from 'lucide-react'

interface Props { items: ContentPlanner[] }

const DAYS = ['segunda','terca','quarta','quinta','sexta','sabado','domingo']
const DAY_LABELS: Record<string, string> = {
  segunda:'Segunda', terca:'Terça', quarta:'Quarta',
  quinta:'Quinta', sexta:'Sexta', sabado:'Sábado', domingo:'Domingo'
}

const COLUMNS = [
  { key: 'roteiro',   label: 'ROTEIRO',   dot: '#6b7280' },
  { key: 'gravando',  label: 'GRAVANDO',  dot: '#eab308' },
  { key: 'gravado',   label: 'GRAVADO',   dot: '#3b82f6' },
  { key: 'publicado', label: 'PUBLICADO', dot: '#22c55e' },
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  roteiro:   { bg: 'bg-gray-800', text: 'text-gray-300' },
  gravando:  { bg: 'bg-yellow-900/50', text: 'text-yellow-400' },
  gravado:   { bg: 'bg-blue-900/50', text: 'text-blue-400' },
  publicado: { bg: 'bg-green-900/50', text: 'text-green-400' },
}

function uniqueSortedMonths(items: ContentPlanner[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(i => { seen[`${i.year}-${String(i.month).padStart(2,'0')}`] = true })
  return Object.keys(seen).sort().reverse()
}

function Modal({ item, onClose }: { item: ContentPlanner; onClose: () => void }) {
  const s = STATUS_COLORS[item.status]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <div
        className="relative bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <p className="text-red-400 text-xs font-semibold uppercase tracking-widest mb-2">
            {DAY_LABELS[item.day_of_week]} · {MONTH_FULL[item.month - 1]} {item.year}
          </p>
          <h2 className="text-white text-xl font-bold leading-snug">{item.title}</h2>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {item.description && (
            <div className="bg-black/40 rounded-xl p-4 border border-white/5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-2">Roteiro</p>
              <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{item.description}</p>
            </div>
          )}
          {item.format && (
            <div>
              <p className="text-gray-500 text-xs mb-1">Formato</p>
              <span className="text-xs bg-gray-800 text-gray-300 px-3 py-1 rounded-full">{item.format}</span>
            </div>
          )}
          {item.recording_url && (
            <a href={item.recording_url} target="_blank" rel="noopener"
              className="flex items-center gap-2 bg-red-600/10 border border-red-500/30 text-red-400 hover:text-red-300 px-4 py-3 rounded-xl text-sm transition-colors">
              <ExternalLink size={14} /> Ver gravação
            </a>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-3 py-1 rounded-full font-medium ${s.bg} ${s.text}`}>
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </span>
            {item.format && (
              <span className="text-xs bg-gray-800 text-gray-400 px-3 py-1 rounded-full">{item.format}</span>
            )}
          </div>
          <button onClick={onClose}
            className="flex items-center gap-2 bg-white text-black text-sm font-semibold px-4 py-2 rounded-xl hover:bg-gray-100 transition-colors">
            Fechar
          </button>
        </div>

        {/* Close button */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X size={16} className="text-white" />
        </button>
      </div>
    </div>
  )
}

export default function PlannerView({ items }: Props) {
  const months = uniqueSortedMonths(items)
  const [cur, setCur] = useState(months[0] ?? '')
  const [selected, setSelected] = useState<ContentPlanner | null>(null)

  if (!items.length) return (
    <div className="bg-black rounded-xl border border-white/10 p-10 text-center">
      <Calendar size={32} className="text-gray-600 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Nenhum roteiro cadastrado ainda.</p>
    </div>
  )

  const [y, m] = cur ? cur.split('-').map(Number) : [0, 0]
  const filtered = items.filter(i => i.year === y && i.month === m)

  const totalPub = filtered.filter(i => i.status === 'publicado').length
  const totalGrav = filtered.filter(i => i.status === 'gravado').length

  return (
    <div className="space-y-4">
      {/* Month selector */}
      <div className="flex gap-2 flex-wrap">
        {months.map(mk => {
          const [my, mm] = mk.split('-').map(Number)
          return (
            <button key={mk} onClick={() => setCur(mk)}
              className={`text-xs px-4 py-2 rounded-full border font-medium transition-colors ${
                cur === mk
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-gray-700 text-gray-400 hover:text-white hover:border-gray-500 bg-black'
              }`}>
              {MONTH_NAMES[mm - 1]} {my}
            </button>
          )
        })}
      </div>

      {/* Summary bar */}
      {filtered.length > 0 && (
        <div className="bg-black rounded-xl border border-white/10 px-5 py-3 flex items-center gap-6 flex-wrap">
          <span className="text-gray-400 text-xs">{filtered.length} conteúdos planejados</span>
          <span className="text-green-400 text-xs font-medium">✓ {totalPub} publicados</span>
          <span className="text-blue-400 text-xs font-medium">● {totalGrav} gravados</span>
        </div>
      )}

      {/* Kanban */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {COLUMNS.map(col => {
          const colItems = filtered.filter(i => i.status === col.key)
          return (
            <div key={col.key} className="bg-black rounded-xl border border-white/10 overflow-hidden">
              {/* Column header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: col.dot }} />
                  <span className="text-xs font-semibold text-gray-300 tracking-wide">{col.label}</span>
                </div>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{colItems.length}</span>
              </div>

              {/* Cards */}
              <div className="p-2 space-y-2 min-h-[120px]">
                {colItems.length === 0 && (
                  <div className="h-16 flex items-center justify-center">
                    <span className="text-gray-700 text-xs">Vazio</span>
                  </div>
                )}
                {colItems.map(item => (
                  <button key={item.id} onClick={() => setSelected(item)}
                    className="w-full text-left bg-gray-900/80 hover:bg-gray-800 border border-white/5 hover:border-white/20 rounded-xl p-3 transition-all group">
                    <p className="text-white text-xs font-medium leading-snug line-clamp-2 mb-2">{item.title}</p>
                    {item.description && (
                      <p className="text-gray-500 text-xs italic line-clamp-2 mb-2 leading-relaxed">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 flex-wrap">
                        {item.format && (
                          <span className="text-xs bg-red-600/20 text-red-400 border border-red-600/20 px-2 py-0.5 rounded-full">{item.format}</span>
                        )}
                        <span className="text-xs text-gray-600">{DAY_LABELS[item.day_of_week]}</span>
                      </div>
                      <ChevronRight size={12} className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {selected && <Modal item={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
