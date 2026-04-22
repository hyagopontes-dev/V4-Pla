import { Blocker, MONTH_FULL } from '@/types'
import { AlertTriangle, ExternalLink } from 'lucide-react'

interface Props { blockers: Blocker[] }

export default function BlockerView({ blockers }: Props) {
  if (!blockers.length) return null
  return (
    <div className="bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-amber-200 flex items-center gap-2">
        <AlertTriangle size={16} className="text-amber-600" />
        <h2 className="font-medium text-amber-900">Pontos de Atenção</h2>
        <span className="ml-auto bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded-full font-medium">{blockers.length}</span>
      </div>
      <div className="divide-y divide-amber-100">
        {blockers.map(b => (
          <div key={b.id} className="px-5 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-sm text-amber-900">{b.description}</p>
                <p className="text-xs text-amber-600 mt-0.5">{MONTH_FULL[b.month - 1]} {b.year}</p>
              </div>
              {b.evidence_url && (
                <a href={b.evidence_url} target="_blank" rel="noopener" className="flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 flex-shrink-0">
                  <ExternalLink size={11} /> Evidência
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
