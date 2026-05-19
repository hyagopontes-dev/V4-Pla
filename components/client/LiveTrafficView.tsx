'use client'
import { useState, useEffect, useCallback } from 'react'
import { AdsIntegration } from '@/types'
import { RefreshCw, Zap, AlertCircle, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react'

interface Props { integrations: AdsIntegration[]; dashboardType?: string }

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

const fBRL = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
const fNum = (v: number) => v >= 1000000 ? (v/1000000).toFixed(1)+'M' : v >= 1000 ? (v/1000).toFixed(1)+'K' : v.toLocaleString('pt-BR')
const fPct = (v: number) => v.toFixed(2)+'%'
const fX = (v: number) => v.toFixed(2)+'x'

function delta(curr: number, prev: number) {
  if (!prev || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

function KpiCard({ label, value, prev, prevLabel, accent, format = 'number' }: {
  label: string; value: number; prev?: number; prevLabel?: string; accent?: boolean
  format?: 'brl' | 'number' | 'pct' | 'x'
}) {
  const fmt = (v: number) => format === 'brl' ? fBRL(v) : format === 'pct' ? fPct(v) : format === 'x' ? fX(v) : fNum(v)
  const d = prev !== undefined ? delta(value, prev) : null
  const positive = d !== null && d >= 0

  return (
    <div className={`rounded-xl p-4 border ${accent ? 'bg-red-600 border-red-500' : 'bg-gray-900 border-white/5'}`}>
      <p className={`text-xs uppercase tracking-wide mb-1 font-medium ${accent ? 'text-red-200' : 'text-gray-500'}`}>{label}</p>
      <p className="text-xl font-bold text-white">{fmt(value)}</p>
      {d !== null && (
        <div className={`flex items-center gap-1 mt-1 ${positive ? 'text-green-400' : 'text-red-400'}`}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          <span className="text-xs font-medium">{positive ? '+' : ''}{d.toFixed(1)}%</span>
          {prevLabel && <span className="text-xs text-gray-600 ml-1">vs {prevLabel}</span>}
        </div>
      )}
    </div>
  )
}

function MiniBar({ data, field, color }: { data: any[]; field: string; color: string }) {
  if (!data?.length) return null
  const vals = data.map(d => (d[field] as number) ?? 0)
  const max = Math.max(...vals, 1)
  return (
    <div className="flex items-end gap-0.5 h-10">
      {vals.map((v, i) => (
        <div key={i} className="flex-1 rounded-sm min-h-[2px]"
          style={{ height: `${Math.max(4,(v/max)*100)}%`, background: color, opacity: 0.5+(i/vals.length)*0.5 }}
          title={`${data[i]?.date}: ${v}`} />
      ))}
    </div>
  )
}

function FilterDropdown({ label, options, value, onChange }: { label: string; options: {id:string;name:string}[]; value: string; onChange: (v:string) => void }) {
  const [open, setOpen] = useState(false)
  const selected = options.find(o => o.id === value)
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 bg-gray-900 border border-white/10 hover:border-white/30 text-white text-xs px-3 py-2 rounded-lg transition-colors">
        <span className="text-gray-400">{label}</span>
        {selected && <span className="text-white font-medium truncate max-w-[100px]">{selected.name}</span>}
        <ChevronDown size={11} className="text-gray-400 flex-shrink-0" />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 min-w-[200px] max-h-60 overflow-y-auto">
          <button onClick={() => { onChange(''); setOpen(false) }}
            className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-white/5 border-b border-white/5">Todos</button>
          {options.map(opt => (
            <button key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 ${value===opt.id?'text-red-400 bg-white/5':'text-gray-300'}`}>
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{children}</h3>
}

function FunnelBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const w = max > 0 ? Math.max(8, (value/max)*100) : 0
  return (
    <div className="flex items-center gap-3">
      <div className="w-32 text-right flex-shrink-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm font-bold text-white">{fNum(value)}</p>
      </div>
      <div className="flex-1 bg-gray-800 rounded h-5 overflow-hidden">
        <div className="h-full rounded transition-all" style={{ width: `${w}%`, background: color }} />
      </div>
    </div>
  )
}

function CampaignClassBadge({ cls }: { cls: string }) {
  if (!cls) return null
  const colors: Record<string,string> = { Escalar: 'bg-green-900/50 text-green-400 border-green-700/30', Manter: 'bg-yellow-900/50 text-yellow-400 border-yellow-700/30', Pausar: 'bg-red-900/50 text-red-400 border-red-700/30' }
  return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${colors[cls] ?? ''}`}>{cls}</span>
}

export default function LiveTrafficView({ integrations, dashboardType = 'inside_sales' }: Props) {
  const [preset, setPreset] = useState('this_month')
  const [showPresets, setShowPresets] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)
  const [calStart, setCalStart] = useState('')
  const [calEnd, setCalEnd] = useState('')
  const metaIntInit = integrations.find(i => i.platform === 'meta' && i.active)
  const googleIntInit = integrations.find(i => i.platform === 'google' && i.active)
  const [platform, setPlatform] = useState<'meta'|'google'>(metaIntInit ? 'meta' : 'google')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [lastUpdate, setLastUpdate] = useState<Date|null>(null)
  const [filterCampaign, setFilterCampaign] = useState('')
  const [filterAdset, setFilterAdset] = useState('')

  const metaInt = metaIntInit
  const googleInt = googleIntInit
  const available = [metaInt && 'meta', googleInt && 'google'].filter(Boolean) as string[]

  const fetch_ = useCallback(async () => {
    const int = platform === 'meta' ? metaInt : googleInt
    if (!int) return
    // Meta requires access_token; Google uses N8N webhook (only needs client_id)
    if (platform === 'meta' && !int.access_token) return
    setLoading(true); setError('')
    try {
      const res = await fetch(`/api/ads/${platform}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          platform === 'google'
            ? { client_id: int.client_id, date_preset: preset }
            : {
                access_token: int.access_token, account_id: int.account_id,
                date_preset: preset, dashboard_type: dashboardType,
                refresh_token: (int as any).refresh_token ?? null, client_id: int.client_id,
                filter_campaign_id: filterCampaign || undefined, filter_adset_id: filterAdset || undefined,
              }
        ),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? 'Erro')
      setData(json); setLastUpdate(new Date())
    } catch (e: any) { setError(e.message) }
    setLoading(false)
  }, [platform, preset, filterCampaign, filterAdset, metaInt, googleInt, dashboardType])

  useEffect(() => { fetch_() }, [fetch_])

  if (!available.length) return null

  const cur = data?.current  // works for both Meta (current) and Google (current)
  const prev = data?.previous
  const campaigns: any[] = data?.campaigns ?? []
  const daily: any[] = data?.daily ?? []
  const campaignList: any[] = data?.campaign_list ?? []
  const isEcom = dashboardType === 'ecommerce'
  const presetLabel = preset.includes('since:')
    ? (() => { const p = preset.split(','); return `${p[0]?.replace('since:','')} → ${p[1]?.replace('until:','')}` })()
    : PRESETS.find(p => p.key === preset)?.label ?? 'Este mês'

  const prevShort = data?.prev_period?.split(' → ')[0]?.slice(5) ?? ''

  return (
    <div className="space-y-5">
      {/* Header / Filters */}
      <div className="bg-black rounded-xl border border-white/10 px-5 py-4">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-red-500" />
            <h2 className="font-semibold text-white text-sm">
              {isEcom ? '📊 E-commerce' : '📞 Inside Sales'} — {platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
            </h2>
            {lastUpdate && <span className="text-xs text-gray-600">· {lastUpdate.toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</span>}
          </div>
          <button onClick={fetch_} disabled={loading}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white border border-white/10 hover:border-white/30 px-3 py-1.5 rounded-lg transition-colors">
            <RefreshCw size={12} className={loading?'animate-spin':''} />
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {available.length > 1 && available.map(p => (
            <button key={p} onClick={() => setPlatform(p as any)}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors ${platform===p?'bg-white text-black border-white':'bg-gray-900 border-white/10 text-gray-400 hover:text-white'}`}>
              {p==='meta'?'📘 Meta Ads':'🔵 Google Ads'}
            </button>
          ))}
          {campaignList.length > 0 && (
            <FilterDropdown label="Campanhas" options={campaignList} value={filterCampaign}
              onChange={v => { setFilterCampaign(v); setFilterAdset('') }} />
          )}
          {filterCampaign && (data?.adset_list ?? []).length > 0 && (
            <FilterDropdown label="Conjuntos" options={data.adset_list} value={filterAdset} onChange={setFilterAdset} />
          )}

          {/* Period */}
          <div className="relative ml-auto">
            <button onClick={() => { setShowPresets(o => !o); setShowCalendar(false) }}
              className="flex items-center gap-2 bg-gray-900 border border-white/10 hover:border-white/30 text-white text-xs px-4 py-2 rounded-lg">
              <span className="text-gray-300">{presetLabel}</span>
              <ChevronDown size={11} className="text-gray-400" />
            </button>
            {showPresets && (
              <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 min-w-[180px]">
                {PRESETS.map(pr => (
                  <button key={pr.key} onClick={() => { setPreset(pr.key); setShowPresets(false) }}
                    className={`w-full text-left px-4 py-2.5 text-xs hover:bg-white/5 ${preset===pr.key&&!preset.includes('since')?'text-red-400 bg-white/5':'text-gray-300'}`}>
                    {pr.label}
                  </button>
                ))}
                <div className="border-t border-white/10">
                  <button onClick={() => { setShowCalendar(true); setShowPresets(false); setCalStart(''); setCalEnd('') }}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-300 hover:bg-white/5">
                    📅 Período personalizado
                  </button>
                </div>
              </div>
            )}
            {showCalendar && (
              <div className="absolute top-full right-0 mt-1 bg-gray-900 border border-white/10 rounded-xl shadow-2xl z-50 p-4 min-w-[260px]">
                <p className="text-xs text-gray-400 mb-3 font-medium">Período personalizado</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Início</label>
                    <input type="date" value={calStart} onChange={e => setCalStart(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Término</label>
                    <input type="date" value={calEnd} min={calStart} onChange={e => setCalEnd(e.target.value)}
                      className="w-full bg-gray-800 border border-white/10 text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-red-500" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowCalendar(false)}
                    className="flex-1 text-xs text-gray-400 border border-white/10 px-3 py-2 rounded-lg hover:bg-white/5">Cancelar</button>
                  <button disabled={!calStart || !calEnd}
                    onClick={() => { setPreset(`since:${calStart},until:${calEnd}`); setShowCalendar(false) }}
                    className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg disabled:opacity-40 font-medium">Aplicar</button>
                </div>
              </div>
            )}
          </div>
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
          {[...Array(8)].map((_,i) => (
            <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4 animate-pulse">
              <div className="h-2.5 bg-gray-800 rounded w-16 mb-3" /><div className="h-6 bg-gray-800 rounded w-20" />
            </div>
          ))}
        </div>
      )}

      {data && platform === 'google' && data.current && (
        // ═══════════════════════════════════════════
        // GOOGLE ADS DASHBOARD
        // ═══════════════════════════════════════════
        <div className="space-y-5">
          {/* Visão Geral */}
          <div className="bg-black rounded-xl border border-white/10 p-5">
            <SectionTitle>Visão Geral — Google Ads</SectionTitle>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <KpiCard label="Valor Gasto" value={data.current.spend} prev={data.previous?.spend} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="brl" accent />
              <KpiCard label="Cliques" value={data.current.clicks} prev={data.previous?.clicks} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} />
              <KpiCard label="Impressões" value={data.current.impressions} prev={data.previous?.impressions} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} />
              <KpiCard label="CTR" value={data.current.ctr} prev={data.previous?.ctr} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="pct" />
              <KpiCard label="CPC" value={data.current.cpc} prev={data.previous?.cpc} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="brl" />
              <KpiCard label="CPM" value={data.current.cpm} prev={data.previous?.cpm} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="brl" />
              {data.current.conversions > 0 && <KpiCard label="Conversões" value={data.current.conversions} prev={data.previous?.conversions} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} />}
              {data.current.cpa > 0 && <KpiCard label="Custo/Conversão" value={data.current.cpa} prev={data.previous?.cpa} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="brl" />}
              {data.current.roas > 0 && <KpiCard label="ROAS" value={data.current.roas} prev={data.previous?.roas} prevLabel={data.prev_period?.split(' → ')[0]?.slice(5)} format="x" />}
            </div>
          </div>

          {/* Campanhas */}
          {(data.campaigns ?? []).length > 0 && (
            <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <SectionTitle>Campanhas</SectionTitle>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500">
                      <th className="text-left px-5 py-3 font-medium">Campanha</th>
                      <th className="text-right px-4 py-3 font-medium">Gasto</th>
                      <th className="text-right px-4 py-3 font-medium">Impressões</th>
                      <th className="text-right px-4 py-3 font-medium">Cliques</th>
                      <th className="text-right px-4 py-3 font-medium">CTR</th>
                      <th className="text-right px-4 py-3 font-medium">CPC</th>
                      <th className="text-right px-4 py-3 font-medium">Conv.</th>
                      <th className="text-right px-5 py-3 font-medium">CPA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data.campaigns ?? []).map((c: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                        <td className="px-5 py-3 max-w-[200px]">
                          <p className="text-white font-medium truncate">{c.name}</p>
                          {c.type && <p className="text-gray-600 mt-0.5">{c.type}</p>}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 font-semibold">{fBRL(c.spend)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{fNum(c.impressions)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{fNum(c.clicks)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{fPct(c.ctr)}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{c.cpc > 0 ? fBRL(c.cpc) : '—'}</td>
                        <td className="px-4 py-3 text-right text-green-400 font-bold">{c.conversions > 0 ? fNum(c.conversions) : '—'}</td>
                        <td className="px-5 py-3 text-right text-gray-300">{c.cpa > 0 ? fBRL(c.cpa) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* GA4 Channels */}
          {(data.channels ?? []).length > 0 && (
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>Canais Google Ads (via GA4)</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(data.channels ?? []).map((ch: any, i: number) => (
                  <div key={i} className="bg-gray-900 border border-white/5 rounded-xl p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{ch.name}</p>
                    <p className="text-xl font-bold text-white">{fNum(ch.sessions)}</p>
                    <p className="text-xs text-gray-600 mt-1">sessões · {fNum(ch.conversions)} conv.</p>
                    {ch.spend > 0 && <p className="text-xs text-gray-600">Gasto: {fBRL(ch.spend)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily chart */}
          {(data.daily ?? []).length > 1 && (
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>Evolução diária</SectionTitle>
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: 'Investimento', field: 'spend', color: '#dc2626' },
                  { label: 'Cliques', field: 'clicks', color: '#3b82f6' },
                  { label: 'Impressões', field: 'impressions', color: '#a855f7' },
                  { label: 'Conversões', field: 'conversions', color: '#22c55e' },
                ].map(({ label, field, color }) => (
                  <div key={field}>
                    <p className="text-xs text-gray-500 mb-1">{label}</p>
                    <MiniBar data={data.daily} field={field} color={color} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-600 mt-2">
                <span>{data.daily[0]?.date?.slice(5)}</span>
                <span>{data.daily[data.daily.length-1]?.date?.slice(5)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {data && platform !== 'google' && cur && (
        isEcom ? (
          // ═══════════════════════════════════════════
          // E-COMMERCE DASHBOARD
          // ═══════════════════════════════════════════
          <div className="space-y-5">
            {/* 1. Visão Geral */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>1. Visão Geral</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Valor Gasto" value={cur.spend} prev={prev?.spend} prevLabel={prevShort} format="brl" accent />
                <KpiCard label="Compras" value={cur.purchases} prev={prev?.purchases} prevLabel={prevShort} />
                <KpiCard label="Conversão" value={cur.conversion_value} prev={prev?.conversion_value} prevLabel={prevShort} format="brl" />
                <KpiCard label="ROAS" value={cur.roas} prev={prev?.roas} prevLabel={prevShort} format="x" />
                <KpiCard label="CPA" value={cur.cpa} prev={prev?.cpa} prevLabel={prevShort} format="brl" />
                <KpiCard label="Frequência" value={cur.frequency} prev={prev?.frequency} prevLabel={prevShort} />
                <KpiCard label="CPM" value={cur.cpm} prev={prev?.cpm} prevLabel={prevShort} format="brl" />
              </div>
            </div>

            {/* 2. Performance de Entrega */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>2. Performance de Entrega</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Impressões" value={cur.impressions} prev={prev?.impressions} prevLabel={prevShort} />
                <KpiCard label="Alcance" value={cur.reach} prev={prev?.reach} prevLabel={prevShort} />
                <KpiCard label="CTR" value={cur.ctr} prev={prev?.ctr} prevLabel={prevShort} format="pct" />
                <KpiCard label="CPC" value={cur.cpc} prev={prev?.cpc} prevLabel={prevShort} format="brl" />
                <KpiCard label="Cliques no link" value={cur.clicks} prev={prev?.clicks} prevLabel={prevShort} />
                <KpiCard label="Frequência" value={cur.frequency} prev={prev?.frequency} prevLabel={prevShort} />
              </div>
            </div>

            {/* 3. Conversão */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>3. Conversão</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Compras" value={cur.purchases} prev={prev?.purchases} prevLabel={prevShort} />
                <KpiCard label="CPA" value={cur.cpa} prev={prev?.cpa} prevLabel={prevShort} format="brl" />
                <KpiCard label="Taxa Conv. (clique→compra)" value={cur.conv_rate_clicks_purchase} prev={prev?.conv_rate_clicks_purchase} prevLabel={prevShort} format="pct" />
                <KpiCard label="ROAS" value={cur.roas} prev={prev?.roas} prevLabel={prevShort} format="x" />
              </div>
            </div>

            {/* 4. Funil */}
            {(cur.view_content > 0 || cur.add_to_cart > 0 || cur.initiate_checkout > 0) && (
              <div className="bg-black rounded-xl border border-white/10 p-5">
                <SectionTitle>4. Funil — Eventos do Pixel</SectionTitle>
                <div className="space-y-2.5 mb-4">
                  {[
                    { label: 'View Content', value: cur.view_content, cost: cur.cost_view_content, color: '#3b82f6' },
                    { label: 'Add to Cart', value: cur.add_to_cart, cost: cur.cost_add_to_cart, color: '#60a5fa' },
                    { label: 'Initiate Checkout', value: cur.initiate_checkout, cost: cur.cost_initiate_checkout, color: '#93c5fd' },
                    { label: 'Compras', value: cur.purchases, cost: cur.cpa, color: '#22c55e' },
                  ].filter(s => s.value > 0).map((step, i, arr) => (
                    <div key={step.label}>
                      <FunnelBar label={step.label} value={step.value} max={arr[0].value} color={step.color} />
                      {step.cost > 0 && <p className="text-xs text-gray-600 pl-36 mt-0.5">Custo: {fBRL(step.cost)}</p>}
                      {i < arr.length - 1 && arr[i+1].value > 0 && (
                        <p className="text-xs text-gray-600 pl-36">→ Conv: {((arr[i+1].value / step.value) * 100).toFixed(1)}%</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. Criativos / Campanhas */}
            {campaigns.length > 0 && (
              <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <SectionTitle>5. {filterAdset ? 'Anúncios' : filterCampaign ? 'Conjuntos' : 'Campanhas'}</SectionTitle>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500">
                        <th className="text-left px-5 py-3 font-medium">Campanha</th>
                        <th className="text-right px-4 py-3 font-medium">Gasto</th>
                        <th className="text-right px-4 py-3 font-medium">ROAS</th>
                        <th className="text-right px-4 py-3 font-medium">CPA</th>
                        <th className="text-right px-4 py-3 font-medium">CTR</th>
                        <th className="text-right px-4 py-3 font-medium">Freq.</th>
                        <th className="text-right px-4 py-3 font-medium">Compras</th>
                        <th className="text-right px-4 py-3 font-medium">Conv%</th>
                        <th className="text-right px-5 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c,i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 max-w-[180px]"><p className="text-white font-medium truncate">{c.name}</p></td>
                          <td className="px-4 py-3 text-right text-red-400 font-semibold">{fBRL(c.spend)}</td>
                          <td className="px-4 py-3 text-right text-white">{fX(c.roas)}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.cpa > 0 ? fBRL(c.cpa) : '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{fPct(c.ctr)}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.frequency.toFixed(2)}x</td>
                          <td className="px-4 py-3 text-right text-green-400 font-bold">{c.purchases}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.conv_rate_clicks_purchase > 0 ? fPct(c.conv_rate_clicks_purchase) : '—'}</td>
                          <td className="px-5 py-3 text-right"><CampaignClassBadge cls={c.classification} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily charts */}
            {daily.length > 1 && (
              <div className="bg-black rounded-xl border border-white/10 p-5">
                <SectionTitle>Evolução diária</SectionTitle>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Investimento', field: 'spend', color: '#dc2626' },
                    { label: 'ROAS', field: 'roas', color: '#22c55e' },
                    { label: 'Compras', field: 'purchases', color: '#3b82f6' },
                    { label: 'Cliques', field: 'clicks', color: '#a855f7' },
                  ].map(({ label, field, color }) => (
                    <div key={field}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <MiniBar data={daily} field={field} color={color} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{daily[0]?.date?.slice(5)}</span><span>{daily[daily.length-1]?.date?.slice(5)}</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // ═══════════════════════════════════════════
          // INSIDE SALES DASHBOARD
          // ═══════════════════════════════════════════
          <div className="space-y-5">
            {/* 1. Visão Geral */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>1. Visão Geral</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="Valor Gasto" value={cur.spend} prev={prev?.spend} prevLabel={prevShort} format="brl" accent />
                <KpiCard label="Leads Gerados" value={cur.leads} prev={prev?.leads} prevLabel={prevShort} />
                <KpiCard label="CPL (total)" value={cur.cpl} prev={prev?.cpl} prevLabel={prevShort} format="brl" />
                <KpiCard label="CTR" value={cur.ctr} prev={prev?.ctr} prevLabel={prevShort} format="pct" />
                <KpiCard label="CPC" value={cur.cpc} prev={prev?.cpc} prevLabel={prevShort} format="brl" />
                <KpiCard label="Frequência" value={cur.frequency} prev={prev?.frequency} prevLabel={prevShort} />
                <KpiCard label="CPM" value={cur.cpm} prev={prev?.cpm} prevLabel={prevShort} format="brl" />
              </div>
            </div>

            {/* 2. Geração de Leads */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>2. Geração de Leads</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <KpiCard label="Total de Leads" value={cur.leads} prev={prev?.leads} prevLabel={prevShort} accent />
                <KpiCard label="CPL (total)" value={cur.cpl} prev={prev?.cpl} prevLabel={prevShort} format="brl" />
                <KpiCard label="Taxa Conv. (clique→lead)" value={cur.conv_rate_clicks_lead} prev={prev?.conv_rate_clicks_lead} prevLabel={prevShort} format="pct" />
              </div>
              {/* Lead breakdown by type */}
              {(cur.leads_form > 0 || cur.leads_messages > 0 || cur.leads_registration > 0) && (
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-white/10">
                  {cur.leads_form > 0 && (
                    <div className="bg-gray-900 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">📋 Formulários / Site</p>
                      <p className="text-lg font-bold text-white">{fNum(cur.leads_form)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">CPL: {cur.leads_form > 0 ? fBRL(cur.spend / cur.leads_form) : '—'}</p>
                    </div>
                  )}
                  {cur.leads_messages > 0 && (
                    <div className="bg-gray-900 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">💬 Conversas / WhatsApp</p>
                      <p className="text-lg font-bold text-white">{fNum(cur.leads_messages)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">CPL: {fBRL(cur.spend / cur.leads_messages)}</p>
                    </div>
                  )}
                  {cur.leads_registration > 0 && (
                    <div className="bg-gray-900 rounded-xl p-3 border border-white/5">
                      <p className="text-xs text-gray-500 mb-1">📝 Cadastros</p>
                      <p className="text-lg font-bold text-white">{fNum(cur.leads_registration)}</p>
                      <p className="text-xs text-gray-600 mt-0.5">CPL: {fBRL(cur.spend / cur.leads_registration)}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Qualidade */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>3. Qualidade</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <KpiCard label="CTR" value={cur.ctr} prev={prev?.ctr} prevLabel={prevShort} format="pct" />
                <KpiCard label="CPC" value={cur.cpc} prev={prev?.cpc} prevLabel={prevShort} format="brl" />
                <KpiCard label="Frequência" value={cur.frequency} prev={prev?.frequency} prevLabel={prevShort} />
                <KpiCard label="Alcance" value={cur.reach} prev={prev?.reach} prevLabel={prevShort} />
                <KpiCard label="Impressões" value={cur.impressions} prev={prev?.impressions} prevLabel={prevShort} />
                <KpiCard label="CPM" value={cur.cpm} prev={prev?.cpm} prevLabel={prevShort} format="brl" />
              </div>
            </div>

            {/* 4. Funil */}
            <div className="bg-black rounded-xl border border-white/10 p-5">
              <SectionTitle>4. Funil</SectionTitle>
              <div className="space-y-2.5">
                <FunnelBar label="Impressões" value={cur.impressions} max={cur.impressions} color="#3b82f6" />
                <FunnelBar label="Cliques" value={cur.clicks} max={cur.impressions} color="#60a5fa" />
                <FunnelBar label="Leads" value={cur.leads || cur.messages} max={cur.impressions} color="#22c55e" />
              </div>
            </div>

            {/* 5. Campanhas */}
            {campaigns.length > 0 && (
              <div className="bg-black rounded-xl border border-white/10 overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10">
                  <SectionTitle>5. {filterAdset ? 'Anúncios' : filterCampaign ? 'Conjuntos' : 'Campanhas'}</SectionTitle>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/5 text-gray-500">
                        <th className="text-left px-5 py-3 font-medium">Campanha</th>
                        <th className="text-right px-4 py-3 font-medium">Gasto</th>
                        <th className="text-right px-4 py-3 font-medium">Leads</th>
                        <th className="text-right px-4 py-3 font-medium">CPL</th>
                        <th className="text-right px-4 py-3 font-medium">CTR</th>
                        <th className="text-right px-4 py-3 font-medium">CPC</th>
                        <th className="text-right px-4 py-3 font-medium">Freq.</th>
                        <th className="text-right px-5 py-3 font-medium">Conv%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {campaigns.map((c,i) => (
                        <tr key={i} className="border-b border-white/5 hover:bg-white/5">
                          <td className="px-5 py-3 max-w-[180px]">
                            <p className="text-white font-medium truncate">{c.name}</p>
                            {c.result_label && <p className="text-gray-600 mt-0.5">{c.result_label}</p>}
                          </td>
                          <td className="px-4 py-3 text-right text-red-400 font-semibold">{fBRL(c.spend)}</td>
                          <td className="px-4 py-3 text-right text-green-400 font-bold">{c.leads > 0 ? fNum(c.leads) : c.result_value > 0 ? fNum(c.result_value) : '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.leads > 0 ? fBRL(c.spend / c.leads) : c.result_value > 0 ? fBRL(c.spend / c.result_value) : '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{fPct(c.ctr)}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.cpc > 0 ? fBRL(c.cpc) : '—'}</td>
                          <td className="px-4 py-3 text-right text-gray-300">{c.frequency.toFixed(2)}x</td>
                          <td className="px-5 py-3 text-right text-gray-300">{c.conv_rate_clicks_lead > 0 ? fPct(c.conv_rate_clicks_lead) : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Daily charts */}
            {daily.length > 1 && (
              <div className="bg-black rounded-xl border border-white/10 p-5">
                <SectionTitle>Evolução diária</SectionTitle>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { label: 'Investimento', field: 'spend', color: '#dc2626' },
                    { label: 'Leads', field: 'leads', color: '#22c55e' },
                    { label: 'Cliques', field: 'clicks', color: '#3b82f6' },
                  ].map(({ label, field, color }) => (
                    <div key={field}>
                      <p className="text-xs text-gray-500 mb-1">{label}</p>
                      <MiniBar data={daily} field={field} color={color} />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-2">
                  <span>{daily[0]?.date?.slice(5)}</span><span>{daily[daily.length-1]?.date?.slice(5)}</span>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
