'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { ArrowRight, Bell, Globe2, Home, Menu, PlayCircle, Plus, X } from 'lucide-react'
import type { User } from '@/lib/api'
import AuthModal, { type AuthSession } from '@/components/AuthModal'

type SessionUser = Pick<User, 'id' | 'name' | 'email' | 'role'>

type SessionState = { token?: string; user?: SessionUser }

export default function AnfitrionesPage() {
  const pathname = usePathname()
  const [menu, setMenu] = useState(false)
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null)
  const [showHostModal, setShowHostModal] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    const readSession = () => {
      try {
        const rawSession = window.localStorage.getItem('genesis.session')
        if (!rawSession) {
          setSessionUser(null)
          return
        }

        const session = JSON.parse(rawSession) as SessionState
        setSessionUser(session?.user ?? null)
      } catch {
        setSessionUser(null)
      }
    }

    readSession()
    window.addEventListener('storage', readSession)

    return () => window.removeEventListener('storage', readSession)
  }, [])

  const handlePublishClick = () => {
    if (typeof window === 'undefined') return

    const rawSession = window.localStorage.getItem('genesis.session')
    if (!rawSession) {
      window.location.href = '/?openAuth=1'
      return
    }

    try {
      const session = JSON.parse(rawSession) as { user?: { id?: string } }
      if (!session?.user?.id) {
        window.location.href = '/?openAuth=1'
        return
      }
    } catch {
      window.location.href = '/?openAuth=1'
      return
    }

    setShowHostModal(true)
  }

  function saveSession(session: AuthSession) {
    window.localStorage.setItem('genesis.session', JSON.stringify(session))
    setSessionUser(session.user)
    setAuthOpen(false)
  }

  function logout() {
    window.localStorage.removeItem('genesis.session')
    setSessionUser(null)
    setMenu(false)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <Link href="/" className="flex items-center gap-2" onClick={() => setMenu(false)}>
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">G</span>
            <b className="text-xl tracking-tight">genesis<span className="text-primary">.</span></b>
          </Link>
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
             <Link href="/" className={pathname === '/' ? 'text-foreground' : 'hover:text-foreground'} aria-current={pathname === '/' ? 'page' : undefined}>Inicio</Link>
             <Link href="/alojamientos" className={pathname === '/alojamientos' ? 'text-foreground' : 'hover:text-foreground'} aria-current={pathname === '/alojamientos' ? 'page' : undefined}>Alojamientos</Link>
             <Link href="/anfitriones" className={pathname === '/anfitriones' ? 'text-foreground' : 'hover:text-foreground'} aria-current={pathname === '/anfitriones' ? 'page' : undefined}>Para anfitriones</Link>
          </nav>
          <div className="relative flex items-center gap-2">
            <button type="button" onClick={() => sessionUser ? setMenu(value => !value) : setAuthOpen(true)} className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted sm:block">
              {sessionUser?.name || 'Iniciar sesión'}
            </button>
            <button type="button" aria-label="Cambiar idioma" className="flex size-10 items-center justify-center rounded-full border border-border">
              <Globe2 size={17} />
            </button>
            <button type="button" aria-label="Abrir menú" aria-expanded={menu} onClick={() => setMenu(value => !value)} className="flex size-10 items-center justify-center rounded-full border border-border">
              <Menu size={18} />
            </button>
            {menu && (
              <div className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
                <button type="button" onClick={() => sessionUser ? logout() : setAuthOpen(true)} className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">{sessionUser ? 'Cerrar sesión' : 'Iniciar sesión'}</button>
                <Link href="/anfitriones#como-funciona" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-muted">Cómo funciona</Link>
                <Link href="/alojamientos" onClick={() => setMenu(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-muted">Buscar alojamientos</Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={saveSession} />}

      {/* ── Hero con imagen de fondo ── */}
      <section className="relative flex min-h-[520px] flex-col items-center justify-center overflow-hidden px-5 py-20 text-center">
        {/* Imagen de fondo */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1400&q=80')" }}
        />
        {/* Overlay oscuro */}
        <div className="absolute inset-0 bg-black/55" />

        {/* Contenido */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
            <Home size={13} />
            Para anfitriones
          </div>

          <h1 className="max-w-[520px] text-balance text-4xl font-semibold leading-[1.2] tracking-tight text-white sm:text-5xl">
            Tu espacio puede ser la próxima escapada de alguien
          </h1>

          <p className="mt-4 max-w-md text-sm leading-7 text-white/80">
            Publicá tu propiedad en Genesis, conectá con viajeros de todo el país y generá ingresos haciendo lo que ya sabés: recibir gente.
          </p>

          {/* CTAs */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handlePublishClick}
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
            >
              <Plus size={15} />
              Publicar ahora
            </button>
            <a
              href="#como-funciona"
              className="flex items-center gap-2 rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              <PlayCircle size={15} />
              Ver cómo funciona
            </a>
          </div>

          {/* Stats */}
          <div className="mt-8 flex overflow-hidden rounded-xl border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className="border-r border-white/20 px-6 py-3 text-center">
              <strong className="block text-lg font-medium text-white">+12k</strong>
              <span className="text-[11px] text-white/70">alojamientos</span>
            </div>
            <div className="border-r border-white/20 px-6 py-3 text-center">
              <strong className="block text-lg font-medium text-white">4.9</strong>
              <span className="text-[11px] text-white/70">valoración media</span>
            </div>
            <div className="px-6 py-3 text-center">
              <strong className="block text-lg font-medium text-white">+8k</strong>
              <span className="text-[11px] text-white/70">anfitriones activos</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section id="como-funciona" className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10">
        <p className="mb-8 text-xs font-medium uppercase tracking-[.12em] text-muted-foreground">
          Cómo funciona
        </p>
        <div className="grid gap-5 sm:grid-cols-3">

          <div className="relative rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              1
            </div>
            <h3 className="mb-2 font-medium">Publicás tu espacio</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Completás el formulario con título, fotos, precio y disponibilidad en minutos.
            </p>
            {/* Conector entre pasos */}
            <div className="absolute right-0 top-10 hidden h-px w-5 translate-x-full bg-border sm:block" />
          </div>

          <div className="relative rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              2
            </div>
            <h3 className="mb-2 font-medium">Recibís reservas</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Los viajeros encuentran tu propiedad, eligen fechas y reservan directamente.
            </p>
            <div className="absolute right-0 top-10 hidden h-px w-5 translate-x-full bg-border sm:block" />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="mb-4 flex size-8 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
              3
            </div>
            <h3 className="mb-2 font-medium">Cobrás seguro</h3>
            <p className="text-sm leading-6 text-muted-foreground">
              Recibís el pago antes del check-in. Sin intermediarios, sin sorpresas.
            </p>
          </div>

        </div>
      </section>

      {/* ── Notificación CTA ── */}
      <div className="mx-auto max-w-[1440px] px-5 pb-16 lg:px-10">
        <div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-center">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <Bell size={18} className="text-primary" />
            </div>
            <div>
              <p className="font-medium">¿Listo para empezar?</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Publicá tu primera propiedad hoy y empezá a recibir reservas.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handlePublishClick}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={15} />
            Quiero ser anfitrión
          </button>
        </div>
      </div>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <Link href="/" className="font-bold text-foreground">genesis.</Link>
          <span>© 2026 Genesis Rentals</span>
          <Link href="/anfitriones" className="font-medium text-foreground hover:text-primary">Convertite en anfitrión</Link>
        </div>
      </footer>

      {showHostModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-card flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-primary">Para anfitriones</p>
                <h2 className="mt-1 text-2xl font-semibold">Publicá tu espacio</h2>
              </div>
              <button type="button" onClick={() => setShowHostModal(false)} className="flex size-10 items-center justify-center rounded-full hover:bg-muted">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
              <div className="flex flex-col gap-5">
                <label className="block text-sm font-medium">
                  Título
                  <input placeholder="Ej: Departamento moderno en el centro" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                </label>

                <label className="block text-sm font-medium">
                  Descripción
                  <textarea placeholder="Describe tu alojamiento..." rows={4} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                </label>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Ciudad
                    <input placeholder="Ej: Buenos Aires" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  <label className="block text-sm font-medium">
                    País
                    <input placeholder="Ej: Argentina" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <label className="block text-sm font-medium">
                    Precio por noche
                    <input type="number" placeholder="Ej: 50000" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  <label className="block text-sm font-medium">
                    Máximo de huéspedes
                    <input type="number" placeholder="Ej: 4" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                </div>

                <button type="button" onClick={() => setShowHostModal(false)} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
