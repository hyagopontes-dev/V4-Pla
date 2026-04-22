import { loginAction } from './action'

export default function LoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const hasError = searchParams?.error === 'invalid'

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-brand-500 rounded-xl mb-4">
            <span className="text-white font-bold text-xl">v4</span>
          </div>
          <h1 className="text-white text-2xl font-semibold">Bem-vindo</h1>
          <p className="text-gray-400 text-sm mt-1">Acesse sua conta para continuar</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-2xl">
          <form action={loginAction} className="space-y-4">            <div>
              <label className="label">Email</label>
              <input className="input" type="email" name="email"
                placeholder="seu@email.com" required autoComplete="email" />
            </div>
            <div>
              <label className="label">Senha</label>
              <input className="input" type="password" name="password"
                placeholder="••••••••" required autoComplete="current-password" />
            </div>
            {hasError && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-lg">
                Email ou senha incorretos.
              </p>
            )}
            <button type="submit" className="btn-primary w-full justify-center flex">
              Entrar
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
