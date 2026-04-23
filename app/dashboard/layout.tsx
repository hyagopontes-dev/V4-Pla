import { Suspense } from 'react'
import ClientNav from '@/components/client/ClientNav'
import ClientGuard from '@/components/client/ClientGuard'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ClientGuard>
        <div className="min-h-screen bg-gray-50">
          <ClientNav clientName="Dashboard" userEmail="" />
          <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
        </div>
      </ClientGuard>
    </Suspense>
  )
}
