import ClientNav from '@/components/client/ClientNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ClientNav clientName="Dashboard" userEmail="" />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
