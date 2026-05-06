import { Suspense } from 'react'
import ClientNav from '@/components/client/ClientNav'
import ClientGuard from '@/components/client/ClientGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '24px', letterSpacing: '0.1em', color: 'var(--yellow)' }}>AVHANT</div>
      </div>
    }>
      <ClientGuard>
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
          <ClientNav clientName="Dashboard" userEmail="" />
          <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '28px 24px' }}>{children}</main>
        </div>
      </ClientGuard>
    </Suspense>
  )
}
