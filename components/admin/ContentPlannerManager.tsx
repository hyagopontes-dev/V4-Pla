'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ContentPlanner, MONTH_FULL } from '@/types'
import { Plus, Trash2, Save, ExternalLink, Calendar } from 'lucide-react'

interface Props { clientId: string; items: ContentPlanner[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]
const DAYS = [
  { value: 'segunda', label: 'Segunda' },
  { value: 'terca',   label: 'Terça' },
  { value: 'quarta',  label: 'Quarta' },
  { value: 'quinta',  label: 'Quinta' },
  { value: 'sexta',   label: 'Sexta' },
  { value: 'sabado',  label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
]
const STATUS = {
  roteiro:   { label: 'Roteiro',   color: 'bg-gray-100 text-gray-600' },
  gravando:  { label: 'Gravando',  color: 'bg-yellow-100 text-yellow-700' },
  gravado:   { label: 'Gravado',   color: 'bg-blue-100 text-blue-700' },
  publicado: { label: 'Publicado', color: 'bg-green-100 text-green-700' },
}

function uniqueSortedMonths(items: ContentPlanner[]): string[] {
  const seen: Record<string, boolean> = {}
  items.forEach(i => { seen[`${i.year}-${String(i.month).padStart(2,'0')}`] = true })
  return Object.keys(seen).sort().reverse()
}

export default function ContentPlannerManager({ clientId, items: initial }: Props) {
  const [items, setItems] = useState<ContentPlanner[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [filterMonth, setFilterMonth] = useState(String(new Date().getMonth() + 1))
  const [filterYear, setFilterYear] = useState(String(CURRENT_YEAR))
  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1), year: String(CURRENT_YEAR),
    day_of_week: 'segunda' as ContentPlanner['day_of_week'],
    title: '', description: '', format: '', recording_url: '', status: 'roteiro' as ContentPlanner['status']
  })
  const supabase = createClient()

  async function add() {
    if (!form.title.trim()) return
    const { data } = await supabase.from('content_planner').insert({
      client_id: clientId, month: parseInt(form.month), year: parseInt(form.year),
      day_of_week: form.day_of_week, title: form.title,
      description: form.description || null, format: form.format || null,
      recording_url: form.recording_url || null, status: form.status,
    }).select().single()
    if (data) { setItems(prev => [...prev, data]); setForm(f => ({ ...f, title: '', description: '', format: '', recording_url: '' })); setShowForm(false) }
  }

  async function saveItem(item: ContentPlanner) {
    setSaving(item.id)
    await supabase.from('content_planner').update({
      title: item.title, description: item.description, format: item.format,
      recording_url: item.recording_url, status: item.status, updated_at: new Date().toISOString()
    }).eq('id', item.id)
    setSaving(null)
  }

  async function remove(id: string) {
    if (!confirm('Remover este roteiro?')) return
    await supabase.from('content_planner').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function update(id: string, field: string, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } as ContentPlanner : i))
  }

  const filtered = items.filter(i => i.month === parseInt(filterMonth) && i.year === parseInt(filterYear))
  const byDay: Record<string, ContentPlanner[]> = {}
  DAYS.forEach(d => { byDay[d.value] = filtered.filter(i => i.day_of_week === d.value) })

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-red-500" />
          <h2 className="font-medium text-gray-900">Planner de Conteúdo</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Novo roteiro
        </button>
      </div>

      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
        <span className="text-xs text-gray-500">Mês:</span>
        <select className="input w-36 text-xs py-1" value={filterMonth} onChange={e => setFilterMonth(e.target.value)}>
          {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select className="input w-24 text-xs py-1" value={filterYear} onChange={e => setFilterYear(e.target.value)}>
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
        <span className="text-xs text-gray-400">{filtered.length} roteiro(s)</span>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-700">Novo roteiro</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Mês</label>
              <select className="input" value={form.month} onChange={e => setForm(f => ({ ...f, month: e.target.value }))}>
                {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Ano</label>
              <select className="input" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))}>
                {YEARS.map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Dia da semana</label>
              <select className="input" value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value as ContentPlanner['day_of_week'] }))}>
                {DAYS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Título do roteiro *</label>
              <input className="input" placeholder="Ex: Como aumentar seguidores..." value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div>
              <label className="label">Formato</label>
              <input className="input" placeholder="Ex: Reel, Carrossel, Story..." value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Descrição / Roteiro</label>
            <textarea className="input min-h-[80px] resize-none" placeholder="Detalhes do conteúdo, pontos a abordar..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Link da gravação</label>
              <input className="input" type="url" placeholder="https://..." value={form.recording_url} onChange={e => setForm(f => ({ ...f, recording_url: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ContentPlanner['status'] }))}>
                {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary text-xs py-1.5">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      <div className="p-5 space-y-4">
        {filtered.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Nenhum roteiro para {MONTH_FULL[parseInt(filterMonth)-1]} {filterYear}.</p>
        ) : DAYS.map(day => {
          const dayItems = byDay[day.value]
          if (!dayItems.length) return null
          return (
            <div key={day.value}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{day.label}</p>
              <div className="space-y-2">
                {dayItems.map(item => (
                  <div key={item.id} className="border border-gray-100 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2 justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <select
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer flex-shrink-0 ${STATUS[item.status].color}`}
                          value={item.status}
                          onChange={e => update(item.id, 'status', e.target.value)}
                        >
                          {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        {item.format && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{item.format}</span>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => saveItem(item)} className="text-gray-400 hover:text-brand-500 p-1">
                          {saving === item.id ? <span className="text-xs">...</span> : <Save size={13} />}
                        </button>
                        <button onClick={() => remove(item.id)} className="text-red-300 hover:text-red-500 p-1"><Trash2 size={13} /></button>
                      </div>
                    </div>
                    <input className="input text-sm py-1" value={item.title} onChange={e => update(item.id, 'title', e.target.value)} />
                    {(item.description !== undefined) && (
                      <textarea className="input text-xs py-1.5 min-h-[50px] resize-none w-full" placeholder="Roteiro..." value={item.description ?? ''} onChange={e => update(item.id, 'description', e.target.value)} />
                    )}
                    <div className="flex items-center gap-2">
                      <input className="input text-xs py-1 flex-1" placeholder="Link da gravação..." value={item.recording_url ?? ''} onChange={e => update(item.id, 'recording_url', e.target.value)} />
                      {item.recording_url && (
                        <a href={item.recording_url} target="_blank" rel="noopener" className="text-red-500 hover:text-red-700"><ExternalLink size={13} /></a>
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
