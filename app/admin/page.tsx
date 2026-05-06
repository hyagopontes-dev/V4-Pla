import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ClientSearch from '@/components/admin/ClientSearch'

export default async function AdminHome() {
  const supabase = await createServerSupabase()
  const { data: clients } = await supabase.from('clients').select('*').order('name')
  const total = clients?.length ?? 0
  const active = clients?.filter(c => c.active).length ?? 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '36px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '8px' }}>Painel</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>
            CENTRAL DE GESTÃO
          </h1>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">
          <Plus size={13} /> Novo Cliente
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total de clientes', value: String(total) },
          { label: 'Clientes ativos', value: String(active) },
          { label: 'Clientes inativos', value: String(total - active) },
        ].map(({ label, value }) => (
          <div key={label} className="card">
            <div style={{ fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '8px' }}>{label}</div>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '40px', letterSpacing: '0.04em', color: 'var(--yellow)', lineHeight: 1 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-label">Clientes</div>
        </div>
        <ClientSearch clients={clients ?? []} />
      </div>
    </div>
  )
}
