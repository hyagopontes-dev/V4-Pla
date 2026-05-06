import AdminSidebar from '@/components/admin/Sidebar'
import AdminGuard from '@/components/admin/AdminGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div style={{ display: 'flex', minHeight: '100vh', background: '#0A0A0A' }}>
        <AdminSidebar />
        <main style={{ flex: 1, overflow: 'auto' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 32px' }}>
            {children}
          </div>
        </main>
      </div>
    </AdminGuard>
  )
}
