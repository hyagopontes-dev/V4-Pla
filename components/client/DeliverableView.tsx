'use client'
import { useState } from 'react'
import { Deliverable, MONTH_NAMES, MONTH_FULL } from '@/types'
import { ExternalLink } from 'lucide-react'
import clsx from 'clsx'

interface Props { deliverables: Deliverable[]; contractPieces: number }

const COLOR_ORG = '#639922'
const COLOR_EXTRA = '#185FA5'

export default function DeliverableView({ deliverables, contractPieces }: Props) {
  const sorted = [...deliverables].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const [curIdx, setCurIdx] = useState(0)
  const current = sorted[curIdx]

  if (!sorted.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-400 text-sm">Nenhuma entrega registrada ainda.</p>
      </div>
    )
  }

  const ent = current.delivered
  const acima = ent > contractPieces
  const pct = Math.round((ent / contractPieces) * 100)
  const barPct = Math.min(pct, 100)
  const color = acima ? COLOR_EXTRA : (ent === 0 ? '#9ca3af' : COLOR_ORG)

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Entregas orgânicas</h2>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
          Meta: {contractPieces} peças/mês
        </span>
      </div>

      <div className="p-5">
        {/* Month selector */}
        <div className="flex gap-2 flex-wrap mb-5">
          {sorted.map((d, i) => {
            const over = d.delivered > contractPieces
            const isActive = i === curIdx
            const bg = isActive ? (over ? COLOR_EXTRA : COLOR_ORG) : 'transparent'
            const textColor = isActive ? '#fff' : '#6b7280'
            const border = isActive ? (over ? COLOR_EXTRA : COLOR_ORG) : '#d1d5db'
            return (
              <button
                key={d.id}
                onClick={() => setCurIdx(i)}
                className="text-xs px-3 py-1.5 rounded-full border transition-colors font-medium"
                style={{ background: bg, color: textColor, borderColor: border }}
              >
                {MONTH_NAMES[d.month - 1]} {d.year}
              </button>
            )
          })}
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${barPct}%`, background: color }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-5">
          <span>{pct}% {acima ? 'acima da meta' : ent === 0 ? 'sem entregas' : 'concluído'} — {MONTH_FULL[current.month - 1]} {current.year}</span>
          <span>{ent} / {contractPieces} planejadas</span>
        </div>

        {/* Big counters */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              <span className="text-xs text-gray-500">Entregue</span>
            </div>
            <p className="text-3xl font-semibold" style={{ color }}>{ent}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: acima ? COLOR_EXTRA : ent >= contractPieces ? COLOR_ORG : '#9ca3af' }} />
              <span className="text-xs text-gray-500">
                {acima ? 'Acima do plano' : ent >= contractPieces ? 'Meta batida' : 'Pendente'}
              </span>
            </div>
            <p className="text-3xl font-semibold" style={{ color: acima ? COLOR_EXTRA : ent >= contractPieces ? COLOR_ORG : '#9ca3af' }}>
              {acima ? `+${ent - contractPieces}` : contractPieces - ent}
            </p>
          </div>
        </div>

        {/* History grid */}
        <div>
          <p className="text-xs text-gray-400 mb-2">Histórico</p>
          <div className="grid grid-cols-6 gap-2">
            {sorted.map((d, i) => {
              const pp = Math.round((d.delivered / contractPieces) * 100)
              const over = d.delivered > contractPieces
              const c = over ? COLOR_EXTRA : d.delivered > 0 ? COLOR_ORG : '#9ca3af'
              return (
                <div
                  key={d.id}
                  onClick={() => setCurIdx(i)}
                  className={clsx('rounded-lg p-2 text-center cursor-pointer border transition-colors', i === curIdx ? 'border-gray-400' : 'border-transparent hover:border-gray-200')}
                  style={{ background: '#f9fafb' }}
                >
                  <p className="text-xs text-gray-400">{MONTH_NAMES[d.month - 1]}</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: d.delivered > 0 ? c : '#9ca3af' }}>{d.delivered}/{contractPieces}</p>
                  <p className="text-xs text-gray-400">{pp}%{over ? '+' : ''}</p>
                  <div className="h-1 rounded-full mt-1.5" style={{ background: c, width: `${Math.min(pp, 100)}%`, opacity: d.delivered > 0 ? 1 : 0.2 }} />
                </div>
              )
            })}
          </div>
        </div>

        {/* Document link */}
        {current.doc_url ? (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-xs text-gray-500">Planejamento de {MONTH_FULL[current.month - 1]} {current.year}</span>
            <a
              href={current.doc_url}
              target="_blank"
              rel="noopener"
              className="flex items-center gap-2 text-xs px-4 py-2 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ExternalLink size={12} /> Acessar agora
            </a>
          </div>
        ) : (
          <p className="text-xs text-gray-400 mt-4 pt-4 border-t border-gray-100">
            Nenhum documento vinculado a este mês.
          </p>
        )}
      </div>
    </div>
  )
}
