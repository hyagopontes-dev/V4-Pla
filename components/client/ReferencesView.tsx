import { ClientReference } from '@/types'
import { ExternalLink, Link2 } from 'lucide-react'

interface Props { references: ClientReference[] }

const TYPES = {
  visual:      { label: 'Visual / Moodboard', color: 'bg-purple-100 text-purple-700' },
  concorrente: { label: 'Concorrentes',        color: 'bg-red-100 text-red-700' },
  referencia:  { label: 'Referências gerais',  color: 'bg-blue-100 text-blue-700' },
}

export default function ReferencesView({ references }: Props) {
  if (!references.length) return null

  const grouped = {
    visual:      references.filter(i => i.type === 'visual'),
    concorrente: references.filter(i => i.type === 'concorrente'),
    referencia:  references.filter(i => i.type === 'referencia'),
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Link2 size={15} className="text-red-500" />
        <h2 className="font-medium text-gray-900">Referências</h2>
      </div>
      <div className="p-5 space-y-5">
        {(Object.entries(grouped) as [ClientReference['type'], ClientReference[]][]).map(([type, list]) => {
          if (!list.length) return null
          const t = TYPES[type]
          return (
            <div key={type}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.color}`}>{t.label}</span>
                <span className="text-xs text-gray-400">{list.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {list.map(ref => (
                  <div key={ref.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{ref.name}</p>
                      {ref.notes && <p className="text-xs text-gray-500 mt-0.5">{ref.notes}</p>}
                      {ref.url && (
                        <a href={ref.url} target="_blank" rel="noopener"
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1 truncate">
                          <ExternalLink size={10} /> Acessar
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
