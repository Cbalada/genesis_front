'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { api, type User } from '@/lib/api'

export type AuthSession = { token: string; user: User }

export default function AuthModal({
  onClose,
  onLogin,
}: {
  onClose: () => void
  onLogin: (session: AuthSession) => void
}) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('guest@genesis.com')
  const [password, setPassword] = useState('Password123!')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    setError('')
    try {
      const result = mode === 'login'
        ? await api.login({ email, password })
        : await api.register({ name, email, password })
      onLogin({ token: result.accessToken, user: result.user })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No pudimos iniciar sesión.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
      <div role="dialog" aria-modal="true" aria-labelledby="auth-title" className="w-full max-w-md rounded-3xl bg-card p-7">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Bienvenido a genesis.</p>
            <h2 id="auth-title" className="mt-1 text-2xl font-semibold">
              {mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}
            </h2>
          </div>
          <button type="button" aria-label="Cerrar" onClick={onClose}><X /></button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {mode === 'register' && (
            <label className="text-sm font-medium">Nombre
              <input value={name} onChange={event => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
            </label>
          )}
          <label className="text-sm font-medium">Email
            <input value={email} onChange={event => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" type="email" />
          </label>
          <label className="text-sm font-medium">Contraseña
            <input value={password} onChange={event => setPassword(event.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" type="password" />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button type="button" disabled={busy} onClick={submit} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? 'Conectando...' : 'Continuar'}
          </button>
          <button type="button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
        </div>
      </div>
    </div>
  )
}
