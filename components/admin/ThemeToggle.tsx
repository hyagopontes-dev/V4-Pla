'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('avhant-theme') as 'dark' | 'light' | null
    const initial = saved ?? 'dark'
    setTheme(initial)
    document.documentElement.setAttribute('data-theme', initial)
  }, [])

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
    localStorage.setItem('avhant-theme', next)
  }

  return (
    <button onClick={toggle} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '32px', height: '32px',
        background: 'var(--bg-input)', border: '1px solid var(--border)',
        borderRadius: '2px', cursor: 'pointer', color: 'var(--text-secondary)',
        transition: 'all 0.15s', flexShrink: 0
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--yellow)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  )
}
