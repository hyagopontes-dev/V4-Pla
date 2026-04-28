'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdsIntegration } from '@/types'
import { RefreshCw, Zap, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props { integrations: AdsIntegration[] }

const PRESETS = [
  { key: 'today', label: 'Hoje' },
  { key: 'yesterday', label: 'Ontem' },
  { key: 'this_week', label: 'Esta semana' },
  { key: 'last_week', label: 'Semana passada' },
  { key: 'this_month', label: 'Este mês' },
  { key: 'last_month', label: 'Mês anterior' },
  { key: 'last_30d', label: 'Últimos 30 dias' },
  { key: 'last_quarter', label: 'Último trimestre' },
]

function fBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fNum(v: number) {
  if (v >= 1000000) return (v / 1000000).toFixed(1) + 'M'
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K'
  return v.toLocaleString('pt-BR')
}
function fPct(v: number) { return v.toFixed(2) + '%' }

function KpiCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-red-600 border-red-500' : 'bg-gray-900 border-white/5'}`}>
      <p className={`text-xs uppercase tracking-wide mb-1 font-medium ${accent ? 'text-red-200' : 'text-gray-500'}`}>{label}</p>
      <p className="text-xl font-bold text-white">{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-red-200' : 'text-gray-600'}`}>{sub}</p>}
    </div>
  )
}

function MiniBar({ data, field, color }: { data: any[]; field: string; color: string }) {
  if (!data?.length) return null
  const vals = data.map(d => d[field] as number)
  const max = Math.max(...vals, 1)
  return (
    <div className="flex items-end gap-0.5 h-10">
      {vals.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm min-h-[2px]"
          style={{ height: `${Math.max(4, (v / max) * 100)}%`, background: color, opacity: 0.6 + (i / vals.length) * 0.4 }}
          title={`${data[i]?.date}: ${v}`}
        />
      ))}
    </div>
  )
}

