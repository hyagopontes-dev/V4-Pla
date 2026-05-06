import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pharma SaaS — Gestão de Clientes',
  description: 'Plataforma de acompanhamento de entregas e métricas',
}

const themeScript = `
  try {
    var t = localStorage.getItem('avhant-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {}
`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />{children}</body>
    </html>
  )
}
