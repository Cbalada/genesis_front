'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Globe2, Heart, Menu, Pencil, SlidersHorizontal, Star, X } from 'lucide-react'
import { api, type AdminStats, type Booking, type Property, type PropertyType, type Review, type User, type UserRole } from '@/lib/api'
import PropertyImageUploader from '@/components/PropertyImageUploader'
import SearchBar from '@/components/SearchBar'

const fallback: Property[] = []

const categories = [['Todo',''],['Casas','HOUSE'],['Cabañas','HOUSE'],['Departamentos','APARTMENT'],['Habitaciones','ROOM'],['Hoteles','HOTEL']]
const storageKey = 'genesis.session'
const img = (p: Property) => p.images?.find(i => i.isCover)?.imageUrl || p.images?.[0]?.imageUrl || ''
const money = (value: string | number | undefined) => Number(value || 0).toLocaleString('es-AR')
const message = (error: unknown) => error instanceof Error ? error.message : 'No pudimos completar la operación.'
const addDays = (date: Date, amount: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}
const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
const monthLabel = (value: Date) => value.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
const weekdayLabel = (value: Date) => value.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')

type Session = { token: string; user: User }

// Fuera del componente: función pura sin hooks
function upsertProperty(list: Property[], next: Property): Property[] {
  const index = list.findIndex((item) => item.id === next.id)
  if (index === -1) return [next, ...list]
  const updated = [...list]
  updated[index] = {
    ...updated[index],
    ...next,
    images: next.images ?? updated[index].images,
  }
  return updated
}

