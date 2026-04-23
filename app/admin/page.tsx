import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { Users, TrendingUp, Package, Plus, Eye } from 'lucide-react'

export default async function AdminHome() {
  const supabase = await createServerSupabase()
  const { data: clients } = await supabase.from('clients').select('*').order('name')

  const totalClients = clients?.length ?? 0
  const activeClients = clients?.filter(c => c.active).length ?? 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Painel Admin</h1>
          <p className="text-gray-500 text-sm mt-0.5">Gerencie todos os seus clientes</p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Novo cliente
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-brand-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total de clientes</p>
              <p className="text-2xl font-semibold text-gray-900">{totalClients}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <TrendingUp size={20} className="text-green-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Clientes ativos</p>
              <p className="text-2xl font-semibold text-gray-900">{activeClients}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Clientes inativos</p>
              <p className="text-2xl font-semibold text-gray-900">{totalClients - activeClients}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">Clientes</h2>
        </div>
        {!clients?.length ? (
          <div className="p-12 text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Nenhum cliente cadastrado ainda.</p>
            <Link href="/admin/clients/new" className="btn-primary inline-flex mt-4 items-center gap-2">
              <Plus size={14} /> Adicionar primeiro cliente
            </Link>
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
              {clients.map(client => (
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
                      <Link
                        href={`/dashboard?client=${client.slug}`}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 hover:border-gray-400 px-3 py-1.5 rounded-lg transition-colors"
                        target="_blank"
                      >
                        <Eye size={13} /> Ver dashboard
                      </Link>
                      <Link
                        href={`/admin/clients/${client.id}`}
                        className="text-brand-500 hover:text-brand-700 text-xs font-medium"
                      >
                        Gerenciar →
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
