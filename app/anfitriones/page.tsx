'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { ArrowRight, Bell, Home, PlayCircle, Plus, Shield, Settings, Headphones } from 'lucide-react'
import SearchBar from '@/components/SearchBar'

export default function AnfitrionesPage() {
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [guestCounts, setGuestCounts] = useState({ adults: 0, children: 0, infants: 0, pets: 0 })
  const [showGuests, setShowGuests] = useState(false)

  const guests = useMemo(
    () => guestCounts.adults + guestCounts.children,
    [guestCounts]
  )

  function handleSearch() {
    const params = new URLSearchParams()
    if (destination.trim()) params.set('city', destination.trim())
    if (guests > 0) params.set('guests', String(guests))
    if (checkIn) params.set('checkIn', checkIn)
    if (checkOut) params.set('checkOut', checkOut)
    window.location.href = `/alojamientos${params.toString() ? `?${params}` : ''}`
  }

  return (
    <main className="min-h-screen bg-background text-foreground">

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
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black hover:bg-white/90 transition-colors"
            >
              <Plus size={15} />
              Publicar ahora
            </Link>
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
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <ArrowRight size={15} />
            Quiero ser anfitrión
          </Link>
        </div>
      </div>

    </main>
  )
}