export default function Page() {
  const [properties, setProperties] = useState<Property[]>([])
  const [destination, setDestination] = useState('')
  const [category, setCategory] = useState('')
  const [guestCounts, setGuestCounts] = useState({ adults: 0, children: 0, infants: 0, pets: 0 })
  const [showGuests, setShowGuests] = useState(false)
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date()
    return new Date(today.getFullYear(), today.getMonth(), 1)
  })
  const [favorites, setFavorites] = useState<string[]>([])
  const [selected, setSelected] = useState<Property | null>(null)
  const [auth, setAuth] = useState(false)
  const [host, setHost] = useState(false)
  const [menu, setMenu] = useState(false)
  const [editingProperty, setEditingProperty] = useState<Property | null>(null)
  const [bookingsOpen, setBookingsOpen] = useState(false)
  const [adminOpen, setAdminOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')

  const visible = useMemo(
    () => properties.filter(p => !category || p.propertyType === category),
    [properties, category]
  )
  const guests = useMemo(
    () => (guestCounts.adults || 0) + (guestCounts.children || 0),
    [guestCounts]
  )
  const nights = useMemo(() => {
    if (!checkIn || !checkOut) return 0
    try {
      const a = new Date(checkIn)
      const b = new Date(checkOut)
      const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
      return diff > 0 ? diff : 0
    } catch { return 0 }
  }, [checkIn, checkOut])
  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const offset = (monthStart.getDay() + 6) % 7
    const cells: Date[] = []
    const start = addDays(monthStart, -offset)
    for (let i = 0; i < 42; i++) cells.push(addDays(start, i))
    return cells
  }, [calendarMonth])

  const isDateInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    return date >= start && date <= end
  }
  const isDateSelected = (date: Date) => {
    if (checkIn && sameDay(new Date(checkIn), date)) return true
    if (checkOut && sameDay(new Date(checkOut), date)) return true
    return false
  }

  const canEdit = (p: Property) =>
    user?.role === 'ADMIN' || (user?.role === 'HOST' && p.hostId === user?.id)

  function openEdit(e: React.MouseEvent, property: Property) {
    e.stopPropagation()
    if (!user) { setAuth(true); return }
    setEditingProperty(property)
    setHost(true)
  }

  useEffect(() => { restoreSession(); search(true) }, [])
  useEffect(() => { if (token) syncFavorites(token) }, [token])

  async function restoreSession() {
    const raw = localStorage.getItem(storageKey)
    if (!raw) { setLoading(false); return }
    try {
      const saved = JSON.parse(raw) as Session
      const current = await api.me(saved.token)
      setToken(saved.token)
      setUser(current)
      localStorage.setItem(storageKey, JSON.stringify({ token: saved.token, user: current }))
    } catch {
      localStorage.removeItem(storageKey)
      setToken('')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  async function search(silent = false, nextCategory = category) {
    const q = new URLSearchParams({ page: '1', limit: '20' })
    if (guests > 0) q.set('guests', String(guests))
    if (destination.trim()) q.set('city', destination.trim())
    if (nextCategory) q.set('propertyType', nextCategory)
    setBusy('search')
    if (!silent) setNotice('')
    try {
      const r = await api.listProperties(q)
      setProperties(r.data)
      if (!r.data.length) setNotice('No encontramos alojamientos con esos filtros.')
    } catch {
      if (!silent) setNotice('No pudimos conectar con el servidor. Intentá de nuevo en un momento.')
    } finally {
      setBusy('')
    }
  }

  function saveSession(next: Session) {
    setToken(next.token)
    setUser(next.user)
    localStorage.setItem(storageKey, JSON.stringify(next))
    syncFavorites(next.token)
  }

  function logout() {
    setToken('')
    setUser(null)
    setFavorites([])
    localStorage.removeItem(storageKey)
    setMenu(false)
    setNotice('Sesión cerrada correctamente.')
  }

  async function syncFavorites(authToken = token) {
    try {
      const r = await api.favorites(authToken)
      setFavorites(r.data.map(f => f.propertyId))
    } catch {}
  }

  async function toggleFavorite(id: string) {
    if (!user || !token) { setAuth(true); return }
    const wasFavorite = favorites.includes(id)
    setFavorites(f => wasFavorite ? f.filter(x => x !== id) : [...f, id])
    try {
      if (wasFavorite) await api.removeFavorite(token, id)
      else await api.addFavorite(token, id)
    } catch (error) {
      setFavorites(f => wasFavorite ? [...f, id] : f.filter(x => x !== id))
      setNotice(message(error))
    }
  }

  async function openProperty(property: Property) {
    setSelected(property)
    try { setSelected(await api.getProperty(property.id)) } catch {}
  }

  const setGuests = (n: number) => setGuestCounts(g => ({ ...g, adults: Math.max(1, n) }))

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a href="#inicio" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">G</span>
            <b className="text-xl tracking-tight">genesis<span className="text-primary">.</span></b>
          </a>
          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="#alojamientos" className="text-foreground">inicio</a>
            <a href="/alojamientos">Alojamientos</a>
            <a href="#anfitriones">Para anfitriones</a>
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={() => user ? setMenu(!menu) : setAuth(true)} className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted sm:block">
              {loading ? 'Verificando...' : user?.name || 'Iniciar sesión'}
            </button>
            <button className="flex size-10 items-center justify-center rounded-full border border-border">
              <Globe2 size={17} />
            </button>
            <button onClick={() => setMenu(!menu)} className="flex size-10 items-center justify-center rounded-full border border-border">
              <Menu size={18} />
            </button>
            {menu && (
              <div className="absolute right-5 top-16 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
                <button onClick={() => user ? logout() : setAuth(true)} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">
                  {user ? 'Cerrar sesión' : 'Iniciar sesión'}
                </button>
                <button onClick={() => { setEditingProperty(null); setHost(true); setMenu(false) }} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">
                  Publicar alojamiento
                </button>
                <button onClick={() => { user ? setBookingsOpen(true) : setAuth(true); setMenu(false) }} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">
                  Mis reservas
                </button>
                {user?.role === 'ADMIN' && (
                  <button onClick={() => { setAdminOpen(true); setMenu(false) }} className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">
                    Panel admin
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        <SearchBar
          destination={destination}
          setDestination={setDestination}
          checkIn={checkIn}
          setCheckIn={setCheckIn}
          checkOut={checkOut}
          setCheckOut={setCheckOut}
          showDatePicker={showDatePicker}
          setShowDatePicker={setShowDatePicker}
          calendarMonth={calendarMonth}
          setCalendarMonth={setCalendarMonth}
          guestCounts={guestCounts}
          setGuestCounts={setGuestCounts}
          showGuests={showGuests}
          setShowGuests={setShowGuests}
          guests={guests}
          busy={busy}
          onSearch={() => search()}
        />
      </header>

      <section id="inicio" className="mx-auto max-w-[1440px] px-5 pb-10 pt-10 lg:px-10 lg:pt-14">
        <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div className="max-w-xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[.18em] text-primary">Tu próxima historia empieza acá</p>
            <h1 className="text-balance text-5xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl lg:text-7xl">
              Encontrá un lugar para <span className="text-primary">sentirte en casa.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Alojamientos únicos, anfitriones reales y destinos que se quedan con vos mucho después de volver.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#alojamientos" className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">
                Explorar alojamientos <ArrowRight size={16} />
              </a>
              <button onClick={() => { setEditingProperty(null); setHost(true) }} className="rounded-full border border-border px-6 py-3.5 text-sm font-semibold hover:bg-muted">
                Publicá tu espacio
              </button>
            </div>
            <div className="mt-10 flex gap-6 text-sm">
              <div><strong className="text-lg">+12k</strong><span className="ml-2 text-muted-foreground">alojamientos</span></div>
              <div className="h-8 w-px bg-border" />
              <div><strong className="text-lg">4.9</strong><span className="ml-2 text-muted-foreground">valoración media</span></div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-[2rem]">
            <img src="https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1600&q=90" alt="Casa junto a un lago" className="h-[420px] w-full object-cover sm:h-[520px]" />
            <div className="absolute bottom-5 left-5 right-5 flex items-end justify-between rounded-2xl bg-primary/90 p-4 text-primary-foreground">
              <div>
                <p className="text-xs opacity-75">Escapada destacada</p>
                <p className="mt-1 font-semibold">Patagonia, Argentina</p>
              </div>
              <span className="rounded-full bg-primary-foreground/15 px-3 py-1.5 text-xs">Desde $98 / noche</span>
            </div>
          </div>
        </div>
      </section>

      <section id="alojamientos" className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
        <div className="flex flex-col gap-5 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Para vos</p>
            <h2 className="mt-1 text-3xl font-semibold tracking-tight">Descubrí tu próxima escapada</h2>
          </div>
          <button onClick={() => search()} className="flex items-center gap-2 self-start rounded-full border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted">
            <SlidersHorizontal size={16} /> Filtros
          </button>
        </div>
        <div className="flex gap-6 overflow-x-auto py-5">
          {categories.map(([label, value]) => (
            <button
              key={label}
              onClick={() => { setCategory(value); search(true, value) }}
              className={`shrink-0 border-b-2 pb-2 text-sm font-medium ${category === value ? 'border-primary' : 'border-transparent text-muted-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {notice && <div className="mb-5 rounded-xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">{notice}</div>}
        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(p => (
            <article key={p.id} className="group cursor-pointer" onClick={() => openProperty(p)}>
              <div className="relative overflow-hidden rounded-2xl bg-muted">
                {img(p)
                  ? <img src={img(p)} alt={p.title} className="aspect-[1.18] w-full object-cover transition duration-500 group-hover:scale-105" />
                  : <div className="aspect-[1.18] w-full flex items-center justify-center bg-muted text-muted-foreground text-sm">Sin imagen</div>
                }
                <div className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold">
                  {p.propertyType === 'APARTMENT' ? 'Gran ubicación' : 'Favorito entre huéspedes'}
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleFavorite(p.id) }}
                  disabled={busy === `fav-${p.id}`}
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-card/90 disabled:opacity-60"
                  aria-label="Favorito"
                >
                  <Heart size={17} fill={favorites.includes(p.id) ? 'currentColor' : 'none'} className={favorites.includes(p.id) ? 'text-primary' : ''} />
                </button>
                {canEdit(p) && (
                  <button
                    onClick={e => openEdit(e, p)}
                    className="absolute left-3 bottom-3 flex items-center gap-1.5 rounded-full bg-card/90 px-3 py-1.5 text-xs font-semibold hover:bg-card transition-colors"
                    aria-label="Editar propiedad"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                )}
              </div>
              <div className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-5">{p.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.city}, {p.country}</p>
                  </div>
                  <span className="flex items-center gap-1 text-sm"><Star size={14} fill="currentColor" /> 4.9</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.bedrooms} habitaciones · hasta {p.maxGuests} huéspedes</p>
                <p className="mt-2 text-sm"><strong>${money(p.pricePerNight)}</strong> noche</p>
              </div>
            </article>
          ))}
        </div>
        {!visible.length && (
          <div className="rounded-2xl bg-muted p-10 text-center text-muted-foreground">
            No encontramos alojamientos con esos filtros.
          </div>
        )}
      </section>

      <section id="inspiracion" className="mx-auto max-w-[1440px] px-5 py-16 lg:px-10">
        <div className="grid gap-6 rounded-[2rem] bg-secondary p-8 md:grid-cols-[1fr_auto] md:items-center md:p-12">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">Viajá distinto</p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight sm:text-4xl">Más que un alojamiento, un recuerdo para llevarte.</h2>
            <p className="mt-4 max-w-lg leading-7 text-muted-foreground">Cada estadía tiene una historia. Encontrá la tuya con anfitriones que conocen el lugar como nadie.</p>
          </div>
          <a href="#alojamientos" className="flex items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground">
            Ver inspiración <ArrowRight size={16} />
          </a>
        </div>
      </section>

      <footer id="anfitriones" className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <b className="text-foreground">genesis.</b>
          <span>© 2026 Genesis Rentals</span>
          <button onClick={() => { setEditingProperty(null); setHost(true) }} className="font-medium text-foreground hover:text-primary">
            Convertite en anfitrión
          </button>
        </div>
      </footer>

      {selected && (
        <PropertyModal
          property={selected}
          user={user}
          token={token}
          checkIn={checkIn}
          checkOut={checkOut}
          guests={guests}
          onClose={() => setSelected(null)}
          onAuth={() => setAuth(true)}
          onNotice={setNotice}
        />
      )}
      {auth && (
        <AuthModal
          onClose={() => setAuth(false)}
          onLogin={(session) => { saveSession(session); setAuth(false) }}
        />
      )}
      {host && (
        <HostModal
          onClose={() => { setHost(false); setEditingProperty(null) }}
          user={user}
          token={token}
          onAuth={() => setAuth(true)}
          propertyToEdit={editingProperty}
          onCreated={(p) => {
            setProperties(list => upsertProperty(list, p))
            setNotice('¡Tu alojamiento fue publicado correctamente!')
          }}
          onUpdated={(p) => {
            setProperties(list => upsertProperty(list, p))
            setNotice('¡Alojamiento actualizado correctamente!')
          }}
        />
      )}
      {bookingsOpen && (
        <BookingsModal onClose={() => setBookingsOpen(false)} token={token} onAuth={() => setAuth(true)} />
      )}
      {adminOpen && (
        <AdminModal onClose={() => setAdminOpen(false)} token={token} user={user} />
      )}
    </main>
  )
}

// ─── PropertyModal ───────────────────────────────────────────────────────────

function PropertyModal({
  property, user, token, checkIn, checkOut, guests, onClose, onAuth, onNotice,
}: {
  property: Property
  user: User | null
  token: string
  checkIn: string
  checkOut: string
  guests: number
  onClose: () => void
  onAuth: () => void
  onNotice: (v: string) => void
}) {
  const [inDate, setInDate] = useState(checkIn)
  const [outDate, setOutDate] = useState(checkOut)
  const [count, setCount] = useState(guests)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<Booking | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  const imagesList = useMemo(() => {
    if (property.images && property.images.length > 0) {
      return [...property.images].sort((a, b) => (b.isCover ? 1 : 0) - (a.isCover ? 1 : 0))
    }
    return [{ imageUrl: img(property), isCover: true }]
  }, [property])

  useEffect(() => {
    api.propertyReviews(property.id)
      .then(r => setReviews(r.data))
      .catch(() => setReviews([]))
  }, [property.id])

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev + 1) % imagesList.length)
  }
  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation()
    setCurrentImageIndex(prev => (prev - 1 + imagesList.length) % imagesList.length)
  }

  async function reserve() {
    if (!user || !token) { onAuth(); return }
    if (!inDate || !outDate) { setError('Elegí fecha de entrada y salida.'); return }
    setBusy(true)
    setError('')
    try {
      const booking = await api.createBooking(token, {
        propertyId: property.id,
        checkIn: inDate,
        checkOut: outDate,
        guests: count,
      })
      setCreated(booking)
      onNotice('Reserva creada correctamente.')
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 sm:items-center sm:p-6"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="max-h-[90vh] w-full max-w-2xl overflow-auto rounded-t-3xl bg-card sm:rounded-3xl"
      >
        <div className="relative h-64 w-full bg-slate-900 sm:h-80 group">
          {imagesList[currentImageIndex]?.imageUrl
            ? <img src={imagesList[currentImageIndex].imageUrl} alt={property.title} className="h-full w-full object-cover transition-all duration-300" />
            : <div className="h-full w-full flex items-center justify-center bg-muted text-muted-foreground text-sm">Sin imagen</div>
          }
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-card/90 shadow-md hover:bg-card"
          >
            <X size={18} />
          </button>
          {imagesList.length > 1 && (
            <>
              <button type="button" onClick={prevImage} className="absolute left-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground shadow-md hover:bg-card transition-transform hover:scale-105" aria-label="Anterior">
                <ChevronLeft size={20} />
              </button>
              <button type="button" onClick={nextImage} className="absolute right-3 top-1/2 -translate-y-1/2 flex size-9 items-center justify-center rounded-full bg-card/80 text-foreground shadow-md hover:bg-card transition-transform hover:scale-105" aria-label="Siguiente">
                <ChevronRight size={20} />
              </button>
              <div className="absolute bottom-3 right-4 rounded-full bg-black/60 backdrop-blur-xs px-3 py-1 text-xs font-semibold text-white">
                {currentImageIndex + 1} / {imagesList.length}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col gap-5 p-6">
          <div>
            <p className="text-sm text-muted-foreground">{property.city}, {property.country}</p>
            <h2 className="mt-1 text-2xl font-semibold">{property.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {property.bedrooms} habitaciones · {property.bathrooms} baños · hasta {property.maxGuests} huéspedes
            </p>
          </div>
          <p className="leading-7 text-muted-foreground">
            {property.description || 'Un espacio pensado para descansar, descubrir el destino y vivir una estadía memorable con todo lo necesario.'}
          </p>
          <div className="grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
            <label className="text-sm font-medium">
              Entrada
              <input value={inDate} onChange={e => setInDate(e.target.value)} type="date" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none" />
            </label>
            <label className="text-sm font-medium">
              Salida
              <input value={outDate} onChange={e => setOutDate(e.target.value)} type="date" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none" />
            </label>
            <label className="text-sm font-medium">
              Huéspedes
              <input value={count} min={1} max={property.maxGuests} onChange={e => setCount(Number(e.target.value))} type="number" className="mt-2 w-full rounded-xl border border-input bg-background px-3 py-2 outline-none" />
            </label>
          </div>
          {error && <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-destructive">{error}</p>}
          {created && (
            <p className="rounded-xl bg-secondary px-4 py-3 text-sm">
              Reserva {created.status}. Total: ${money(created.totalPrice)}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span><b className="text-xl">${money(property.pricePerNight)}</b> / noche</span>
            <button disabled={busy} onClick={reserve} className="rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground disabled:opacity-60">
              {busy ? 'Reservando...' : 'Reservar'}
            </button>
          </div>
          <div className="border-t border-border pt-5">
            <h3 className="font-semibold">Reviews</h3>
            {reviews.length ? (
              <div className="mt-3 space-y-3">
                {reviews.map(r => (
                  <div key={r.id} className="rounded-xl bg-secondary p-4 text-sm">
                    <div className="flex justify-between">
                      <b>{r.user?.name || 'Huésped'}</b>
                      <span>{r.rating}/5</span>
                    </div>
                    <p className="mt-1 text-muted-foreground">{r.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Todavía no hay reviews para este alojamiento.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── AuthModal ───────────────────────────────────────────────────────────────

function AuthModal({ onClose, onLogin }: { onClose: () => void; onLogin: (s: Session) => void }) {
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
      const r = mode === 'login'
        ? await api.login({ email, password })
        : await api.register({ name, email, password })
      onLogin({ token: r.accessToken, user: r.user })
    } catch (error) {
      setError(message(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
      <div className="w-full max-w-md rounded-3xl bg-card p-7">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Bienvenido a genesis.</p>
            <h2 className="mt-1 text-2xl font-semibold">{mode === 'login' ? 'Iniciá sesión' : 'Creá tu cuenta'}</h2>
          </div>
          <button onClick={onClose}><X /></button>
        </div>
        <div className="mt-6 flex flex-col gap-4">
          {mode === 'register' && (
            <label className="text-sm font-medium">Nombre<input value={name} onChange={e => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" /></label>
          )}
          <label className="text-sm font-medium">Email<input value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" type="email" /></label>
          <label className="text-sm font-medium">Contraseña<input value={password} onChange={e => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" type="password" /></label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={busy} onClick={submit} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">
            {busy ? 'Conectando...' : 'Continuar'}
          </button>
          <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="text-center text-sm text-muted-foreground hover:text-foreground">
            {mode === 'login' ? 'Crear cuenta' : 'Ya tengo cuenta'}
          </button>
          <p className="text-center text-xs text-muted-foreground">Demo API: guest@genesis.com · Password123!</p>
        </div>
      </div>
    </div>
  )
}

// ─── HostModal ────────────────────────────────────────────────────────────────

const propertyTypeOptions: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Departamento' },
  { value: 'HOUSE', label: 'Casa' },
  { value: 'ROOM', label: 'Habitación' },
  { value: 'HOTEL', label: 'Hotel' },
  { value: 'OTHER', label: 'Otro' },
]

const emptyPropertyForm = {
  title: '',
  description: '',
  propertyType: '' as PropertyType | '',
  city: '',
  country: '',
  address: '',
  pricePerNight: '',
  maxGuests: '',
  bathrooms: '',
  bedrooms: '',
}

type PropertyFormState = typeof emptyPropertyForm

function isPositiveIntegerString(value: string) {
  const trimmed = value.trim()
  return trimmed !== '' && /^\d+$/.test(trimmed) && Number(trimmed) > 0
}

function validatePropertyForm(form: PropertyFormState) {
  const errors: Partial<Record<keyof PropertyFormState, string>> = {}
  const requiredText = ['title', 'description', 'city', 'country', 'address'] as const

  requiredText.forEach(field => {
    if (!form[field].trim()) errors[field] = 'Este campo es obligatorio.'
  })

  if (!form.propertyType || !propertyTypeOptions.some(o => o.value === form.propertyType)) {
    errors.propertyType = 'Seleccioná un tipo de propiedad válido.'
  }

  const numericFields = [
    { key: 'pricePerNight' },
    { key: 'maxGuests' },
    { key: 'bathrooms' },
    { key: 'bedrooms' },
  ] as const

  numericFields.forEach(({ key }) => {
    const raw = form[key].trim()
    if (!raw) { errors[key] = 'Este campo es obligatorio.'; return }
    const value = Number(raw)
    if (!Number.isFinite(value) || value <= 0) { errors[key] = 'Debe ser un número positivo.'; return }
    if (key === 'maxGuests' || key === 'bedrooms' || key === 'bathrooms') {
      if (!Number.isInteger(value)) { errors[key] = 'Solo se aceptan enteros. Ingresá nuevamente.'; return }
    }
    if (key === 'bathrooms' || key === 'bedrooms') {
      if (!isPositiveIntegerString(raw)) errors[key] = 'Solo se aceptan enteros positivos. Ingresá nuevamente.'
    }
  })

  return errors
}

function HostModal({
  onClose, user, token, onAuth, onCreated, onUpdated, propertyToEdit,
}: {
  onClose: () => void
  user: User | null
  token: string
  onAuth: () => void
  onCreated: (p: Property) => void
  onUpdated?: (p: Property) => void
  propertyToEdit?: Property | null
}) {
  const isEditing = !!propertyToEdit

  const [createdProperty, setCreatedProperty] = useState<Property | null>(null)
 const [form, setForm] = useState<PropertyFormState>(
  isEditing && propertyToEdit
    ? {
        title: propertyToEdit.title,
        description: propertyToEdit.description ?? '',
        propertyType: (propertyToEdit.propertyType as PropertyType) ?? '',
        city: propertyToEdit.city,
        country: propertyToEdit.country,
        address: propertyToEdit.address ?? '',
        pricePerNight: String(propertyToEdit.pricePerNight),
        maxGuests: String(propertyToEdit.maxGuests),
        bathrooms: String(propertyToEdit.bathrooms),
        bedrooms: String(propertyToEdit.bedrooms),
      }
    : { ...emptyPropertyForm }
)
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormState, string>>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateField(field: keyof PropertyFormState, value: string) {
    setForm(current => ({ ...current, [field]: value }))
    setErrors(current => ({ ...current, [field]: undefined }))
  }

  async function submit() {
    if (!user) { onAuth(); return }
    if (user.role !== 'HOST' && user.role !== 'ADMIN') {
      setError('Necesitás una cuenta HOST para publicar un alojamiento.')
      return
    }

    const nextErrors = validatePropertyForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setError('Revisá los campos marcados antes de publicar.')
      return
    }

    setBusy(true)
    setError('')

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        propertyType: form.propertyType as PropertyType,
        city: form.city.trim(),
        country: form.country.trim(),
        address: form.address.trim(),
        latitude: 0,
        longitude: 0,
        pricePerNight: Number(form.pricePerNight),
        maxGuests: Number(form.maxGuests),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
      }

      if (isEditing && propertyToEdit) {
        const updated = await api.updateProperty(token, propertyToEdit.id, payload)
        const withImages = { ...updated, images: propertyToEdit.images }
        setCreatedProperty(withImages)
        onUpdated?.(withImages)
      } else {
        const created = await api.createProperty(token, payload)
        setCreatedProperty(created)
        onCreated(created)
      }
    } catch (submitError) {
      setError(message(submitError))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-3xl bg-card flex flex-col">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-primary">
              {isEditing ? 'Edición de propiedad' : 'Para anfitriones'}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">
              {createdProperty
                ? 'Imágenes del alojamiento'
                : isEditing
                  ? 'Editá tu alojamiento'
                  : 'Publicá tu espacio'}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="flex size-10 items-center justify-center rounded-full hover:bg-muted">
            <X size={18} />
          </button>
        </div>

        {!user ? (
          <div className="px-6 py-6">
            <p className="rounded-xl bg-secondary p-4 text-sm">
              Iniciá sesión con una cuenta HOST para publicar un alojamiento.
            </p>
          </div>
        ) : createdProperty ? (
          <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6 space-y-6">
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              <strong className="font-semibold block mb-1">
                {isEditing ? '¡Propiedad actualizada con éxito!' : '¡Propiedad creada con éxito!'}
              </strong>
              {isEditing
                ? `Se guardaron los cambios de "${createdProperty.title}". Podés gestionar las imágenes a continuación.`
                : `Se ha registrado "${createdProperty.title}". Ahora podés subir las fotos.`}
            </div>
            <PropertyImageUploader
              propertyId={createdProperty.id}
              existingImages={createdProperty.images || []}
              token={token}
              onImagesChange={(updatedImages) => {
                const updatedProp = { ...createdProperty, images: updatedImages }
                setCreatedProperty(updatedProp)
                onUpdated?.(updatedProp)
              }}
            />
            <div className="flex justify-end pt-4 border-t border-border">
              <button type="button" onClick={onClose} className="rounded-xl bg-primary px-6 py-3 font-semibold text-primary-foreground hover:opacity-90">
                {isEditing ? 'Cerrar' : 'Finalizar publicación'}
              </button>
            </div>
          </div>
        ) : (
          <div className="max-h-[calc(90vh-88px)] overflow-y-auto px-6 py-6">
            <div className="flex flex-col gap-5">
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Título
                  <input value={form.title} onChange={e => updateField('title', e.target.value)} placeholder="Ej: Departamento moderno en el centro" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                </label>
                {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Descripción
                  <textarea value={form.description} onChange={e => updateField('description', e.target.value)} placeholder="Describe tu alojamiento..." rows={4} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                </label>
                {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Tipo de propiedad
                  <select value={form.propertyType} onChange={e => updateField('propertyType', e.target.value)} className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none">
                    <option value="">Seleccioná un tipo</option>
                    {propertyTypeOptions.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </label>
                {errors.propertyType && <p className="text-sm text-destructive">{errors.propertyType}</p>}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Ciudad
                    <input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Ej: Buenos Aires" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    País
                    <input value={form.country} onChange={e => updateField('country', e.target.value)} placeholder="Ej: Argentina" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  {errors.country && <p className="text-sm text-destructive">{errors.country}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Dirección
                  <input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder="Ej: Av. Corrientes 1234" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                </label>
                {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Precio por noche
                    <input type="number" min="1" step="1" value={form.pricePerNight} onChange={e => updateField('pricePerNight', e.target.value)} placeholder="Ej: 50000" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  {errors.pricePerNight && <p className="text-sm text-destructive">{errors.pricePerNight}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Máximo de huéspedes
                    <input type="number" min="1" step="1" value={form.maxGuests} onChange={e => updateField('maxGuests', e.target.value)} placeholder="Ej: 4" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none" />
                  </label>
                  {errors.maxGuests && <p className="text-sm text-destructive">{errors.maxGuests}</p>}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Baños
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={form.bathrooms}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '' || /^\d+$/.test(v)) updateField('bathrooms', v)
                        else setErrors(cur => ({ ...cur, bathrooms: 'Solo se aceptan enteros. Ingresá nuevamente.' }))
                      }}
                      placeholder="Ej: 2"
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none"
                    />
                  </label>
                  {errors.bathrooms && <p className="text-sm text-destructive">{errors.bathrooms}</p>}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Piezas
                    <input
                      type="text" inputMode="numeric" pattern="[0-9]*"
                      value={form.bedrooms}
                      onChange={e => {
                        const v = e.target.value
                        if (v === '' || /^\d+$/.test(v)) updateField('bedrooms', v)
                        else setErrors(cur => ({ ...cur, bedrooms: 'Solo se aceptan enteros. Ingresá nuevamente.' }))
                      }}
                      placeholder="Ej: 3"
                      className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 outline-none"
                    />
                  </label>
                  {errors.bedrooms && <p className="text-sm text-destructive">{errors.bedrooms}</p>}
                </div>
              </div>

              {error && <p className="rounded-xl bg-secondary px-4 py-3 text-sm text-destructive">{error}</p>}

              <button type="button" disabled={busy} onClick={submit} className="rounded-xl bg-primary px-4 py-3 font-semibold text-primary-foreground disabled:opacity-60">
                {busy ? 'Guardando datos...' : isEditing ? 'Guardar cambios' : 'Siguiente: Subir fotos'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── BookingsModal ────────────────────────────────────────────────────────────

function BookingsModal({ onClose, token, onAuth }: { onClose: () => void; token: string; onAuth: () => void }) {
  const [items, setItems] = useState<Booking[]>([])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState('load')

  useEffect(() => {
    if (!token) { onAuth(); return }
    api.bookings(token)
      .then(r => setItems(r.data))
      .catch(e => setError(message(e)))
      .finally(() => setBusy(''))
  }, [token, onAuth])

  async function cancel(id: string) {
    setBusy(id)
    setError('')
    try {
      const b = await api.cancelBooking(token, id)
      setItems(list => list.map(x => x.id === id ? b : x))
    } catch (e) {
      setError(message(e))
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
      <div className="max-h-[86vh] w-full max-w-2xl overflow-auto rounded-3xl bg-card p-7">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Tus viajes</p>
            <h2 className="mt-1 text-2xl font-semibold">Mis reservas</h2>
          </div>
          <button onClick={onClose}><X /></button>
        </div>
        {error && <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-destructive">{error}</p>}
        {busy === 'load'
          ? <p className="mt-6 text-sm text-muted-foreground">Cargando reservas...</p>
          : items.length
            ? (
              <div className="mt-6 space-y-3">
                {items.map(b => (
                  <div key={b.id} className="rounded-xl border border-border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <b>{b.property?.title || `Reserva ${b.id.slice(0, 8)}`}</b>
                        <p className="mt-1 text-sm text-muted-foreground">{b.checkIn} a {b.checkOut} · {b.guests} huéspedes · ${money(b.totalPrice)}</p>
                        <p className="mt-1 text-xs font-semibold text-primary">{b.status}</p>
                      </div>
                      {b.status !== 'CANCELED' && b.status !== 'COMPLETED' && (
                        <button disabled={busy === b.id} onClick={() => cancel(b.id)} className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60">
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
            : <p className="mt-6 rounded-xl bg-secondary p-4 text-sm text-muted-foreground">Todavía no tenés reservas.</p>
        }
      </div>
    </div>
  )
}

// ─── AdminModal ───────────────────────────────────────────────────────────────

function AdminModal({ onClose, token, user }: { onClose: () => void; token: string; user: User | null }) {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [properties, setProperties] = useState<Property[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (user?.role !== 'ADMIN') { setError('No tenés permisos para acceder al panel admin.'); return }
    Promise.all([
      api.adminStats(token),
      api.adminUsers(token),
      api.adminProperties(token),
      api.adminBookings(token),
      api.adminReviews(token),
    ]).then(([s, u, p, b, r]) => {
      setStats(s)
      setUsers(u.data)
      setProperties(p.data)
      setBookings(b.data)
      setReviews(r.data)
    }).catch(e => setError(message(e)))
  }, [token, user])

  async function role(id: string, next: UserRole) {
    try {
      const u = await api.changeUserRole(token, id, next)
      setUsers(list => list.map(x => x.id === id ? u : x))
    } catch (e) {
      setError(message(e))
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/40 p-5">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-3xl bg-card p-7">
        <div className="flex justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Administración</p>
            <h2 className="mt-1 text-2xl font-semibold">Panel admin</h2>
          </div>
          <button onClick={onClose}><X /></button>
        </div>
        {error && <p className="mt-4 rounded-xl bg-secondary p-4 text-sm text-destructive">{error}</p>}
        {stats && (
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {Object.entries(stats).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-secondary p-4">
                <p className="text-xs text-muted-foreground">{k}</p>
                <b className="text-xl">{v}</b>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <AdminList title="Usuarios">
            {users.map(u => (
              <div key={u.id} className="flex items-center justify-between gap-3 border-b border-border py-2 text-sm">
                <span>{u.name}<br /><small className="text-muted-foreground">{u.email}</small></span>
                <select value={u.role} onChange={e => role(u.id, e.target.value as UserRole)} className="rounded-lg border border-input bg-background px-2 py-1">
                  <option>GUEST</option>
                  <option>HOST</option>
                  <option>ADMIN</option>
                </select>
              </div>
            ))}
          </AdminList>
          <AdminList title="Propiedades">
            {properties.map(p => (
              <p key={p.id} className="border-b border-border py-2 text-sm">
                {p.title}<br /><small className="text-muted-foreground">{p.city} · {p.status}</small>
              </p>
            ))}
          </AdminList>
          <AdminList title="Reservas">
            {bookings.map(b => (
              <p key={b.id} className="border-b border-border py-2 text-sm">
                {b.id.slice(0, 8)} · {b.status}<br />
                <small className="text-muted-foreground">{b.checkIn} a {b.checkOut}</small>
              </p>
            ))}
          </AdminList>
          <AdminList title="Reviews">
            {reviews.map(r => (
              <p key={r.id} className="border-b border-border py-2 text-sm">{r.rating}/5 · {r.comment}</p>
            ))}
          </AdminList>
        </div>
      </div>
    </div>
  )
}

function AdminList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="font-semibold">{title}</h3>
      <div className="mt-3">{children || <p className="text-sm text-muted-foreground">Sin datos.</p>}</div>
    </div>
  )
}
