'use client'
import { useState } from 'react'
import { MonthlyObjective, MONTH_FULL, MONTH_NAMES } from '@/types'
import { ChevronDown, ChevronUp, Target, FileText } from 'lucide-react'

interface Props { scope?: string; objectives: MonthlyObjective[] }

export default function ScopeView({ scope, objectives }: Props) {
  const [expandedObj, setExpandedObj] = useState<string | null>(objectives[0]?.id ?? null)

  if (!scope && !objectives.length) return null

  const sorted = [...objectives].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)

  return (
    <div className="space-y-4">
      {scope && (
        <div className="bg-transparent rounded-xl border border-gray-200 className="text-brand-500" />
            <h2 className="font-medium text-gray-900</p>
        </div>
      )}

      {sorted.length > 0 && (
        <div className="bg-transparent rounded-xl border border-gray-200 className="text-blue-500" />
            <h2 className="font-medium text-gray-900" style={{color:"var(--text)" text-sm">Objetivos mensais</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {sorted.map(obj => (
              <div key={obj.id}>
                <button
                  className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-transparent transition-colors"
                  onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {MONTH_FULL[obj.month - 1]} {obj.year}
                  </span>
                  {expandedObj === obj.id
                    ? <ChevronUp size={14} className="text-gray-400 className="text-gray-400
                </button>
                {expandedObj === obj.id && (
                  <div className="px-5 pb-4 bg-transparent">
                    <p className="text-sm text-gray-700</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
