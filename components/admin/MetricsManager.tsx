'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { TrafficMetric, MONTH_FULL } from '@/types'
import { Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { clientId: string; metrics: TrafficMetric[] }

const MONTHS = MONTH_FULL
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const FIELDS: { key: string; label: string; inv?: boolean }[] = [
  { key: 'alcance',     label: 'Alcance' },
  { key: 'impressoes',  label: 'Impressões' },
  { key: 'cliques',     label: 'Cliques no link' },
  { key: 'ctr',         label: 'CTR (%)' },
  { key: 'cpm',         label: 'CPM (R$)', inv: true },
  { key: 'conversoes',  label: 'Conversões' },
  { key: 'cpr',         label: 'Custo por resultado (R$)', inv: true },
  { key: 'investimento',label: 'Valor investido (R$)' },
]

export default function MetricsManager({ clientId, metrics: initial }: Props) {
  const [items, setItems] = useState<TrafficMetric[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState({ month: '1', year: String(CURRENT_YEAR), platform: 'meta' as 'meta'|'google' })
  const supabase = createClient()

  async function addMetric() {
    const exists = items.find(i => i.month === parseInt(form.month) && i.year === parseInt(form.year) && i.platform === form.platform)
    if (exists) { alert('Já existe um registro para este período e plataforma.'); return }
    const { data, error } = await supabase.from('traffic_metrics').insert({
      client_id: clientId,
      month: parseInt(form.month),
      year: parseInt(form.year),
      platform: form.platform,
    }).select().single()
    if (!error && data) {
      setItems(prev => [...prev, data])
      setExpanded(data.id)
      setShowForm(false)
    }
  }

  async function saveMetric(item: TrafficMetric) {
    setSaving(item.id)
    const { id, client_id, month, year, platform, ...fields } = item
    await supabase.from('traffic_metrics').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', item.id)
    setSaving(null)
  }

  async function deleteMetric(id: string) {
    if (!confirm('Remover estas métricas?')) return
    await supabase.from('traffic_metrics').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateLocal(id: string, field: string, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value === '' ? null : parseFloat(value) } as TrafficMetric : i))
  }

  const sorted = [...items].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month !== b.month ? a.month - b.month : a.platform.localeCompare(b.platform))

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Métricas de tráfego pago</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar período
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Novo período de métricas</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Mês</label>
              <select className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Plataforma</label>
              <select className="input" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value as 'meta'|'google' }))}>
                <option value="meta">Meta Ads</option>
                <option value="google">Google Ads</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addMetric} className="btn-primary text-xs py-1.5">Criar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma métrica cadastrada ainda.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map(item => {
            const isOpen = expanded === item.id
            return (
              <div key={item.id}>
                <div
                  className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : item.id)}
                >
                  <div className="flex items-center gap-3">
                    <span className={`badge-${item.platform === 'meta' ? 'warning' : 'success'} text-xs`}>
                      {item.platform === 'meta' ? 'Meta Ads' : 'Google Ads'}
                    </span>
                    <span className="text-sm font-medium text-gray-800">
                      {MONTHS[item.month - 1]} {item.year}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); saveMetric(item) }} className="text-brand-500 hover:text-brand-700 p-1">
                      {saving === item.id ? <span className="text-xs text-gray-400">...</span> : <Save size={14} />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); deleteMetric(item.id) }} className="text-red-400 hover:text-red-600 p-1">
                      <Trash2 size={14} />
                    </button>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 bg-gray-50">
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                      {FIELDS.map(f => (
                        <div key={f.key} className="grid grid-cols-2 gap-2 items-end">
                          <div>
                            <label className="label">{f.label} — Meta</label>
                            <input
                              type="number" step="any" className="input text-xs py-1.5"
                              value={(item as any)[`meta_${f.key}`] ?? ''}
                              onChange={e => updateLocal(item.id, `meta_${f.key}`, e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="label">{f.label} — Realizado</label>
                            <input
                              type="number" step="any" className="input text-xs py-1.5"
                              value={(item as any)[`real_${f.key}`] ?? ''}
                              onChange={e => updateLocal(item.id, `real_${f.key}`, e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => saveMetric(item)} className="btn-primary text-xs py-1.5 mt-4">
                      {saving === item.id ? 'Salvando...' : 'Salvar métricas'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
