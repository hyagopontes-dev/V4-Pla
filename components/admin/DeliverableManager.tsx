'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Deliverable, MONTH_FULL } from '@/types'
import { Plus, Save, ExternalLink, Trash2 } from 'lucide-react'

interface Props {
  clientId: string
  contractPieces: number
  deliverables: Deliverable[]
}

const MONTHS = MONTH_FULL
const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function DeliverableManager({ clientId, contractPieces, deliverables: initial }: Props) {
  const [items, setItems] = useState<Deliverable[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState({ month: '1', year: String(CURRENT_YEAR), delivered: '0', doc_url: '', notes: '' })
  const supabase = createClient()

  async function saveItem(item: Deliverable) {
    setSaving(item.id)
    await supabase.from('deliverables').update({
      delivered: item.delivered,
      doc_url: item.doc_url,
      notes: item.notes,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)
    setSaving(null)
  }

  async function addItem() {
    const { data, error } = await supabase.from('deliverables').insert({
      client_id: clientId,
      month: parseInt(form.month),
      year: parseInt(form.year),
      delivered: parseInt(form.delivered),
      doc_url: form.doc_url || null,
      notes: form.notes || null,
    }).select().single()
    if (!error && data) {
      setItems(prev => [...prev, data])
      setShowForm(false)
      setForm({ month: '1', year: String(CURRENT_YEAR), delivered: '0', doc_url: '', notes: '' })
    }
  }

  async function deleteItem(id: string) {
    if (!confirm('Remover esta entrega?')) return
    await supabase.from('deliverables').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateLocal(id: string, field: keyof Deliverable, value: string | number) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const sorted = [...items].sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Entregas orgânicas</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar mês
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 mb-3">Nova entrada de entrega</p>
          <div className="grid grid-cols-2 gap-3">
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
              <label className="label">Peças entregues</label>
              <input className="input" type="number" min="0" value={form.delivered} onChange={e => setForm(f => ({ ...f, delivered: e.target.value }))} />
            </div>
            <div>
              <label className="label">Link do documento</label>
              <input className="input" type="url" placeholder="https://..." value={form.doc_url} onChange={e => setForm(f => ({ ...f, doc_url: e.target.value }))} />
            </div>
            <div className="col-span-2">
              <label className="label">Observações</label>
              <input className="input" placeholder="Opcional..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <button onClick={addItem} className="btn-primary text-xs py-1.5">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma entrega cadastrada ainda.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Período</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Entregue</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Meta</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Status</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Doc URL</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(item => {
              const pct = Math.round((item.delivered / contractPieces) * 100)
              const over = item.delivered > contractPieces
              return (
                <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">
                    {MONTHS[item.month - 1]} {item.year}
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="number" min="0"
                      className="input w-20 text-sm py-1"
                      value={item.delivered}
                      onChange={e => updateLocal(item.id, 'delivered', parseInt(e.target.value) || 0)}
                    />
                  </td>
                  <td className="px-5 py-3 text-gray-600">{contractPieces}</td>
                  <td className="px-5 py-3">
                    {over
                      ? <span className="badge-success">+{item.delivered - contractPieces} acima</span>
                      : item.delivered === contractPieces
                        ? <span className="badge-success">100%</span>
                        : item.delivered === 0
                          ? <span className="badge-neutral">Pendente</span>
                          : <span className="badge-warning">{pct}%</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        className="input text-xs py-1 w-48"
                        placeholder="https://..."
                        value={item.doc_url ?? ''}
                        onChange={e => updateLocal(item.id, 'doc_url', e.target.value)}
                      />
                      {item.doc_url && (
                        <a href={item.doc_url} target="_blank" rel="noopener" className="text-brand-500 hover:text-brand-700">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => saveItem(item)}
                        className="text-brand-500 hover:text-brand-700 p-1"
                        title="Salvar"
                      >
                        {saving === item.id ? (
                          <span className="text-xs text-gray-400">...</span>
                        ) : <Save size={14} />}
                      </button>
                      <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
