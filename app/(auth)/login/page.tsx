'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [mode, setMode]         = useState<'login' | 'signup'>('login')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [success, setSuccess]   = useState('')
  const router   = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email ou mot de passe incorrect.')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Met à jour le nom dans profiles
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        name,
        role: 'viewer',
      })
    }

    setSuccess('Compte créé ! Vérifie ta boîte mail pour confirmer, ou connecte-toi directement.')
    setLoading(false)
    setMode('login')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--bg-base)', position: 'relative', overflow: 'hidden' }}
    >
      {/* Fond ambiant */}
      <div className="ambient-bg">
        <div className="ambient-orb-3" />
      </div>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(37,99,235,0.1) 0%, transparent 70%)' }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl logo-glow mb-4"
               style={{ background: 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <path d="M6 8C6 6.9 6.9 6 8 6h16c1.1 0 2 .9 2 2v2H6V8z" fill="white" opacity="0.9"/>
              <rect x="6" y="12" width="20" height="2" rx="1" fill="white" opacity="0.6"/>
              <rect x="6" y="16" width="14" height="2" rx="1" fill="white" opacity="0.6"/>
              <circle cx="24" cy="24" r="6" fill="white" opacity="0.15"/>
              <circle cx="24" cy="24" r="2.5" fill="white"/>
              <path d="M28.5 28.5 L31 31" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--text-1)' }}>
            Fetchy<span style={{ color: 'var(--accent-glow)' }}>Scrap</span>
          </h1>
          <p style={{ color: 'var(--text-2)' }} className="mt-2 text-sm">
            Veille virale Instagram · IA
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-mid)',
            boxShadow: '0 0 0 1px rgba(37,99,235,0.08), 0 24px 48px rgba(0,0,0,0.4)',
          }}
        >
          <div className="accent-line h-0.5 w-full rounded-full mb-8 -mt-px" />

          {/* Toggle login / signup */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'var(--bg-surface)' }}
          >
            {(['login', 'signup'] as const).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(''); setSuccess('') }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition"
                style={mode === m ? {
                  background: 'var(--bg-card)',
                  color: 'var(--text-1)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                } : {
                  color: 'var(--text-3)',
                }}
              >
                {m === 'login' ? 'Se connecter' : 'Créer un compte'}
              </button>
            ))}
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-4">
            {/* Nom (signup uniquement) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                  Nom complet
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                  placeholder="Jean Dupont"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-mid)',
                    color: 'var(--text-1)',
                  }}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none
                             focus:ring-2 focus:ring-blue-500/30 transition placeholder-[#4a5f80]"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="vous@entreprise.com"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-mid)',
                  color: 'var(--text-1)',
                }}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none
                           focus:ring-2 focus:ring-blue-500/30 transition placeholder-[#4a5f80]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-2)' }}>
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-mid)',
                  color: 'var(--text-1)',
                }}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none
                           focus:ring-2 focus:ring-blue-500/30 transition placeholder-[#4a5f80]"
              />
              {mode === 'signup' && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                  Minimum 6 caractères
                </p>
              )}
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl text-sm"
                   style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                {error}
              </div>
            )}

            {success && (
              <div className="px-4 py-3 rounded-xl text-sm"
                   style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm transition disabled:opacity-50"
              style={{ background: loading ? 'var(--border-mid)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)' }}
            >
              {loading
                ? (mode === 'login' ? 'Connexion...' : 'Création...')
                : (mode === 'login' ? 'Se connecter →' : 'Créer mon compte →')
              }
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: 'var(--text-3)' }}>
          Accès réservé à l'équipe interne
        </p>
      </div>
    </div>
  )
}
