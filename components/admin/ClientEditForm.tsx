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
    logo_url: client.logo_url ?? '',
    about: client.about ?? '',
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
      logo_url: form.logo_url || null,
      about: form.about || null,
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
      <div className="p-5 space-y-4">
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
        <div>
          <label className="label">URL da logo (link de imagem)</label>
          <input className="input" placeholder="https://..." value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} />
          <p className="text-xs text-gray-400 mt-1">Cole o link direto de uma imagem (PNG, JPG). Ex: link do Google Drive, Imgur, etc.</p>
        </div>
        {form.logo_url && (
          <div className="flex items-center gap-3">
            <img src={form.logo_url} alt="Preview" className="h-12 object-contain rounded border border-gray-200 bg-gray-50 p-1" onError={e => (e.currentTarget.style.display = 'none')} />
            <span className="text-xs text-gray-400">Preview da logo</span>
          </div>
        )}
        <div>
          <label className="label">Sobre o cliente</label>
          <textarea className="input min-h-[80px] resize-y" placeholder="Breve descrição da empresa, segmento, diferenciais..." value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} />
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
