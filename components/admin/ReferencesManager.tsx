'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ClientReference } from '@/types'
import { Plus, Trash2, ExternalLink, Link2 } from 'lucide-react'

interface Props { clientId: string; references: ClientReference[] }

const TYPES = {
  visual:      { label: 'Visual / Moodboard', color: 'bg-purple-100 text-purple-700' },
  concorrente: { label: 'Concorrente',         color: 'bg-red-100 text-red-700' },
  referencia:  { label: 'Referência geral',    color: 'bg-blue-100 text-blue-700' },
}

export default function ReferencesManager({ clientId, references: initial }: Props) {
  const [items, setItems] = useState<ClientReference[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', url: '', type: 'referencia' as ClientReference['type'], notes: '' })
  const supabase = createClient()

  async function add() {
    if (!form.name.trim()) return
    const { data } = await supabase.from('client_references').insert({
      client_id: clientId,
      name: form.name,
      url: form.url || null,
      type: form.type,
      notes: form.notes || null,
    }).select().single()
    if (data) {
      setItems(prev => [...prev, data])
      setForm({ name: '', url: '', type: 'referencia', notes: '' })
      setShowForm(false)
    }
  }

  async function remove(id: string) {
    if (!confirm('Remover esta referência?')) return
    await supabase.from('client_references').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const grouped = {
    visual:      items.filter(i => i.type === 'visual'),
    concorrente: items.filter(i => i.type === 'concorrente'),
    referencia:  items.filter(i => i.type === 'referencia'),
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 size={15} className="text-red-500" />
          <h2 className="font-medium text-gray-900">Referências do Cliente</h2>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-700">Nova referência</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome / Título *</label>
              <input className="input" placeholder="Ex: Nike, Pinterest Board, Coca-Cola..."
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tipo</label>
              <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as ClientReference['type'] }))}>
                <option value="referencia">Referência geral</option>
                <option value="visual">Visual / Moodboard</option>
                <option value="concorrente">Concorrente</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">URL (opcional)</label>
            <input className="input" type="url" placeholder="https://..."
              value={form.url} onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
          </div>
          <div>
            <label className="label">Observações (opcional)</label>
            <input className="input" placeholder="Ex: Referência para tom de voz, paleta de cores..."
              value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary text-xs py-1.5">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma referência cadastrada.</p>
      ) : (
        <div className="p-5 space-y-5">
          {(Object.entries(grouped) as [ClientReference['type'], ClientReference[]][]).map(([type, list]) => {
            if (!list.length) return null
            const t = TYPES[type]
            return (
              <div key={type}>
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.color}`}>{t.label}</span>
                  <span className="text-xs text-gray-400">{list.length}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {list.map(ref => (
                    <div key={ref.id} className="flex items-start gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{ref.name}</p>
                        {ref.notes && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{ref.notes}</p>}
                        {ref.url && (
                          <a href={ref.url} target="_blank" rel="noopener"
                            className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 mt-1 truncate">
                            <ExternalLink size={10} /> {ref.url}
                          </a>
                        )}
                      </div>
                      <button onClick={() => remove(ref.id)} className="text-red-300 hover:text-red-500 flex-shrink-0">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
