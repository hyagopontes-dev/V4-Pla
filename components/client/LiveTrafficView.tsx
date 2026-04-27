'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdsIntegration } from '@/types'
import { RefreshCw, Zap, AlertCircle, TrendingUp } from 'lucide-react'

interface Props {
  integrations: AdsIntegration[]
}

const PRESETS = [
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_month', label: 'Mês anterior' },
  { key: 'this_quarter', label: 'Este trimestre' },
  { key: 'last_7d', label: 'Últimos 7 dias' },
  { key: 'last_30d', label: 'Últimos 30 dias' },
]

function fBRL(v: number) { return `R$ ${v.toFixed(2).replace('.', ',')}` }
function fNum(v: number) { return v >= 1000 ? (v/1000).toFixed(1)+'K' : String(v) }
function fPct(v: number) { return v.toFixed(2)+'%' }

function MetricCard({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${highlight ? 'bg-red-600' : 'bg-gray-900'}`}>
      <p className={`text-xs uppercase tracking-wide mb-1 ${highlight ? 'text-red-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-white' : 'text-white'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${highlight ? 'text-red-200' : 'text-gray-500'}`}>{sub}</p>}
    </div>
  )
}

export default function LiveTrafficView({ integrations }: Props) {
  const [preset, setPreset] = useState('this_month')
  const [platform, setPlatform] = useState<'meta' | 'google'>('meta')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const metaIntegration = integrations.find(i => i.platform === 'meta' && i.active)
  const googleIntegration = integrations.find(i => i.platform === 'google' && i.active)

  const availablePlatforms = [
    metaIntegration && { key: 'meta', label: 'Meta Ads', logo: '📘' },
    googleIntegration && { key: 'google', label: 'Google Ads', logo: '🔵' },
  ].filter(Boolean) as { key: string; label: string; logo: string }[]

  const fetchData = useCallback(async () => {
    const integration = platform === 'meta' ? metaIntegration : googleIntegration
    if (!integration?.access_token) return

    setLoading(true)
    setError('')

    try {
      const endpoint = `/api/ads/${platform}`
      const body = platform === 'meta'
        ? { access_token: integration.access_token, account_id: integration.account_id, date_preset: preset }
        : { access_token: integration.access_token, customer_id: integration.account_id }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro ao buscar dados')
      setData(json)
      setLastUpdate(new Date())
    } catch (e: any) {
      setError(e.message)
    }
    setLoading(false)
  }, [platform, preset, metaIntegration, googleIntegration])

  useEffect(() => { fetchData() }, [fetchData])

  if (!availablePlatforms.length) return null

  return (
    <div className="bg-black rounded-xl overflow-hidden border border-white/10">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-red-500" />
          <h2 className="font-medium text-white">Tráfego Pago — Tempo Real</h2>
          {lastUpdate && (
            <span className="text-xs text-gray-500">
              · atualizado {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button onClick={fetchData} disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Atualizando...' : 'Atualizar'}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Platform + Period selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex gap-2">
            {availablePlatforms.map(p => (
              <button key={p.key} onClick={() => setPlatform(p.key as 'meta'|'google')}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  platform === p.key ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:text-white'
                }`}>
                {p.logo} {p.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {PRESETS.map(pr => (
              <button key={pr.key} onClick={() => setPreset(pr.key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  preset === pr.key ? 'bg-red-600 text-white border-red-600' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'
                }`}>
                {pr.label}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-xl p-4">
            <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 text-sm font-medium">Erro ao buscar dados</p>
              <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-900 rounded-xl p-4 animate-pulse">
                <div className="h-3 bg-gray-800 rounded w-16 mb-2" />
                <div className="h-6 bg-gray-800 rounded w-20" />
              </div>
            ))}
          </div>
        )}

        {/* Data */}
        {data && !loading && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard label="Investido" value={fBRL(data.spend)} highlight />
              <MetricCard label="Conversões" value={String(data.conversions)} />
              <MetricCard label="CPR" value={data.cpr > 0 ? fBRL(data.cpr) : '—'} />
              <MetricCard label="Impressões" value={fNum(data.impressions)} />
              <MetricCard label="Cliques" value={fNum(data.clicks)} />
              <MetricCard label="CTR" value={fPct(data.ctr)} />
              <MetricCard label="CPM" value={fBRL(data.cpm)} />
              {data.reach > 0 && <MetricCard label="Alcance" value={fNum(data.reach)} />}
            </div>
            <p className="text-xs text-gray-600 text-right">Período: {data.period}</p>
          </>
        )}

        {!loading && !data && !error && (
          <div className="text-center py-8">
            <TrendingUp size={28} className="text-gray-700 mx-auto mb-2" />
            <p className="text-gray-500 text-sm">Nenhum dado disponível</p>
          </div>
        )}
      </div>
    </div>
  )
}
