import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ClientSearch from '@/components/admin/ClientSearch'

export default async function AdminHome() {
  const supabase = await createServerSupabase()
  const { data: clients } = await supabase.from('clients').select('*').order('name')

  const totalClients = clients?.length ?? 0
  const activeClients = clients?.filter(c => c.active).length ?? 0

  const stats = [
    { label: 'Total de clientes', value: String(totalClients) },
    { label: 'Clientes ativos', value: String(activeClients) },
    { label: 'Clientes inativos', value: String(totalClients - activeClients) },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '40px' }}>
        <div>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#F5C518', fontWeight: 500, marginBottom: '8px' }}>
            Painel
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '36px', letterSpacing: '0.05em', color: '#FAFAFA', lineHeight: 1 }}>
            CENTRAL DE GESTÃO
          </h1>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">
          <Plus size={14} /> Novo Cliente
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '32px' }}>
        {stats.map(({ label, value }) => (
          <div key={label} className="card">
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#888', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: '#F5C518', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Clients table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #2A2A2A', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#888', fontWeight: 500 }}>Clientes</div>
        </div>
        <ClientSearch clients={clients ?? []} />
      </div>
    </div>
  )
}
