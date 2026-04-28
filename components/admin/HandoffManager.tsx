'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { ClientHandoff } from '@/types'
import { Save, ChevronDown, ChevronUp, Handshake } from 'lucide-react'

interface Props { clientId: string; handoff: ClientHandoff | null }

const FIELDS = [
  { key: 'o_que_foi_vendido', label: 'O que foi vendido exatamente', placeholder: 'Descreva detalhadamente o produto/serviço vendido...' },
  { key: 'expectativa_cliente', label: 'Expectativa do cliente', placeholder: 'O que o cliente espera receber/conquistar...' },
  { key: 'promessa_feita', label: 'Promessa feita', placeholder: 'O que foi prometido ao cliente durante a venda...' },
  { key: 'prazo_acordado', label: 'Prazo acordado', placeholder: 'Prazos e datas combinados...' },
  { key: 'perfil_cliente', label: 'Perfil do cliente', placeholder: 'Perfil comportamental, expectativas, nível de exigência...' },
]

export default function HandoffManager({ clientId, handoff: initial }: Props) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<Record<string, string>>({
    o_que_foi_vendido: initial?.o_que_foi_vendido ?? '',
    expectativa_cliente: initial?.expectativa_cliente ?? '',
    promessa_feita: initial?.promessa_feita ?? '',
    prazo_acordado: initial?.prazo_acordado ?? '',
    perfil_cliente: initial?.perfil_cliente ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const filled = FIELDS.filter(f => form[f.key]?.trim()).length

  async function save() {
    setSaving(true)
    const payload = { client_id: clientId, ...form, updated_at: new Date().toISOString() }
    if (initial) {
      await supabase.from('client_handoff').update(payload).eq('client_id', clientId)
    } else {
      await supabase.from('client_handoff').insert(payload)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card p-0 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Handshake size={15} className="text-red-500" />
          <h2 className="font-medium text-gray-900 text-sm">Handoff Comercial → Operação</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full ${filled === FIELDS.length ? 'bg-green-100 text-green-700' : filled > 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
            {filled}/{FIELDS.length} preenchidos
          </span>
        </div>
        {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <p className="text-xs text-gray-500 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
            ⚠️ Informações obrigatórias do handoff comercial. Preencha antes de iniciar a operação.
          </p>
          {FIELDS.map(field => (
            <div key={field.key}>
              <label className="label">{field.label} <span className="text-red-500">*</span></label>
              <textarea
                className="input min-h-[90px] resize-y"
                placeholder={field.placeholder}
                value={form[field.key]}
                onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <button onClick={save} disabled={saving}
            className="btn-primary flex items-center gap-2 disabled:opacity-60">
            <Save size={14} />
            {saved ? '✓ Salvo!' : saving ? 'Salvando...' : 'Salvar handoff'}
          </button>
        </div>
      )}
    </div>
  )
}
