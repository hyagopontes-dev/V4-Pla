'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Eye, Search } from 'lucide-react'

interface Client {
  id: string; name: string; slug: string; contract_pieces: number; active: boolean
}

export default function ClientsListClient({ clients }: { clients: Client[] }) {
  const [search, setSearch] = useState('')

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="card p-0 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3">
        <h2 className="font-medium text-gray-900">Clientes</h2>
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-8 py-1.5 text-sm"
            placeholder="Buscar cliente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          {search ? `Nenhum cliente encontrado para "${search}"` : 'Nenhum cliente cadastrado.'}
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
                      className="text-red-500 hover:text-red-700 text-xs font-medium">
                      Gerenciar →
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {search && filtered.length > 0 && (
        <div className="px-5 py-2 border-t border-gray-50 text-xs text-gray-400">
          {filtered.length} de {clients.length} clientes
        </div>
      )}
    </div>
  )
}
