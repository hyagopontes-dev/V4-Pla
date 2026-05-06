'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      setError(error?.message ?? 'Credenciais inválidas.')
      setLoading(false)
      return
    }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    window.location.href = profile?.role === 'admin' ? '/admin' : '/dashboard'
  }

  return (
    <div className="min-h-screen flex" style={{ background: '#0A0A0A', fontFamily: "'DM Sans', sans-serif" }}>

      {/* LEFT — Brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-14 relative overflow-hidden"
        style={{ background: '#111111', borderRight: '1px solid #2A2A2A' }}>

        {/* Background geometry */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute" style={{
            top: -120, right: -120, width: 480, height: 480,
            border: '1px solid rgba(245,197,24,0.08)', borderRadius: '50%'
          }} />
          <div className="absolute" style={{
            top: -40, right: -40, width: 280, height: 280,
            border: '1px solid rgba(245,197,24,0.05)', borderRadius: '50%'
          }} />
          <div className="absolute bottom-0 left-0 right-0" style={{
            height: '1px', background: 'rgba(245,197,24,0.15)'
          }} />
        </div>

        {/* Logo */}
        <div>
          <div style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '36px', letterSpacing: '0.08em', lineHeight: 1,
            color: '#FAFAFA'
          }}>
            AVH<span style={{ color: '#F5C518' }}>ANT</span>
          </div>
          <div style={{
            fontSize: '10px', letterSpacing: '0.25em',
            textTransform: 'uppercase', color: '#888', marginTop: '6px',
            fontWeight: 300
          }}>
            Gestão que liberta quem cria
          </div>
        </div>

        {/* Main content */}
        <div>
          <div style={{
            fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
            color: '#F5C518', fontWeight: 500, marginBottom: '20px'
          }}>
            Plataforma de gestão
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '52px', letterSpacing: '0.04em', lineHeight: 1,
            color: '#FAFAFA', marginBottom: '20px'
          }}>
            CENTRAL DE<br />CONTROLE<br />DA AGÊNCIA
          </h1>

          <p style={{
            fontSize: '14px', color: 'rgba(250,250,250,0.45)',
            lineHeight: 1.8, fontWeight: 300, maxWidth: '380px', marginBottom: '40px'
          }}>
            A AVHANT reúne tudo que sua empresa precisa para crescer: projetos, clientes, finanças e métricas em um só lugar.
          </p>

          {/* Stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { value: '3×', label: 'Ganho de produtividade' },
              { value: '98%', label: 'De satisfação' },
              { value: '+550', label: 'Projetos gerenciados' },
            ].map(({ value, label }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '6px', height: '6px', background: '#F5C518',
                  borderRadius: '1px', flexShrink: 0
                }} />
                <span style={{
                  fontFamily: "'Bebas Neue', sans-serif",
                  fontSize: '22px', letterSpacing: '0.06em', color: '#FAFAFA'
                }}>{value}</span>
                <span style={{ fontSize: '12px', color: '#888', fontWeight: 300 }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div style={{
          fontSize: '10px', letterSpacing: '0.15em',
          textTransform: 'uppercase', color: 'rgba(250,250,250,0.2)'
        }}>
          AVHANT © 2026
        </div>
      </div>

      {/* RIGHT — Login form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 lg:px-16">

        {/* Mobile logo */}
        <div className="lg:hidden mb-12">
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '32px', letterSpacing: '0.08em', color: '#FAFAFA' }}>
            AVH<span style={{ color: '#F5C518' }}>ANT</span>
          </div>
        </div>

        <div style={{ maxWidth: '360px', width: '100%' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#F5C518', fontWeight: 500, marginBottom: '12px'
            }}>
              Acesso à plataforma
            </div>
            <h2 style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '36px', letterSpacing: '0.05em', color: '#FAFAFA',
              lineHeight: 1, marginBottom: '8px'
            }}>
              BEM-VINDO DE VOLTA
            </h2>
            <p style={{ fontSize: '13px', color: '#888', fontWeight: 300 }}>
              Faça login para acessar sua central de gestão.
            </p>
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 500,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#888', marginBottom: '8px'
              }}>
                E-mail
              </label>
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                style={{
                  width: '100%', background: '#1A1A1A',
                  border: '1px solid #2A2A2A', borderRadius: '2px',
                  padding: '12px 14px', fontSize: '13px', color: '#FAFAFA',
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#F5C518'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
            </div>

            <div>
              <label style={{
                display: 'block', fontSize: '10px', fontWeight: 500,
                letterSpacing: '0.15em', textTransform: 'uppercase',
                color: '#888', marginBottom: '8px'
              }}>
                Senha
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%', background: '#1A1A1A',
                  border: '1px solid #2A2A2A', borderRadius: '2px',
                  padding: '12px 14px', fontSize: '13px', color: '#FAFAFA',
                  fontFamily: "'DM Sans', sans-serif", outline: 'none',
                  transition: 'border-color 0.15s'
                }}
                onFocus={e => e.target.style.borderColor = '#F5C518'}
                onBlur={e => e.target.style.borderColor = '#2A2A2A'}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 14px', background: 'rgba(255,80,80,0.08)',
                border: '1px solid rgba(255,80,80,0.2)', borderRadius: '2px',
                fontSize: '12px', color: '#FF8080'
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: loading ? 'rgba(245,197,24,0.5)' : '#F5C518',
                color: '#0A0A0A', border: 'none', borderRadius: '2px',
                padding: '13px 24px', fontSize: '11px', fontWeight: 700,
                letterSpacing: '0.12em', textTransform: 'uppercase',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background 0.15s', width: '100%',
                fontFamily: "'DM Sans', sans-serif"
              }}
            >
              {loading ? 'AUTENTICANDO...' : 'ACESSAR PLATAFORMA'}
            </button>
          </form>

          <div style={{
            marginTop: '32px', paddingTop: '32px',
            borderTop: '1px solid #2A2A2A',
            fontSize: '11px', color: 'rgba(250,250,250,0.2)',
            letterSpacing: '0.05em'
          }}>
            Acesso restrito a usuários autorizados.
          </div>
        </div>
      </div>
    </div>
  )
}
