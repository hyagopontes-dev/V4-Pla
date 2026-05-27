import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ClientSearch from '@/components/admin/ClientSearch'

export default async function ClientsPage() {
  const supabase = await createServerSupabase()
  const [{ data: clients }, { data: team }, { data: clientTeam }] = await Promise.all([
    supabase.from('clients').select('*').order('name'),
    supabase.from('team_members').select('*').eq('active', true).order('name'),
    supabase.from('client_team').select('*, team_members(id, name, avatar_color, role)'),
  ])

  const total = clients?.length ?? 0
  const active = clients?.filter(c => c.active).length ?? 0

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div className="section-label" style={{ marginBottom: '6px' }}>Gestão</div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '34px', letterSpacing: '0.04em', color: 'var(--text)', lineHeight: 1 }}>CLIENTES</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px', fontWeight: 300 }}>
            {active} ativos · {total - active} inativos · {total} no total
          </p>
        </div>
        <Link href="/admin/clients/new" className="btn-primary">
          <Plus size={13} /> Novo Cliente
        </Link>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
          <div className="section-label">Lista de Clientes</div>
        </div>
        <ClientSearch clients={clients ?? []} team={team ?? []} clientTeam={clientTeam ?? []} />
      </div>
    </div>
  )
}
