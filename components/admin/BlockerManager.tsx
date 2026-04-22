'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Blocker, MONTH_FULL } from '@/types'
import { Plus, Trash2, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'

interface Props { clientId: string; blockers: Blocker[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function BlockerManager({ clientId, blockers: initial }: Props) {
  const [items, setItems] = useState<Blocker[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    month: String(new Date().getMonth() + 1),
    year: String(CURRENT_YEAR),
    description: '',
    evidence_url: '',
  })
  const supabase = createClient()

  async function add() {
    if (!form.description.trim()) return
    const { data } = await supabase.from('blockers').insert({
      client_id: clientId,
      month: parseInt(form.month),
      year: parseInt(form.year),
      description: form.description,
      evidence_url: form.evidence_url || null,
      resolved: false,
    }).select().single()
    if (data) {
      setItems(prev => [data, ...prev])
      setForm(f => ({ ...f, description: '', evidence_url: '' }))
      setShowForm(false)
    }
  }

  async function toggleResolved(item: Blocker) {
    await supabase.from('blockers').update({ resolved: !item.resolved }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, resolved: !i.resolved } : i))
  }

  async function remove(id: string) {
    if (!confirm('Remover este bloqueador?')) return
    await supabase.from('blockers').delete().eq('id', id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const sorted = [...items].sort((a, b) => {
    if (a.resolved !== b.resolved) return a.resolved ? 1 : -1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-amber-500" />
          <h2 className="font-medium text-gray-900">Pontos de Atenção (Bloqueadores)</h2>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Registrar bloqueador
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-amber-50 border-b border-amber-100 space-y-3">
          <p className="text-xs font-medium text-amber-800">Novo ponto de atenção</p>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
          <div>
            <label className="label">Descrição do bloqueador *</label>
            <textarea
              className="input min-h-[80px] resize-none"
              placeholder="Ex: Cartão recusado no Mapa da Mina, Atraso do cliente no envio de vídeos, Queda de API..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Link de evidência (print, chamado, etc.)</label>
            <input
              className="input"
              type="url"
              placeholder="https://..."
              value={form.evidence_url}
              onChange={e => setForm(f => ({ ...f, evidence_url: e.target.value }))}
            />
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="btn-primary text-xs py-1.5">Registrar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum bloqueador registrado.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {sorted.map(item => (
            <div key={item.id} className={`p-4 ${item.resolved ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => toggleResolved(item)} className="mt-0.5 flex-shrink-0">
                  <CheckCircle size={18} className={item.resolved ? 'text-green-500' : 'text-gray-300 hover:text-green-400'} />
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">{MONTH_FULL[item.month - 1]} {item.year}</span>
                    {item.resolved && <span className="badge-success text-xs">Resolvido</span>}
                    {!item.resolved && <span className="badge-warning text-xs">Ativo</span>}
                  </div>
                  <p className={`text-sm ${item.resolved ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {item.description}
                  </p>
                  {item.evidence_url && (
                    <a
                      href={item.evidence_url}
                      target="_blank"
                      rel="noopener"
                      className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mt-1"
                    >
                      <ExternalLink size={11} /> Ver evidência
                    </a>
                  )}
                </div>
                <button onClick={() => remove(item.id)} className="text-red-300 hover:text-red-500 flex-shrink-0">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
