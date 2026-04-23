'use client'
import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Client } from '@/types'
import { useRouter } from 'next/navigation'
import { Upload, X } from 'lucide-react'

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
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const ext = file.name.split('.').pop()
    const path = `logos/${client.id}.${ext}`

    const { error } = await supabase.storage
      .from('client-assets')
      .upload(path, file, { upsert: true })

    if (!error) {
      const { data: { publicUrl } } = supabase.storage
        .from('client-assets')
        .getPublicUrl(path)
      setForm(f => ({ ...f, logo_url: publicUrl }))
    }
    setUploading(false)
  }

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
            <input className="input" type="number" min="1" value={form.contract_pieces}
              onChange={e => setForm(f => ({ ...f, contract_pieces: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={String(form.active)}
              onChange={e => setForm(f => ({ ...f, active: e.target.value === 'true' }))}>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
        </div>

        {/* Logo upload */}
        <div>
          <label className="label">Logo do cliente</label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="w-16 h-16 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {form.logo_url ? (
                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-1" />
              ) : (
                <Upload size={20} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleLogoUpload}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="btn-secondary text-xs py-1.5 flex items-center gap-2 disabled:opacity-60"
              >
                <Upload size={13} />
                {uploading ? 'Enviando...' : 'Fazer upload da logo'}
              </button>
              {form.logo_url && (
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, logo_url: '' }))}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-600"
                >
                  <X size={12} /> Remover logo
                </button>
              )}
              <p className="text-xs text-gray-400">PNG, JPG ou SVG. Recomendado: fundo transparente.</p>
            </div>
          </div>
        </div>

        <div>
          <label className="label">Sobre o cliente</label>
          <textarea
            className="input min-h-[80px] resize-y"
            placeholder="Breve descrição da empresa, segmento, diferenciais..."
            value={form.about}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
          />
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-primary disabled:opacity-60">
          {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar alterações'}
        </button>
      </div>
    </div>
  )
}
