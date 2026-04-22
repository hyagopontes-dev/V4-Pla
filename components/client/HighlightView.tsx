import { Highlight, MONTH_FULL } from '@/types'
import { Star } from 'lucide-react'

interface Props { highlights: Highlight[] }

export default function HighlightView({ highlights }: Props) {
  const latest = highlights[0]
  if (!latest?.content) return null
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <Star size={16} className="text-yellow-500" />
        <h2 className="font-medium text-gray-900">Destaques Positivos</h2>
        <span className="text-xs text-gray-400 ml-auto">{MONTH_FULL[latest.month - 1]} {latest.year}</span>
      </div>
      <div className="p-5">
        <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{latest.content}</p>
      </div>
    </div>
  )
}
