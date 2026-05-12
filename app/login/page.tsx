'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [role, setRole] = useState<'husband' | 'wife'>('husband')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, password }),
    })

    if (res.ok) {
      router.push('/links')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">💌</div>
          <h1 className="text-3xl font-bold text-white">Para Ti</h1>
          <p className="text-rose-100 mt-1 text-sm">Links y cositas que quiero compartir</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-6">
          {/* Role toggle */}
          <div className="flex bg-stone-100 rounded-2xl p-1 mb-6">
            <button
              type="button"
              onClick={() => { setRole('husband'); setPassword(''); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === 'husband'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              Soy yo 👨
            </button>
            <button
              type="button"
              onClick={() => { setRole('wife'); setPassword(''); setError('') }}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                role === 'wife'
                  ? 'bg-white text-rose-600 shadow-sm'
                  : 'text-stone-500'
              }`}
            >
              Soy yo 👩
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-2xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-rose-400 text-stone-800 text-base"
                required
              />
            </div>

            {error && (
              <p className="text-rose-500 text-sm text-center bg-rose-50 rounded-xl py-2 px-3">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full py-3.5 bg-rose-500 hover:bg-rose-600 disabled:bg-rose-300 text-white font-semibold rounded-2xl transition-colors text-base"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
