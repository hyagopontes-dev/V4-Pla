'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Client } from '@/types'
import { useRouter } from 'next/navigation'

interface Props { client: Client }

export default function ClientEditForm({ client }: Props) {
  const [form, setForm] = useState({
    name: client.name,
    slug: client.slug,
    contract_pieces: String(client.contract_pieces),
    active: client.active,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSave() {
    setSaving(true)
    await supabase.from('clients').update({
      name: form.name,
      slug: form.slug,
      contract_pieces: parseInt(form.contract_pieces),
      active: form.active,
    }).eq('id', client.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-medium text-gray-900">Dados do cliente</h2>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Nome</label>
            <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input font-mono" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
          </div>
          <div>
            <label className="label">Peças contratadas/mês</label>
            <input className="input" type="number" min="1" value={form.contract_pieces} onChange={e => setForm(f => ({ ...f, contract_pieces: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={String(form.active)} onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary mt-4 disabled:opacity-60">
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
