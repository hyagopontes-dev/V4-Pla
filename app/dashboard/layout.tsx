import ClientNav from '@/components/client/ClientNav'
import ClientGuard from '@/components/client/ClientGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientGuard>
      <div className="min-h-screen bg-gray-50">
        <ClientNav clientName="Dashboard" userEmail="" />
        <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
      </div>
    </ClientGuard>
  )
}
