'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Client, MONTH_FULL } from '@/types'
import { Save, Plus, ChevronDown, ChevronUp, Target, FileText } from 'lucide-react'

interface Props { client: Client; monthlyObjectives: MonthlyObjective[] }

interface MonthlyObjective {
  id: string
  client_id: string
  month: number
  year: number
  content: string
  updated_at: string
}

const CURRENT_YEAR = new Date().getFullYear()
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

export default function ScopeManager({ client, monthlyObjectives: initial }: Props) {
  const [scope, setScope] = useState(client.scope_description ?? '')
  const [savingScope, setSavingScope] = useState(false)
  const [savedScope, setSavedScope] = useState(false)
  const [scopeOpen, setScopeOpen] = useState(!client.scope_description)

  const [objectives, setObjectives] = useState<MonthlyObjective[]>(initial)
  const [showObjForm, setShowObjForm] = useState(false)
  const [objForm, setObjForm] = useState({ month: String(new Date().getMonth() + 1), year: String(CURRENT_YEAR), content: '' })
  const [savingObj, setSavingObj] = useState<string | null>(null)
  const [expandedObj, setExpandedObj] = useState<string | null>(null)

  const supabase = createClient()

  async function saveScope() {
    setSavingScope(true)
    await supabase.from('clients').update({ scope_description: scope }).eq('id', client.id)
    setSavingScope(false)
    setSavedScope(true)
    setScopeOpen(false)
    setTimeout(() => setSavedScope(false), 2000)
  }

  async function addObjective() {
    if (!objForm.content.trim()) return
    const exists = objectives.find(o => o.month === parseInt(objForm.month) && o.year === parseInt(objForm.year))
    if (exists) {
      setObjectives(prev => prev.map(o => o.id === exists.id ? { ...o, content: objForm.content } : o))
      await supabase.from('monthly_objectives').update({ content: objForm.content, updated_at: new Date().toISOString() }).eq('id', exists.id)
      setShowObjForm(false)
      setObjForm(f => ({ ...f, content: '' }))
      return
    }
    const { data } = await supabase.from('monthly_objectives').insert({
      client_id: client.id,
      month: parseInt(objForm.month),
      year: parseInt(objForm.year),
      content: objForm.content,
    }).select().single()
    if (data) {
      setObjectives(prev => [data, ...prev])
      setShowObjForm(false)
      setObjForm(f => ({ ...f, content: '' }))
    }
  }

  async function saveObjective(obj: MonthlyObjective) {
    setSavingObj(obj.id)
    await supabase.from('monthly_objectives').update({ content: obj.content, updated_at: new Date().toISOString() }).eq('id', obj.id)
    setSavingObj(null)
    setExpandedObj(null)
  }

  const sortedObjs = [...objectives].sort((a, b) => a.year !== b.year ? b.year - a.year : b.month - a.month)

  return (
    <div className="space-y-4">

      {/* Escopo contratado */}
      <div className="card p-0 overflow-hidden">
        <button
          className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
          onClick={() => setScopeOpen(v => !v)}
        >
          <div className="flex items-center gap-2">
            <FileText size={15} className="text-brand-500" />
            <span className="font-medium text-gray-900">Escopo contratado</span>
            {client.scope_description && !scopeOpen && (
              <span className="badge-success text-xs">Preenchido</span>
            )}
          </div>
          {scopeOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>
        {scopeOpen && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <textarea
              className="input min-h-[100px] resize-y mt-4"
              placeholder="Descreva o que está ativo no contrato (ex: Gestão de Instagram, Tráfego Meta Ads, Google Search...)..."
              value={scope}
              onChange={e => setScope(e.target.value)}
            />
            <button onClick={saveScope} disabled={savingScope} className="btn-primary flex items-center gap-2 mt-3 disabled:opacity-60">
              <Save size={14} /> {savedScope ? 'Salvo!' : savingScope ? 'Salvando...' : 'Salvar e recolher'}
            </button>
          </div>
        )}
      </div>

      {/* Objetivos mensais */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target size={15} className="text-blue-500" />
            <h2 className="font-medium text-gray-900">Objetivos mensais</h2>
          </div>
          <button onClick={() => setShowObjForm(v => !v)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
            <Plus size={13} /> Novo mês
          </button>
        </div>

        {showObjForm && (
          <div className="p-5 bg-blue-50 border-b border-blue-100 space-y-3">
            <p className="text-xs font-medium text-blue-800">Novo objetivo mensal</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Mês</label>
                <select className="input" value={objForm.month} onChange={e => setObjForm(f => ({ ...f, month: e.target.value }))}>
                  {MONTH_FULL.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Ano</label>
                <select className="input" value={objForm.year} onChange={e => setObjForm(f => ({ ...f, year: e.target.value }))}>
                  {YEARS.map(y => <option key={y}>{y}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="label">Objetivos *</label>
              <textarea
                className="input min-h-[100px] resize-y"
                placeholder="Metas para o ciclo (ex: Atingir 50 leads, lançar campanha de remarketing, gravar 4 reels...)..."
                value={objForm.content}
                onChange={e => setObjForm(f => ({ ...f, content: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <button onClick={addObjective} className="btn-primary text-xs py-1.5">Salvar</button>
              <button onClick={() => setShowObjForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
            </div>
          </div>
        )}

        {sortedObjs.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">Nenhum objetivo cadastrado ainda.</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {sortedObjs.map(obj => (
              <div key={obj.id}>
                <button
                  className="w-full px-5 py-3 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedObj(expandedObj === obj.id ? null : obj.id)}
                >
                  <span className="text-sm font-medium text-gray-800">
                    {MONTH_FULL[obj.month - 1]} {obj.year}
                  </span>
                  {expandedObj === obj.id
                    ? <ChevronUp size={14} className="text-gray-400" />
                    : <ChevronDown size={14} className="text-gray-400" />}
                </button>
                {expandedObj === obj.id && (
                  <div className="px-5 pb-4 bg-gray-50">
                    <textarea
                      className="input min-h-[100px] resize-y text-sm"
                      value={obj.content}
                      onChange={e => setObjectives(prev => prev.map(o => o.id === obj.id ? { ...o, content: e.target.value } : o))}
                    />
                    <button onClick={() => saveObjective(obj)} className="btn-primary flex items-center gap-2 mt-2 text-xs py-1.5">
                      <Save size={13} /> {savingObj === obj.id ? 'Salvando...' : 'Salvar e recolher'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
