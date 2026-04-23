'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Profile } from '@/types'
import { Plus, Trash2, Mail, Eye } from 'lucide-react'

interface Props { clientId: string; clientSlug: string; users: Profile[] }

export default function UserManager({ clientId, clientSlug, users: initial }: Props) {
  const [users, setUsers] = useState<Profile[]>(initial)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ email: '', name: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const supabase = createClient()

  async function createUser() {
    if (!form.email || !form.password) return
    setLoading(true)
    setMsg('')

    // Criar usuário no Auth
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })

    if (error) {
      setMsg('Erro: ' + error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Criar/atualizar perfil vinculando ao cliente
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: data.user.id,
        email: form.email,
        name: form.name || null,
        role: 'client',
        client_id: clientId,
      })

      if (profileError) {
        setMsg('Usuário criado mas erro ao vincular: ' + profileError.message)
      } else {
        setUsers(prev => [...prev, {
          id: data.user!.id,
          email: form.email,
          name: form.name || undefined,
          role: 'client',
          client_id: clientId,
        }])
        setMsg('✅ Usuário criado! Login: ' + form.email)
        setForm({ email: '', name: '', password: '' })
        setShowForm(false)
      }
    }
    setLoading(false)
  }

  async function removeUser(id: string) {
    if (!confirm('Desvincular este usuário do cliente?')) return
    await supabase.from('profiles').update({ client_id: null }).eq('id', id)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Usuários com acesso</h2>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3">
          <Plus size={13} /> Adicionar usuário
        </button>
      </div>

      {showForm && (
        <div className="p-5 bg-gray-50 border-b border-gray-100 space-y-3">
          <p className="text-sm font-medium text-gray-700">Novo usuário cliente</p>
          <p className="text-xs text-gray-500">Este usuário só poderá visualizar o dashboard de <strong>{clientSlug}</strong>.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" placeholder="Nome completo"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div>
              <label className="label">Email *</label>
              <input className="input" type="email" placeholder="email@cliente.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Senha inicial *</label>
              <input className="input" type="password" placeholder="Mínimo 6 caracteres"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
          </div>
          {msg && (
            <p className={`text-xs px-3 py-2 rounded-lg ${msg.startsWith('Erro') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
              {msg}
            </p>
          )}
          <div className="flex gap-2">
            <button onClick={createUser} disabled={loading} className="btn-primary text-xs py-1.5 disabled:opacity-60">
              {loading ? 'Criando...' : 'Criar acesso'}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary text-xs py-1.5">Cancelar</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-8">Nenhum usuário vinculado.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Nome</th>
              <th className="text-left px-5 py-3 text-xs text-gray-500 font-medium">Email</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{u.name || '—'}</td>
                <td className="px-5 py-3 text-gray-500 flex items-center gap-2">
                  <Mail size={13} className="text-gray-400" /> {u.email}
                </td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center gap-3 justify-end">
                    <a
                      href={`/dashboard?client=${clientSlug}`}
                      target="_blank"
                      className="text-gray-400 hover:text-brand-500"
                      title="Ver dashboard"
                    >
                      <Eye size={14} />
                    </a>
                    <button onClick={() => removeUser(u.id)} className="text-red-400 hover:text-red-600">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