// Funnel component
function Funnel({ ov }: { ov: any }) {
  const steps = [
    { label: 'Impressões', value: ov.impressions, color: 'bg-blue-500' },
    { label: 'Alcance', value: ov.reach, color: 'bg-blue-400' },
    { label: 'Cliques', value: ov.clicks, color: 'bg-blue-300' },
  ]
  if (ov.messages_started > 0) steps.push({ label: 'Mensagens', value: ov.messages_started, color: 'bg-blue-200' })
  if (ov.conversions > 0 && ov.result_label !== 'Conversas iniciadas') steps.push({ label: ov.result_label ?? 'Resultados', value: ov.conversions, color: 'bg-green-400' })

  const max = steps[0]?.value ?? 1
  return (
    <div className="space-y-2">
      {steps.filter(s => s.value > 0).map((step, i) => {
        const w = Math.max(20, (step.value / max) * 100)
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-28 text-right">
              <p className="text-xs text-gray-400">{step.label}</p>
              <p className="text-sm font-bold text-white">{fNum(step.value)}</p>
            </div>
            <div className="flex-1 bg-gray-800 rounded-full h-6 overflow-hidden">
              <div className={`h-full ${step.color} rounded-full transition-all`} style={{ width: `${w}%` }} />
            </div>
          </div>
        )
      })}
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

  const metaInt = integrations.find(i => i.platform === 'meta' && i.active)
  const googleInt = integrations.find(i => i.platform === 'google' && i.active)
  const available = [metaInt && 'meta', googleInt && 'google'].filter(Boolean) as string[]

  const fetch_ = useCallback(async () => {
    const int = platform === 'meta' ? metaInt : googleInt
    if (!int?.access_token) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/ads/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          access_token: int.access_token,
          account_id: int.account_id,
          date_preset: preset,
          refresh_token: (int as any).refresh_token ?? null,
          client_id: int.client_id,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro')
      setData(json)
      setLastUpdate(new Date())
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [platform, preset, metaInt, googleInt])

  useEffect(() => { fetch_() }, [fetch_])

  if (!available.length) return null

  const ov = data?.overview
  const campaigns: any[] = data?.campaigns ?? []
  const daily: any[] = data?.daily ?? []

  // Correctly compute totals per result type
  const resultGroups: Record<string, { label: string; total: number; totalCost: number; count: number }> = {}
  campaigns.forEach(c => {
    if (c.result_value > 0) {
      const key = c.result_label
      if (!resultGroups[key]) resultGroups[key] = { label: key, total: 0, totalCost: 0, count: 0 }
      resultGroups[key].total += c.result_value
      resultGroups[key].totalCost += c.spend
      resultGroups[key].count++
    }
  })

  return (
    <div className="space-y-4">
      {/* Header controls */}
      <div className="bg-black rounded-xl border border-white/10 px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-red-500" />
            <h2 className="font-semibold text-white text-sm">Tráfego Pago — Tempo Real</h2>
            {lastUpdate && (
              <span className="text-xs text-gray-600">· {lastUpdate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          <button onClick={fetch_} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        {available.length > 1 && (
          <div className="flex gap-2 mb-3">
            {available.map(p => (
              <button key={p} onClick={() => setPlatform(p as any)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${platform === p ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:text-white'}`}>
                {p === 'meta' ? '📘 Meta Ads' : '🔵 Google Ads'}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-1.5 flex-wrap">
          {PRESETS.map(pr => (
            <button key={pr.key} onClick={() => setPreset(pr.key)}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${preset === pr.key ? 'bg-red-600 text-white border-red-600' : 'border-white/10 text-gray-500 hover:text-white hover:border-white/30'}`}>
              {pr.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-900/30 border border-red-500/30 rounded-xl p-4">
          <AlertCircle size={15} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Erro ao buscar dados</p>
            <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4 animate-pulse">
              <div className="h-2.5 bg-gray-800 rounded w-16 mb-3" /><div className="h-6 bg-gray-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {ov && (
        <>
          {/* Top KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <KpiCard label="Investido" value={fBRL(ov.spend)} sub={data.period} accent />
            <KpiCard label="Impressões" value={fNum(ov.impressions)} />
            <KpiCard label="Alcance" value={fNum(ov.reach)} sub={ov.frequency > 0 ? `Freq: ${ov.frequency.toFixed(2)}x` : undefined} />
            <KpiCard label="Cliques" value={fNum(ov.clicks)} sub={`CTR: ${fPct(ov.ctr)}`} />
            <KpiCard label="CPM" value={fBRL(ov.cpm)} />
          </div>

          {/* Result summary by type */}
          {Object.values(resultGroups).length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.values(resultGroups).map((g, i) => (
                <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{g.label}</p>
                  <p className="text-2xl font-bold text-green-400">{fNum(g.total)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">Custo: {fBRL(g.totalCost / g.total)}</p>
                </div>
              ))}
              {ov.messages_started > 0 && !resultGroups['Conversas iniciadas'] && (
                <div className="bg-gray-900 border border-white/5 rounded-xl p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Mensagens</p>
                  <p className="text-2xl font-bold text-blue-400">{fNum(ov.messages_started)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">CPM: {fBRL(ov.spend / ov.messages_started)}</p>
                </div>
              )}
            </div>
          )}

          {/* Funil + Daily charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Funil */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Funil de Tráfego</h3>
              <Funnel ov={ov} />
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-xs text-gray-500">CTR</p>
                  <p className="text-sm font-bold text-white">{fPct(ov.ctr)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">Frequência</p>
                  <p className="text-sm font-bold text-white">{ov.frequency?.toFixed(2) ?? '—'}x</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">CPM</p>
                  <p className="text-sm font-bold text-white">{fBRL(ov.cpm)}</p>
                </div>
              </div>
            </div>

            {/* Daily charts */}
            {daily.length > 1 && (
              <div className="bg-black rounded-xl border border-white/10 p-5">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Evolução diária</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-gray-500">Investimento</p>
                      <p className="text-xs text-gray-500">{fBRL(Math.max(...daily.map(d => d.spend)))}</p>
                    </div>
                    <MiniBar data={daily} field="spend" color="#dc2626" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-gray-500">Resultados</p>
                      <p className="text-xs text-gray-500">{Math.max(...daily.map(d => d.conversions))}</p>
                    </div>
                    <MiniBar data={daily} field="conversions" color="#22c55e" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <p className="text-xs text-gray-500">Cliques</p>
                      <p className="text-xs text-gray-500">{fNum(Math.max(...daily.map(d => d.clicks)))}</p>
                    </div>
                    <MiniBar data={daily} field="clicks" color="#3b82f6" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 pt-1">
                    <span>{daily[0]?.date?.slice(5)}</span>
                    <span>{daily[daily.length - 1]?.date?.slice(5)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Campaigns table */}
          {campaigns.length > 0 && (
            <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Campanhas</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Campanha</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Investido</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Alcance</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Impressões</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Cliques</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">CTR</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">CPM</th>
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Resultado</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">Custo/resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 max-w-[200px]">
                          <p className="text-white text-xs font-medium truncate">{c.name}</p>
                          {c.result_label && <p className="text-gray-600 text-xs mt-0.5">{c.result_label}</p>}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 text-xs font-semibold">{fBRL(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.reach)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.impressions)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.clicks)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fPct(c.ctr)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fBRL(c.cpm)}</td>
                        <td className="px-4 py-3 text-right text-xs">
                          <span className={c.result_value > 0 ? 'text-green-400 font-bold' : 'text-gray-600'}>
                            {c.result_value > 0 ? fNum(c.result_value) : '—'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-xs">
                          {c.result_value > 0 && c.spend > 0
                            ? <span className="text-gray-300">{fBRL(c.spend / c.result_value)}</span>
                            : <span className="text-gray-600">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  {/* No single total row - instead show per-type summary */}
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/5">
                      <td className="px-5 py-3 text-xs text-gray-400 font-semibold">TOTAL INVESTIDO</td>
                      <td className="px-4 py-3 text-right text-red-400 text-xs font-bold">{fBRL(ov.spend)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.reach)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.impressions)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.clicks)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fPct(ov.ctr)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fBRL(ov.cpm)}</td>
                      <td className="px-4 py-3 text-right text-xs text-gray-500" colSpan={2}>
                        {Object.values(resultGroups).map(g => (
                          <span key={g.label} className="ml-2">{g.label}: <strong className="text-green-400">{fNum(g.total)}</strong></span>
                        ))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Extra metrics */}
          {(ov.messages_started > 0 || ov.video_views > 0 || ov.landing_page_views > 0) && (
            <div className="grid grid-cols-3 gap-3">
              {ov.landing_page_views > 0 && (
                <div className="bg-black rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-500 mb-1">Taxa LP View/Clique</p>
                  <p className="text-white text-lg font-bold">{ov.clicks > 0 ? ((ov.landing_page_views / ov.clicks) * 100).toFixed(1) + '%' : '—'}</p>
                  <p className="text-xs text-gray-600 mt-0.5">{fNum(ov.landing_page_views)} views de landing page</p>
                </div>
              )}
              {ov.messages_started > 0 && (
                <div className="bg-black rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-500 mb-1">Conversas iniciadas</p>
                  <p className="text-white text-lg font-bold">{fNum(ov.messages_started)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">custo por conversa: {fBRL(ov.spend / ov.messages_started)}</p>
                </div>
              )}
              {ov.video_views > 0 && (
                <div className="bg-black rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-500 mb-1">Views de vídeo</p>
                  <p className="text-white text-lg font-bold">{fNum(ov.video_views)}</p>
                  <p className="text-xs text-gray-600 mt-0.5">CPV: {fBRL(ov.spend / ov.video_views)}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
