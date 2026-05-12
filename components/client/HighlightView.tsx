import { Highlight, MONTH_FULL } from '@/types'
import { Star } from 'lucide-react'

interface Props { highlights: Highlight[] }

export default function HighlightView({ highlights }: Props) {
  const latest = highlights[0]
  if (!latest?.content) return null
  return (
    <div className="bg-transparent rounded-xl border border-gray-200 className="text-yellow-500" />
        <h2 className="font-medium text-gray-900 {latest.year}</span>
      </div>
      <div className="p-5">
        <p className="text-gray-700</p>
      </div>
    </div>
  )
}
