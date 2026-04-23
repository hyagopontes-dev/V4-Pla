'use client'
import { useState } from 'react'
import { OtherDeliverable, MONTH_FULL, MONTH_NAMES } from '@/types'
import { ExternalLink, Package } from 'lucide-react'

interface Props { items: OtherDeliverable[] }

function uniqueSortedMonths(items: OtherDeliverable[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(m => { seen[`${m.year}-${m.month}`] = true })
  return Object.keys(seen).sort().reverse()
}

const STATUS = {
  pendente:  { label: 'Pendente',  bg: 'bg-gray-100',  text: 'text-gray-600' },
  entregue:  { label: 'Entregue',  bg: 'bg-blue-100',  text: 'text-blue-700' },
  concluido: { label: 'Concluído', bg: 'bg-green-100', text: 'text-green-700' },
}

export default function OtherDeliverableView({ items }: Props) {
  const months = uniqueSortedMonths(items)
  const [cur, setCur] = useState(months[0] ?? '')
  if (!items.length) return null

  const filtered = items.filter(i => `${i.year}-${i.month}` === cur)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Package size={15} className="text-red-500" />
        <h2 className="font-medium text-gray-900">Outras Entregas</h2>
      </div>
      <div className="px-5 pt-4 pb-2 flex gap-2 flex-wrap border-b border-gray-100">
        {months.map(mk => {
          const [y, m] = mk.split('-').map(Number)
          return (
            <button key={mk} onClick={() => setCur(mk)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${cur === mk ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>
              {MONTH_NAMES[m - 1]} {y}
            </button>
          )
        })}
      </div>
      <div className="divide-y divide-gray-50">
        {filtered.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-6">Nenhuma entrega neste período.</p>
        ) : filtered.map(item => {
          const s = STATUS[item.status]
          return (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.bg} ${s.text}`}>{s.label}</span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{item.description}</p>
                </div>
                {item.doc_url && (
                  <a href={item.doc_url} target="_blank" rel="noopener"
                    className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 flex-shrink-0 border border-red-200 hover:border-red-400 px-3 py-1.5 rounded-lg transition-colors">
                    <ExternalLink size={11} /> Ver documento
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
