import AdminSidebar from '@/components/admin/Sidebar'
import AdminGuard from '@/components/admin/AdminGuard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGuard>
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-6">{children}</div>
        </main>
      </div>
    </AdminGuard>
  )
}
