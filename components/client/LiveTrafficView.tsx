'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdsIntegration } from '@/types'
import { RefreshCw, Zap, AlertCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface Props { integrations: AdsIntegration[] }

const PRESETS = [
  { key: 'today',        label: 'Hoje' },
  { key: 'yesterday',    label: 'Ontem' },
  { key: 'this_week',    label: 'Esta semana' },
  { key: 'last_week',    label: 'Semana passada' },
  { key: 'this_month',   label: 'Este mês' },
  { key: 'last_month',   label: 'Mês anterior' },
  { key: 'last_30d',     label: 'Últimos 30 dias' },
  { key: 'last_quarter', label: 'Último trimestre' },
]

function fBRL(v: number) { return `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function fNum(v: number) {
  if (v >= 1000000) return (v/1000000).toFixed(1)+'M'
  if (v >= 1000) return (v/1000).toFixed(1)+'K'
  return v.toLocaleString('pt-BR')
}
function fPct(v: number) { return v.toFixed(2)+'%' }

function KpiCard({ label, value, sub, accent, icon }: { label: string; value: string; sub?: string; accent?: boolean; icon?: React.ReactNode }) {
  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-red-600 border-red-500' : 'bg-gray-900 border-white/5'}`}>
      {icon && <div className={`mb-2 ${accent ? 'text-red-200' : 'text-gray-500'}`}>{icon}</div>}
      <p className={`text-xs uppercase tracking-wide mb-1 font-medium ${accent ? 'text-red-200' : 'text-gray-500'}`}>{label}</p>
      <p className={`text-xl font-bold ${accent ? 'text-white' : 'text-white'}`}>{value}</p>
      {sub && <p className={`text-xs mt-0.5 ${accent ? 'text-red-200' : 'text-gray-600'}`}>{sub}</p>}
    </div>
  )
}

function MiniBar({ data, field, color }: { data: any[]; field: string; color: string }) {
  if (!data.length) return null
  const vals = data.map(d => d[field] as number)
  const max = Math.max(...vals, 1)
  return (
    <div className="flex items-end gap-0.5 h-12">
      {vals.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm min-h-[2px] transition-all"
          style={{ height: `${Math.max(4, (v/max)*100)}%`, background: color, opacity: 0.7 + (i/vals.length)*0.3 }}
          title={`${data[i].date}: ${v}`}
        />
      ))}
    </div>
  )
}

