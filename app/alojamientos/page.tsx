'use client'

import { useEffect, useMemo, useState } from 'react'
import { Globe2, Heart, Menu, Star, X } from 'lucide-react'
import SearchBar from '@/components/SearchBar'
import { api, type Property, type User } from '@/lib/api'

const fallback: Property[] = [
  { id:'1', title:'Casa de diseño frente al lago', city:'Villa La Angostura', country:'Argentina', pricePerNight:184, maxGuests:6, bedrooms:3, bathrooms:2, propertyType:'HOUSE', description:'Casa equipada para descansar frente al lago.', images:[{ imageUrl:'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'2', title:'Refugio entre viñedos', city:'Luján de Cuyo, Mendoza', country:'Argentina', pricePerNight:126, maxGuests:4, bedrooms:2, bathrooms:1, propertyType:'HOUSE', description:'Refugio tranquilo entre viñedos.', images:[{ imageUrl:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'3', title:'Loft luminoso en Palermo', city:'Buenos Aires', country:'Argentina', pricePerNight:92, maxGuests:3, bedrooms:1, bathrooms:1, propertyType:'APARTMENT', description:'Loft cómodo con excelente ubicación.', images:[{ imageUrl:'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'4', title:'Cabaña nórdica en el bosque', city:'San Martín de los Andes', country:'Argentina', pricePerNight:148, maxGuests:5, bedrooms:2, bathrooms:1, propertyType:'HOUSE', description:'Cabaña rodeada de bosque.', images:[{ imageUrl:'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'5', title:'Casa cálida junto al mar', city:'Mar del Plata', country:'Argentina', pricePerNight:108, maxGuests:5, bedrooms:2, bathrooms:2, propertyType:'HOUSE', description:'Casa familiar cerca del mar.', images:[{ imageUrl:'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?auto=format&fit=crop&w=1600&q=90', isCover:true }] },
  { id:'6', title:'Departamento con terraza', city:'Córdoba', country:'Argentina', pricePerNight:74, maxGuests:4, bedrooms:2, bathrooms:1, propertyType:'APARTMENT', description:'Departamento con terraza privada.', images:[{ imageUrl:'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'7', title:'Suite boutique en Colonia', city:'Colonia del Sacramento', country:'Uruguay', pricePerNight:132, maxGuests:2, bedrooms:1, bathrooms:1, propertyType:'ROOM', description:'Suite tranquila con estilo boutique.', images:[{ imageUrl:'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
  { id:'8', title:'Villa con piscina privada', city:'Mendoza', country:'Argentina', pricePerNight:196, maxGuests:8, bedrooms:4, bathrooms:3, propertyType:'HOUSE', description:'Villa espaciosa con piscina para descansar.', images:[{ imageUrl:'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85', isCover:true }] },
]

const storageKey = 'genesis.session'

const img = (p: Property) =>
  p.images?.find((i) => i.isCover)?.imageUrl ||
  p.images?.[0]?.imageUrl ||
  fallback[0].images![0].imageUrl

const money = (value: string | number | undefined) => Number(value || 0).toLocaleString('es-AR')

type Session = { token: string; user: User }

export default function AlojamientosPage() {
  const [properties, setProperties] = useState<Property[]>(fallback)
  const [destination, setDestination] = useState('')
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
  const [menu, setMenu] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState('')

  const guests = useMemo(
    () => (guestCounts.adults || 0) + (guestCounts.children || 0),
    [guestCounts]
  )

  const visible = useMemo(() => {
    const cleanDestination = destination.trim().toLowerCase()
    return properties.filter((p) => {
      const matchesDestination =
        !cleanDestination ||
        p.city.toLowerCase().includes(cleanDestination) ||
        p.country.toLowerCase().includes(cleanDestination)

      const matchesGuests = guests === 0 || p.maxGuests >= guests
      return matchesDestination && matchesGuests
    })
  }, [destination, guests, properties])

  useEffect(() => {
    restoreSession()
    loadProperties()
  }, [])

  useEffect(() => {
    if (!token) return
    syncFavorites(token)
  }, [token])

  async function restoreSession() {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return
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
    }
  }

  async function loadProperties() {
    try {
      const result = await api.listProperties({ page: '1', limit: '50' })
      setProperties(result.data.length ? result.data : fallback)
    } catch {
      setProperties(fallback)
    }
  }

  async function syncFavorites(authToken: string) {
    try {
      const result = await api.favorites(authToken)
      setFavorites(result.data.map((f) => f.propertyId))
    } catch {
      setFavorites([])
    }
  }

  async function toggleFavorite(id: string) {
    if (!user || !token) return
    const wasFavorite = favorites.includes(id)
    setFavorites((list) => (wasFavorite ? list.filter((x) => x !== id) : [...list, id]))

    try {
      if (wasFavorite) await api.removeFavorite(token, id)
      else await api.addFavorite(token, id)
    } catch {
      setFavorites((list) => (wasFavorite ? [...list, id] : list.filter((x) => x !== id)))
    }
  }

  function setGuestsOnly(value: number) {
    setGuestCounts((current) => ({ ...current, adults: Math.max(1, value) }))
  }

  function handleSearch() {
    setBusy('search')
    setTimeout(() => setBusy(''), 200)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 lg:px-10">
          <a href="/#inicio" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground">G</span>
            <b className="text-xl tracking-tight">genesis<span className="text-primary">.</span></b>
          </a>

          <nav className="hidden gap-8 text-sm font-medium text-muted-foreground md:flex">
            <a href="/#inicio" className="text-foreground">inicio</a>
            <a href="/alojamientos">Alojamientos</a>
            <a href="/#anfitriones">Para anfitriones</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenu((current) => !current)}
              className="hidden rounded-full px-4 py-2 text-sm font-semibold hover:bg-muted sm:block"
            >
              {user?.name || 'Iniciar sesión'}
            </button>
            <button className="flex size-10 items-center justify-center rounded-full border border-border">
              <Globe2 size={17} />
            </button>
            <button
              onClick={() => setMenu((current) => !current)}
              className="flex size-10 items-center justify-center rounded-full border border-border"
            >
              <Menu size={18} />
            </button>

            {menu && (
              <div className="absolute right-5 top-16 w-56 rounded-2xl border border-border bg-card p-2 shadow-xl">
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Iniciar sesión</button>
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Publicar alojamiento</button>
                <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Mis reservas</button>
                {user?.role === 'ADMIN' && (
                  <button className="w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-muted">Panel admin</button>
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
          onSearch={handleSearch}
        />
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Alojamientos</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">Descubrí todos los destinos disponibles</h1>
          </div>
          <p className="text-sm text-muted-foreground">{visible.length} resultados</p>
        </div>

        <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((property) => (
            <article key={property.id} className="group cursor-pointer">
              <div className="relative overflow-hidden rounded-2xl bg-muted">
                <img
                  src={img(property)}
                  alt={property.title}
                  className="aspect-[1.18] w-full object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1.5 text-xs font-semibold">
                  {property.propertyType === 'APARTMENT' ? 'Gran ubicación' : 'Favorito entre huéspedes'}
                </div>
                <button
                  onClick={() => toggleFavorite(property.id)}
                  className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-card/90 disabled:opacity-60"
                  aria-label="Favorito"
                >
                  <Heart
                    size={17}
                    fill={favorites.includes(property.id) ? 'currentColor' : 'none'}
                    className={favorites.includes(property.id) ? 'text-primary' : ''}
                  />
                </button>
              </div>

              <div className="pt-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-5">{property.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {property.city}, {property.country}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-sm">
                    <Star size={14} fill="currentColor" /> 4.9
                  </span>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  {property.bedrooms} habitaciones · hasta {property.maxGuests} huéspedes
                </p>
                <p className="mt-2 text-sm">
                  <strong>${money(property.pricePerNight)}</strong> noche
                </p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <b className="text-foreground">genesis.</b>
          <span>© 2026 Genesis Rentals</span>
          <button className="font-medium text-foreground hover:text-primary">Convertite en anfitrión</button>
        </div>
      </footer>
    </main>
  )
}
