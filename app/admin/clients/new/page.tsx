'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NewClientPage() {
  const [form, setForm] = useState({ name: '', slug: '', contract_pieces: '8' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toSlug(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  function handleName(v: string) {
    setForm(f => ({ ...f, name: v, slug: toSlug(v) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.from('clients').insert({
      name: form.name,
      slug: form.slug,
      contract_pieces: parseInt(form.contract_pieces),
    })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin" className="flex items-center gap-1 text-gray-500 hover:text-gray-700 text-sm mb-6">
        <ArrowLeft size={14} /> Voltar
      </Link>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Novo cliente</h1>
      <p className="text-gray-500 text-sm mb-6">Preencha os dados para cadastrar um novo cliente.</p>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nome do cliente *</label>
            <input className="input" value={form.name} onChange={e => handleName(e.target.value)} placeholder="Ex: Pharma Solutions" required />
          </div>
          <div>
            <label className="label">Slug (URL amigável) *</label>
            <input className="input font-mono" value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="pharma-solutions" required />
            <p className="text-xs text-gray-400 mt-1">Usado na URL do cliente: /dashboard</p>
          </div>
          <div>
            <label className="label">Peças contratadas por mês *</label>
            <input className="input" type="number" min="1" max="100" value={form.contract_pieces} onChange={e => setForm(f => ({ ...f, contract_pieces: e.target.value }))} required />
          </div>
          {error && <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-60">
              {loading ? 'Salvando...' : 'Criar cliente'}
            </button>
            <Link href="/admin" className="btn-secondary flex-1 text-center">Cancelar</Link>
          </div>
        </form>
      </div>
    </div>
  )
}
