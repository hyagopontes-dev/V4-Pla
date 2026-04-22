'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Highlight, MONTH_FULL } from '@/types'
import { Save, Plus, Star } from 'lucide-react'

interface Props { clientId: string; highlights: Highlight[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function HighlightManager({ clientId, highlights: initial }: Props) {
  const [items, setItems] = useState<Highlight[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ month: String(new Date().getMonth() + 1), year: String(CURRENT_YEAR) })
  const [saving, setSaving] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null)
  const supabase = createClient()

  async function addItem() {
    const exists = items.find(l => l.month === parseInt(form.month) && l.year === parseInt(form.year))
    if (exists) { setActiveId(exists.id); setShowForm(false); return }
    const { data } = await supabase.from('highlights').insert({
      client_id: clientId, month: parseInt(form.month), year: parseInt(form.year), content: ''
    }).select().single()
    if (data) { setItems(prev => [...prev, data]); setActiveId(data.id); setShowForm(false) }
  }

  async function saveItem(item: Highlight) {
    setSaving(item.id)
    await supabase.from('highlights').update({ content: item.content, updated_at: new Date().toISOString() }).eq('id', item.id)
    setSaving(null)
  }

  const sorted = [...items].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const active = sorted.find(l => l.id === activeId)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star size={16} className="text-yellow-500" />
          <h2 className="font-medium text-gray-900">Destaques Positivos</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Novo mês
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-100 flex items-end gap-3">
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
          <button onClick={addItem} className="btn-primary text-xs py-2">Criar</button>
          <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-2">Cancelar</button>
        </div>
      )}

      <div className="flex">
        {sorted.length > 0 && (
          <div className="w-32 border-r border-gray-100 bg-gray-50 flex-shrink-0">
            {sorted.map(l => (
              <button key={l.id} onClick={() => setActiveId(l.id)}
                className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100 transition-colors ${activeId === l.id ? 'bg-white font-medium text-gray-900' : 'text-gray-500 hover:bg-white'}`}>
                {MONTH_FULL[l.month - 1].slice(0, 3)} {l.year}
              </button>
            ))}
          </div>
        )}
        <div className="flex-1 p-4">
          {!active ? (
            <p className="text-gray-400 text-sm text-center py-6">Nenhum destaque registrado ainda.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">{MONTH_FULL[active.month - 1]} {active.year}</p>
              <textarea
                className="input min-h-[180px] resize-y text-sm"
                placeholder="Registre vitórias e aprendizados (ex: Automações com sucesso, recordes de engajamento, campanhas que performaram bem...)..."
                value={active.content ?? ''}
                onChange={e => setItems(prev => prev.map(i => i.id === active.id ? { ...i, content: e.target.value } : i))}
              />
              <button onClick={() => saveItem(active)} className="btn-primary flex items-center gap-2 text-xs py-1.5">
                <Save size={13} /> {saving === active.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
