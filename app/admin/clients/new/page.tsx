'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditClientPage() {
  const [form, setForm] = useState({ name: '', slug: '', contract_pieces: '8' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const supabase = createClient()

  const clientId = params.id as string

  function toSlug(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }

  function handleName(v: string) {
    setForm(f => ({ ...f, name: v, slug: toSlug(v) }))
  }

  // 🔥 CARREGAR DADOS DO CLIENTE
  useEffect(() => {
    async function fetchClient() {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

      if (data) {
        setForm({
          name: data.name,
          slug: data.slug,
          contract_pieces: String(data.contract_pieces),
        })
      }
    }

    if (clientId) fetchClient()
  }, [clientId])

  // 🔥 UPDATE
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase
      .from('clients')
      .update({
        name: form.name,
        slug: form.slug,
        contract_pieces: parseInt(form.contract_pieces),
      })
      .eq('id', clientId)

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // 🔥 força atualizar dashboard
    router.push(`/dashboard/${form.slug}`)
    router.refresh()
  }

  return (
    <div className="max-w-lg">
      <Link href="/admin" className="flex items-center gap-1 text-gray-500 mb-6">
        <ArrowLeft size={14} /> Voltar
      </Link>

      <h1 className="text-xl font-semibold mb-6">Editar cliente</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="input"
            value={form.name}
            onChange={e => handleName(e.target.value)}
          />

          <input
            className="input"
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
          />

          <input
            className="input"
            type="number"
            value={form.contract_pieces}
            onChange={e => setForm(f => ({ ...f, contract_pieces: e.target.value }))}
          />

          {error && <p className="text-red-500">{error}</p>}

          <button className="btn-primary w-full">
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </div>
  )
}