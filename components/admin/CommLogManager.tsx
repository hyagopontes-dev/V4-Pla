'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { CommLog, MONTH_FULL } from '@/types'
import { Save, Plus } from 'lucide-react'

interface Props { clientId: string; logs: CommLog[] }

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function CommLogManager({ clientId, logs: initial }: Props) {
  const [logs, setLogs] = useState<CommLog[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ month: String(new Date().getMonth() + 1), year: String(CURRENT_YEAR) })
  const [saving, setSaving] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(logs[0]?.id ?? null)
  const supabase = createClient()

  async function addLog() {
    const exists = logs.find(l => l.month === parseInt(form.month) && l.year === parseInt(form.year))
    if (exists) { setActiveId(exists.id); setShowForm(false); return }
    const { data } = await supabase.from('comm_logs').insert({
      client_id: clientId, month: parseInt(form.month), year: parseInt(form.year), content: ''
    }).select().single()
    if (data) { setLogs(prev => [...prev, data]); setActiveId(data.id); setShowForm(false) }
  }

  async function saveLog(log: CommLog) {
    setSaving(log.id)
    await supabase.from('comm_logs').update({ content: log.content, updated_at: new Date().toISOString() }).eq('id', log.id)
    setSaving(null)
  }

  function updateContent(id: string, content: string) {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, content } : l))
  }

  const sorted = [...logs].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)
  const active = sorted.find(l => l.id === activeId)

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Comunicação & Histórico</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Novo mês
        </button>
      </div>

      {showForm && (
        <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-end gap-3">
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
          <button onClick={addLog} className="btn-primary text-xs py-2">Criar</button>
          <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-2">Cancelar</button>
        </div>
      )}

      <div className="flex">
        {sorted.length > 0 && (
          <div className="w-32 border-r border-gray-100 bg-gray-50 flex-shrink-0">
            {sorted.map(l => (
              <button
                key={l.id}
                onClick={() => setActiveId(l.id)}
                className={`w-full text-left px-3 py-2.5 text-xs border-b border-gray-100 transition-colors ${activeId === l.id ? 'bg-white font-medium text-gray-900' : 'text-gray-500 hover:bg-white'}`}
              >
                {MONTH_FULL[l.month - 1].slice(0, 3)} {l.year}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 p-4">
          {!active ? (
            <p className="text-gray-400 text-sm text-center py-6">Nenhum log criado ainda.</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">{MONTH_FULL[active.month - 1]} {active.year}</p>
              <textarea
                className="input min-h-[180px] resize-y text-sm"
                placeholder="Registre conversas, reuniões, decisões importantes. Suporta links: https://meet.google.com/..."
                value={active.content ?? ''}
                onChange={e => updateContent(active.id, e.target.value)}
              />
              <button onClick={() => saveLog(active)} className="btn-primary flex items-center gap-2 text-xs py-1.5">
                <Save size={13} /> {saving === active.id ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
