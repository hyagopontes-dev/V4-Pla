'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { OtherDeliverable, MONTH_FULL } from '@/types'
import { Plus, Save, Trash2, ExternalLink, Package } from 'lucide-react'

interface Props { clientId: string; items: OtherDeliverable[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const STATUS_LABELS = {
  pendente:  { label: 'Pendente',  class: 'bg-gray-100 text-gray-600' },
  entregue:  { label: 'Entregue',  class: 'bg-blue-100 text-blue-700' },
  concluido: { label: 'Concluído', class: 'bg-green-100 text-green-700' },
}

export default function OtherDeliverableManager({ clientId, items: initial }: Props) {
  const [items, setItems] = useState<OtherDeliverable[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState<string | null>(null)
  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(CURRENT_YEAR),
    description: '',
    status: 'pendente' as OtherDeliverable['status'],
    doc_url: '',
  })
  const supabase = createClient()

  async function add() {
    if (!form.description.trim()) return
    const { data } = await supabase.from('other_deliverables').insert({
      client_id: clientId,
      month: parseInt(form.month),
      year: parseInt(form.year),
      description: form.description,
      status: form.status,
      doc_url: form.doc_url || null,
    }).select().single()
    if (data) {
      setItems(prev => [data, ...prev])
      setForm(f => ({ ...f, description: '', doc_url: '' }))
      setShowForm(false)
    }
  }

  async function save(item: OtherDeliverable) {
    setSaving(item.id)
    await supabase.from('other_deliverables').update({
      description: item.description,
      status: item.status,
      doc_url: item.doc_url,
      updated_at: new Date().toISOString(),
    }).eq('id', item.id)
    setSaving(null)
  }

  async function remove(id: string) {
    if (!confirm('Remover esta entrega?')) return
    await supabase.from('other_deliverables').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function update(id: string, field: keyof OtherDeliverable, value: string) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i))
  }

  const sorted = [...items].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Package size={15} className="text-red-500" />
          <h2 className="font-medium text-gray-900">Outras Entregas</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Nova entrega
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
          <p className="text-xs font-medium text-gray-700">Nova entrega</p>
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
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as OtherDeliverable['status'] }))}>
                <option value="pendente">Pendente</option>
                <option value="entregue">Entregue</option>
                <option value="concluido">Concluído</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição *</label>
            <textarea
              className="input min-h-[70px] resize-none"
              placeholder="Descreva a entrega (ex: Criação de landing page, Relatório mensal, Setup de campanha...)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Link do documento (opcional)</label>
            <input className="input" type="url" placeholder="https://..."
              value={form.doc_url} onChange={e => setForm(f => ({ ...f, doc_url: e.target.value }))} />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary text-xs py-1.5">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhuma entrega cadastrada.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map(item => (
            <div key={item.id} className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-400 font-medium">{MONTH_FULL[item.month - 1]} {item.year}</span>
                    <select
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border-0 cursor-pointer ${STATUS_LABELS[item.status].class}`}
                      value={item.status}
                      onChange={e => update(item.id, 'status', e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="entregue">Entregue</option>
                      <option value="concluido">Concluído</option>
                    </select>
                  </div>
                  <textarea
                    className="input text-sm min-h-[60px] resize-none w-full"
                    value={item.description}
                    onChange={e => update(item.id, 'description', e.target.value)}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      className="input text-xs py-1.5 flex-1"
                      placeholder="Link do documento..."
                      value={item.doc_url ?? ''}
                      onChange={e => update(item.id, 'doc_url', e.target.value)}
                    />
                    {item.doc_url && (
                      <a href={item.doc_url} target="_blank" rel="noopener" className="text-red-500 hover:text-red-700">
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <button onClick={() => save(item)} className="text-gray-400 hover:text-brand-500 p-1">
                    {saving === item.id ? <span className="text-xs">...</span> : <Save size={14} />}
                  </button>
                  <button onClick={() => remove(item.id)} className="text-red-300 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
