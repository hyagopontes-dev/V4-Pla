'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Client } from '@/types'
import { Save } from 'lucide-react'

interface Props { client: Client }

export default function ScopeManager({ client }: Props) {
  const [scope, setScope] = useState(client.scope_description ?? '')
  const [objectives, setObjectives] = useState(client.monthly_objectives ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  async function save() {
    setSaving(true)
    await supabase.from('clients').update({
      scope_description: scope,
      monthly_objectives: objectives,
    }).eq('id', client.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-medium text-gray-900">Escopo & Objetivos</h2>
      </div>
      <div className="p-5 space-y-4">
        <div>
          <label className="label">Escopo contratado</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Descreva o que está ativo no contrato (ex: Gestão de Instagram, Tráfego Meta Ads, Google Search...)..."
            value={scope}
            onChange={e => setScope(e.target.value)}
          />
        </div>
        <div>
          <label className="label">Objetivos mensais</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Metas para o próximo ciclo (ex: Atingir 50 leads, lançar campanha de remarketing...)..."
            value={objectives}
            onChange={e => setObjectives(e.target.value)}
          />
        </div>
        <button onClick={save} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-60">
          <Save size={14} /> {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </div>
  )
}
