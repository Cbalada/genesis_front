import { useMemo } from 'react'
import { CalendarDays, Search, Users } from 'lucide-react'

export type GuestCounts = {
  adults: number
  children: number
  infants: number
  pets: number
}

type SearchBarProps = {
  destination: string
  setDestination: (value: string) => void
  checkIn: string
  setCheckIn: (value: string) => void
  checkOut: string
  setCheckOut: (value: string) => void
  showDatePicker: boolean
  setShowDatePicker: (value: boolean) => void
  calendarMonth: Date
  setCalendarMonth: (value: Date) => void
  guestCounts: GuestCounts
  setGuestCounts: React.Dispatch<React.SetStateAction<GuestCounts>>
  showGuests: boolean
  setShowGuests: (value: boolean) => void
  guests: number
  busy?: string
  onSearch: () => void
}

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
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const monthLabel = (value: Date) =>
  value.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

const weekdayLabel = (value: Date) =>
  value.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')

export default function SearchBar({
  destination,
  setDestination,
  checkIn,
  setCheckIn,
  checkOut,
  setCheckOut,
  showDatePicker,
  setShowDatePicker,
  calendarMonth,
  setCalendarMonth,
  guestCounts,
  setGuestCounts,
  showGuests,
  setShowGuests,
  guests,
  busy,
  onSearch,
}: SearchBarProps) {
  const calendarDays = useMemo(() => {
    const monthStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1)
    const monthEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0)
    const offset = (monthStart.getDay() + 6) % 7
    const cells: Date[] = []
    const start = addDays(monthStart, -offset)
    for (let i = 0; i < 42; i++) {
      cells.push(addDays(start, i))
    }
    return cells
  }, [calendarMonth])

  const isDateInRange = (date: Date) => {
    if (!checkIn || !checkOut) return false
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    const current = new Date(date)
    return current >= start && current <= end
  }

  const isDateSelected = (date: Date) => {
    if (checkIn && sameDay(new Date(checkIn), date)) return true
    if (checkOut && sameDay(new Date(checkOut), date)) return true
    return false
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pb-4 lg:px-10">
      <div className="flex flex-col rounded-2xl border border-border bg-card p-2 shadow-sm md:flex-row">
        <label className="flex flex-1 flex-col gap-1 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted">
          ¿A dónde vas?
          <input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Explorá destinos"
            className="bg-transparent text-sm font-normal outline-none"
          />
        </label>

        <div className="relative flex-1 px-2">
          <button
            onClick={() => {
              setShowDatePicker(!showDatePicker)
              setShowGuests(false)
            }}
            className="w-full text-left flex flex-col gap-1 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <CalendarDays size={14} /> Fechas
            </span>
            <span className="text-sm font-normal text-muted-foreground">
              {checkIn && checkOut
                ? `${new Date(checkIn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} - ${new Date(checkOut).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} · ${
                    (() => {
                      if (!checkIn || !checkOut) return 0
                      try {
                        const a = new Date(checkIn)
                        const b = new Date(checkOut)
                        const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
                        return diff > 0 ? diff : 0
                      } catch {
                        return 0
                      }
                    })()
                  } noches`
                : checkIn
                  ? `${new Date(checkIn).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })} → Seleccionar salida`
                  : 'Agregar fechas'}
            </span>
          </button>

          {showDatePicker && (
            <div
              className="absolute left-0 top-[calc(100%+0.5rem)] z-40 w-[340px] rounded-2xl border border-border bg-card p-4 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 text-sm text-muted-foreground">
                {!checkIn ? 'Elegí fecha de entrada' : !checkOut ? 'Elegí fecha de salida' : `Rango: ${
                  (() => {
                    if (!checkIn || !checkOut) return 0
                    try {
                      const a = new Date(checkIn)
                      const b = new Date(checkOut)
                      const diff = Math.ceil((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
                      return diff > 0 ? diff : 0
                    } catch {
                      return 0
                    }
                  })()
                } noches`}
              </div>

              <div className="mb-3 flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/30 p-2 text-sm">
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
                >
                  ‹
                </button>
                <span className="font-medium">{monthLabel(calendarMonth)}</span>
                <button
                  type="button"
                  onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}
                  className="flex size-8 items-center justify-center rounded-full hover:bg-muted"
                >
                  ›
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
                {Array.from({ length: 7 }).map((_, index) => (
                  <span key={index}>{weekdayLabel(new Date(2024, 0, index + 1))}</span>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day) => {
                  const key = toDateKey(day)
                  const isCurrentMonth = day.getMonth() === calendarMonth.getMonth()
                  const isRangeDay = !!checkIn && !!checkOut && isDateInRange(day)
                  const isSelected = isDateSelected(day)
                  const isDisabled = !!checkIn && !!checkOut && !isRangeDay && !isSelected
                  const isPast =
                    new Date(day.getFullYear(), day.getMonth(), day.getDate()) <
                    new Date(new Date().toDateString())
                  const isInvalidRange = !!checkIn && !checkOut && checkIn && new Date(key) < new Date(checkIn)
                  const isClickable = !isPast

                  return (
                    <button
                      key={key}
                      type="button"
                      disabled={!isClickable || isDisabled}
                      onClick={() => {
                        if (!checkIn || (checkIn && checkOut)) {
                          setCheckIn(key)
                          setCheckOut('')
                          setCalendarMonth(new Date(day.getFullYear(), day.getMonth(), 1))
                          return
                        }
                        if (new Date(key) <= new Date(checkIn)) {
                          setCheckIn(key)
                          setCheckOut('')
                          return
                        }
                        setCheckOut(key)
                        setShowDatePicker(false)
                      }}
                      className={`flex h-9 items-center justify-center rounded-lg text-sm ${
                        !isCurrentMonth ? 'text-muted-foreground/40' : 'text-foreground'
                      } ${isSelected ? 'bg-primary text-primary-foreground' : ''} ${
                        isRangeDay ? 'bg-primary/10 text-primary' : ''
                      } ${
                        !isSelected && !isRangeDay && isCurrentMonth ? 'hover:bg-muted' : ''
                      } ${isPast ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex justify-between gap-2">
                <button
                  onClick={() => {
                    setCheckIn('')
                    setCheckOut('')
                    setShowDatePicker(false)
                  }}
                  className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowDatePicker(false)}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="relative flex flex-1 items-center gap-2">
          <div className="flex-1">
            <button
              onClick={() => {
                setShowGuests(!showGuests)
                setShowDatePicker(false)
              }}
              className="w-full text-left flex flex-col gap-1 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-muted"
            >
              <span className="flex items-center gap-2">
                <Users size={14} /> Viajeros
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                {guests > 0 ? `${guests} ${guests === 1 ? 'persona' : 'personas'}` : '0 personas'}
                {guestCounts.infants > 0 || guestCounts.pets > 0
                  ? ` · ${
                      guestCounts.infants > 0
                        ? `${guestCounts.infants} ${guestCounts.infants === 1 ? 'bebé' : 'bebés'}`
                        : ''
                    }${guestCounts.infants > 0 && guestCounts.pets > 0 ? ' · ' : ''}${
                      guestCounts.pets > 0
                        ? `${guestCounts.pets} ${guestCounts.pets === 1 ? 'mascota' : 'mascotas'}`
                        : ''
                    }`
                  : ''}
              </span>
            </button>

            {showGuests && (
              <div
                className="absolute right-0 top-16 z-40 w-72 rounded-2xl border border-border bg-card p-4 shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Adultos</div>
                      <div className="text-xs text-muted-foreground">13+ años</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, adults: Math.max(0, g.adults - 1) }))
                        }}
                        disabled={guestCounts.adults <= 0}
                        className="size-8 rounded-full border disabled:opacity-50"
                      >
                        -
                      </button>
                      <span>{guestCounts.adults}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, adults: g.adults + 1 }))
                        }}
                        className="size-8 rounded-full border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Niños</div>
                      <div className="text-xs text-muted-foreground">2–12 años</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, children: Math.max(0, g.children - 1) }))
                        }}
                        disabled={guestCounts.children <= 0}
                        className="size-8 rounded-full border disabled:opacity-50"
                      >
                        -
                      </button>
                      <span>{guestCounts.children}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, children: g.children + 1 }))
                        }}
                        className="size-8 rounded-full border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Bebés</div>
                      <div className="text-xs text-muted-foreground">Menores de 2 años</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, infants: Math.max(0, g.infants - 1) }))
                        }}
                        disabled={guestCounts.infants <= 0}
                        className="size-8 rounded-full border disabled:opacity-50"
                      >
                        -
                      </button>
                      <span>{guestCounts.infants}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, infants: g.infants + 1 }))
                        }}
                        className="size-8 rounded-full border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">Mascotas</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, pets: Math.max(0, g.pets - 1) }))
                        }}
                        disabled={guestCounts.pets <= 0}
                        className="size-8 rounded-full border disabled:opacity-50"
                      >
                        -
                      </button>
                      <span>{guestCounts.pets}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setGuestCounts((g) => ({ ...g, pets: g.pets + 1 }))
                        }}
                        className="size-8 rounded-full border"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setGuestCounts({ adults: 0, children: 0, infants: 0, pets: 0 })
                        setShowGuests(false)
                      }}
                      className="rounded-full border px-4 py-2 text-sm font-medium hover:bg-muted"
                    >
                      Limpiar
                    </button>
                    <button
                      onClick={() => setShowGuests(false)}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            disabled={busy === 'search'}
            onClick={onSearch}
            className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground disabled:opacity-60"
            aria-label="Buscar"
          >
            <Search size={19} />
          </button>
        </div>
      </div>
    </div>
  )
}
