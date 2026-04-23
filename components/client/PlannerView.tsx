'use client'
import { useState } from 'react'
import { ContentPlanner, MONTH_FULL, MONTH_NAMES } from '@/types'
import { ExternalLink, Calendar } from 'lucide-react'

interface Props { items: ContentPlanner[] }

const DAYS = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca',   label: 'Terça' },
  { value: 'quarta',  label: 'Quarta' },
  { value: 'quinta',  label: 'Quinta' },
  { value: 'sexta',   label: 'Sexta' },
  { value: 'sabado',  label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]

const STATUS = {
  roteiro:   { label: 'Roteiro',   bg: 'bg-gray-100',   text: 'text-gray-600' },
  gravando:  { label: 'Gravando',  bg: 'bg-yellow-100', text: 'text-yellow-700' },
  gravado:   { label: 'Gravado',   bg: 'bg-blue-100',   text: 'text-blue-700' },
  publicado: { label: 'Publicado', bg: 'bg-green-100',  text: 'text-green-700' },
}

function uniqueSortedMonths(items: ContentPlanner[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(i => { seen[`${i.year}-${String(i.month).padStart(2,'0')}`] = true })
  return Object.keys(seen).sort().reverse()
}

export default function PlannerView({ items }: Props) {
  const months = uniqueSortedMonths(items)
  const [cur, setCur] = useState(months[0] ?? '')

  if (!items.length) return (
    <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
      <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
      <p className="text-gray-400 text-sm">Nenhum roteiro cadastrado ainda.</p>
    </div>
  )

  const [y, m] = cur.split('-').map(Number)
  const filtered = items.filter(i => i.year === y && i.month === m)
  const byDay: Record<string, ContentPlanner[]> = {}
  DAYS.forEach(d => { byDay[d.value] = filtered.filter(i => i.day_of_week === d.value) })

  const total = filtered.length
  const publicados = filtered.filter(i => i.status === 'publicado').length
  const gravados = filtered.filter(i => i.status === 'gravado').length
  const gravando = filtered.filter(i => i.status === 'gravando').length

  return (
    <div className="space-y-5">
      {/* Month selector */}
      <div className="flex gap-2 flex-wrap">
        {months.map(mk => {
          const [my, mm] = mk.split('-').map(Number)
          return (
            <button key={mk} onClick={() => setCur(mk)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${cur === mk ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {MONTH_NAMES[mm - 1]} {my}
            </button>
          )
        })}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Total', val: total, color: 'text-gray-900' },
          { label: 'Publicados', val: publicados, color: 'text-green-600' },
          { label: 'Gravados', val: gravados, color: 'text-blue-600' },
          { label: 'Gravando', val: gravando, color: 'text-yellow-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-xs text-gray-400 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* By day */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-400 text-sm">Nenhum roteiro para {MONTH_FULL[m - 1]} {y}.</p>
        </div>
      ) : DAYS.map(day => {
        const dayItems = byDay[day.value]
        if (!dayItems.length) return null
        return (
          <div key={day.value} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-black flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">{day.label}</h3>
              <span className="text-xs text-gray-400">{dayItems.length} conteúdo(s)</span>
            </div>
            <div className="divide-y divide-gray-50">
              {dayItems.map(item => {
                const s = STATUS[item.status]
                return (
                  <div key={item.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                          {item.format && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.format}</span>}
                        </div>
                        <p className="text-sm font-medium text-gray-900">{item.title}</p>
                        {item.description && <p className="text-xs text-gray-500 mt-1 whitespace-pre-wrap">{item.description}</p>}
                      </div>
                      {item.recording_url && (
                        <a href={item.recording_url} target="_blank" rel="noopener"
                          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg flex-shrink-0 transition-colors">
                          <ExternalLink size={11} /> Gravação
                        </a>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
