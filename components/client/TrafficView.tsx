'use client'
import { useState } from 'react'
import { TrafficMetric, MONTH_NAMES, MONTH_FULL } from '@/types'

interface Props { metrics: TrafficMetric[] }

const FIELDS: { key: string; label: string; inv?: boolean; isCurrency?: boolean; isPct?: boolean }[] = [
  { key: 'alcance',      label: 'Alcance' },
  { key: 'impressoes',   label: 'Impressões' },
  { key: 'cliques',      label: 'Cliques no link' },
  { key: 'ctr',          label: 'CTR (%)', isPct: true },
  { key: 'cpm',          label: 'CPM', isCurrency: true, inv: true },
  { key: 'conversoes',   label: 'Conversões' },
  { key: 'cpr',          label: 'Custo por resultado', isCurrency: true, inv: true },
  { key: 'investimento', label: 'Valor investido', isCurrency: true },
]

function fmt(v: number | null | undefined, isPct?: boolean, isCurrency?: boolean) {
  if (v == null) return '—'
  if (isCurrency) return `R$ ${Number(v).toFixed(2).replace('.', ',')}`
  if (isPct) return `${Number(v).toFixed(2).replace('.', ',')}%`
  return Math.round(v).toLocaleString('pt-BR')
}

function pctCalc(meta: number | null | undefined, real: number | null | undefined, inv?: boolean) {
  if (!meta || !real) return null
  return inv ? meta / real : real / meta
}

function StatusBadge({ p }: { p: number | null }) {
  if (p === null) return <span className="badge-neutral">—</span>
  if (p >= 1) return <span className="badge-success">Atingido</span>
  if (p >= 0.8) return <span className="badge-warning">Próximo</span>
  return <span className="badge-danger">Abaixo</span>
}

function uniqueSortedMonths(items: TrafficMetric[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(m => { seen[`${m.year}-${m.month}`] = true })
  return Object.keys(seen).sort().reverse()
}

export default function TrafficView({ metrics }: Props) {
  const platforms = ['meta', 'google'] as const
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta')

  const filtered = metrics.filter(m => m.platform === platform)
  const months = uniqueSortedMonths(filtered)
  const [curMonth, setCurMonth] = useState(months[0] ?? '')

  const current = filtered.find(m => `${m.year}-${m.month}` === curMonth)

  if (!metrics.length) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <p className="text-gray-400 text-sm">Nenhuma métrica de tráfego registrada ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-medium text-gray-900">Tráfego pago</h2>
        <div className="flex gap-2">
          {platforms.map(p => (
            <button
              key={p}
              onClick={() => {
                setPlatform(p)
                const newFiltered = metrics.filter(m => m.platform === p)
                const newMonths = uniqueSortedMonths(newFiltered)
                setCurMonth(newMonths[0] ?? '')
              }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${platform === p ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
            >
              {p === 'meta' ? 'Meta Ads' : 'Google Ads'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5">
        {months.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {months.map(mk => {
              const parts = mk.split('-')
              const y = parseInt(parts[0])
              const m = parseInt(parts[1])
              return (
                <button
                  key={mk}
                  onClick={() => setCurMonth(mk)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${curMonth === mk ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                >
                  {MONTH_NAMES[m - 1]} {y}
                </button>
              )
            })}
          </div>
        )}

        {!current ? (
          <p className="text-gray-400 text-sm text-center py-6">Selecione um período para ver as métricas.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
              {['conversoes', 'cpr', 'impressoes', 'investimento'].map(key => {
                const f = FIELDS.find(f => f.key === key)!
                const meta = (current as any)[`meta_${key}`]
                const real = (current as any)[`real_${key}`]
                const p = pctCalc(meta, real, f.inv)
                const color = p == null ? '#9ca3af' : p >= 1 ? '#639922' : p >= 0.8 ? '#d97706' : '#ef4444'
                return (
                  <div key={key} className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">{f.label}</p>
                    <p className="text-xl font-semibold text-gray-900">{fmt(real, f.isPct, f.isCurrency)}</p>
                    <p className="text-xs mt-1" style={{ color }}>
                      meta: {fmt(meta, f.isPct, f.isCurrency)} {p != null ? `· ${Math.round(p * 100)}%` : ''}
                    </p>
                  </div>
                )
              })}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs text-gray-500 font-medium">Métrica</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-medium">Meta</th>
                    <th className="text-right py-2 text-xs text-gray-500 font-medium">Realizado</th>
                    <th className="text-center py-2 text-xs text-gray-500 font-medium w-28">Atingimento</th>
                    <th className="text-center py-2 text-xs text-gray-500 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {FIELDS.map(f => {
                    const meta = (current as any)[`meta_${f.key}`]
                    const real = (current as any)[`real_${f.key}`]
                    const p = pctCalc(meta, real, f.inv)
                    const barColor = p == null ? '#e5e7eb' : p >= 1 ? '#639922' : p >= 0.8 ? '#d97706' : '#ef4444'
                    const barW = p != null ? Math.min(Math.round(p * 100), 100) : 0
                    return (
                      <tr key={f.key} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-2.5 text-gray-700 font-medium">{f.label}</td>
                        <td className="py-2.5 text-right text-gray-500">{fmt(meta, f.isPct, f.isCurrency)}</td>
                        <td className="py-2.5 text-right font-medium text-gray-900">{fmt(real, f.isPct, f.isCurrency)}</td>
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${barW}%`, background: barColor }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8 text-right">{p != null ? Math.round(p * 100) + '%' : '—'}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-center"><StatusBadge p={p} /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