export default function LiveTrafficView({ integrations }: Props) {
  const [preset, setPreset] = useState('this_month')
  const [platform, setPlatform] = useState<'meta'|'google'>('meta')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)

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
        body: JSON.stringify({ access_token: int.access_token, account_id: int.account_id, date_preset: preset }),
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
  const campaigns = data?.campaigns ?? []
  const daily = data?.daily ?? []

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

        {/* Platform tabs */}
        {available.length > 1 && (
          <div className="flex gap-2 mb-3">
            {available.map(p => (
              <button key={p} onClick={() => setPlatform(p as any)}
                className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  platform === p ? 'bg-white text-black border-white' : 'border-white/20 text-gray-400 hover:text-white'
                }`}>
                {p === 'meta' ? '📘 Meta Ads' : '🔵 Google Ads'}
              </button>
            ))}
          </div>
        )}

        {/* Period selector */}
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

      {/* Loading */}
      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[...Array(8)].map((_,i) => (
            <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4 animate-pulse">
              <div className="h-2.5 bg-gray-800 rounded w-16 mb-3" />
              <div className="h-6 bg-gray-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {ov && (
        <>
          {/* KPI Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KpiCard label="Investido" value={fBRL(ov.spend)} sub={data.period} accent />
            <KpiCard label="Conversões" value={fNum(ov.conversions)} sub={ov.cpr > 0 ? `CPR: ${fBRL(ov.cpr)}` : undefined} />
            <KpiCard label="Alcance" value={fNum(ov.reach)} sub={`Freq: ${ov.frequency?.toFixed(2) ?? '—'}x`} />
            <KpiCard label="Impressões" value={fNum(ov.impressions)} />
            <KpiCard label="Cliques" value={fNum(ov.clicks)} />
            <KpiCard label="CTR" value={fPct(ov.ctr)} />
            <KpiCard label="CPM" value={fBRL(ov.cpm)} />
            {ov.link_clicks > 0 && <KpiCard label="Cliques no link" value={fNum(ov.link_clicks)} />}
            {ov.landing_page_views > 0 && <KpiCard label="Views landing page" value={fNum(ov.landing_page_views)} />}
            {ov.messages_started > 0 && <KpiCard label="Conversas iniciadas" value={fNum(ov.messages_started)} />}
            {ov.video_views > 0 && <KpiCard label="Views de vídeo" value={fNum(ov.video_views)} />}
          </div>

          {/* Daily trend */}
          {daily.length > 1 && (
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">Evolução diária</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 mb-2">Investimento (R$)</p>
                  <MiniBar data={daily} field="spend" color="#dc2626" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-600">{daily[0]?.date?.slice(5)}</span>
                    <span className="text-xs text-gray-600">{daily[daily.length-1]?.date?.slice(5)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Conversões</p>
                  <MiniBar data={daily} field="conversions" color="#22c55e" />
                  <div className="flex justify-between mt-1">
                    <span className="text-xs text-gray-600">{daily[0]?.date?.slice(5)}</span>
                    <span className="text-xs text-gray-600">{daily[daily.length-1]?.date?.slice(5)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Impressões</p>
                  <MiniBar data={daily} field="impressions" color="#3b82f6" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">Cliques</p>
                  <MiniBar data={daily} field="clicks" color="#a855f7" />
                </div>
              </div>
            </div>
          )}

          {/* Campaigns breakdown */}
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
                      <th className="text-right px-4 py-3 text-xs text-gray-500 font-medium">Conv.</th>
                      <th className="text-right px-5 py-3 text-xs text-gray-500 font-medium">CPR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-5 py-3 text-white text-xs font-medium max-w-[200px] truncate">{c.name}</td>
                        <td className="px-4 py-3 text-right text-red-400 text-xs font-semibold">{fBRL(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.reach)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.impressions)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fNum(c.clicks)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fPct(c.ctr)}</td>
                        <td className="px-4 py-3 text-right text-gray-300 text-xs">{fBRL(c.cpm)}</td>
                        <td className="px-4 py-3 text-right text-xs">
                          <span className={c.conversions > 0 ? 'text-green-400 font-semibold' : 'text-gray-600'}>
                            {c.conversions}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-300 text-xs">{c.cpr > 0 ? fBRL(c.cpr) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-white/10 bg-white/5">
                      <td className="px-5 py-3 text-xs text-gray-400 font-semibold">TOTAL</td>
                      <td className="px-4 py-3 text-right text-red-400 text-xs font-bold">{fBRL(ov.spend)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.reach)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.impressions)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fNum(ov.clicks)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fPct(ov.ctr)}</td>
                      <td className="px-4 py-3 text-right text-white text-xs font-semibold">{fBRL(ov.cpm)}</td>
                      <td className="px-4 py-3 text-right text-green-400 text-xs font-bold">{ov.conversions}</td>
                      <td className="px-5 py-3 text-right text-white text-xs font-semibold">{ov.cpr > 0 ? fBRL(ov.cpr) : '—'}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Extra metrics row */}
          {(ov.messages_started > 0 || ov.video_views > 0 || ov.landing_page_views > 0) && (
            <div className="grid grid-cols-3 gap-3">
              {ov.landing_page_views > 0 && (
                <div className="bg-black rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-500 mb-1">Taxa LP View/Clique</p>
                  <p className="text-white text-lg font-bold">
                    {ov.clicks > 0 ? ((ov.landing_page_views/ov.clicks)*100).toFixed(1) + '%' : '—'}
                  </p>
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
