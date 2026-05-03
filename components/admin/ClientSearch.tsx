'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Search, Plus, Users } from 'lucide-react'

interface Client {
  id: string
  name: string
  slug: string
  contract_pieces: number
  active: boolean
}

interface Props { clients: Client[] }

export default function ClientSearch({ clients }: Props) {
  const [query, setQuery] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.slug.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
      {/* Search bar */}
      <div className="px-5 py-3 border-b border-gray-100">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar cliente por nome..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent bg-gray-50"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
              ✕
            </button>
          )}
        </div>
        {query && (
          <p className="text-xs text-gray-400 mt-1.5">
            {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} para "{query}"
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          {query ? (
            <>
              <Search size={36} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum cliente encontrado para "{query}"</p>
              <button onClick={() => setQuery('')} className="text-red-500 text-xs mt-2 hover:underline">Limpar busca</button>
            </>
          ) : (
            <>
              <Users size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhum cliente cadastrado ainda.</p>
              <Link href="/admin/clients/new" className="btn-primary inline-flex mt-4 items-center gap-2">
                <Plus size={14} /> Adicionar primeiro cliente
              </Link>
            </>
          )}
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Cliente</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Slug</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Peças/mês</th>
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500">Status</th>
              <th className="px-5 py-3 text-xs font-medium text-gray-500 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(client => (
              <tr key={client.id} className="border-b border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-900">{client.name}</td>
                <td className="px-5 py-3 text-gray-500 font-mono text-xs">{client.slug}</td>
                <td className="px-5 py-3 text-gray-700">{client.contract_pieces}</td>
                <td className="px-5 py-3">
                  {client.active
                    ? <span className="badge-success">Ativo</span>
                    : <span className="badge-neutral">Inativo</span>}
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3 justify-end">
                    <Link href={`/dashboard?client=${client.slug}`} target="_blank"
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors">
                      <Eye size={13} /> Ver dashboard
                    </Link>
                    <Link href={`/admin/clients/${client.id}`}
                      className="text-red-600 hover:text-red-700 text-xs font-medium">
                      Gerenciar →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
