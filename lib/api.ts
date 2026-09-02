export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export type UserRole = 'GUEST' | 'HOST' | 'ADMIN'
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'ROOM' | 'HOTEL' | 'OTHER'
export type PropertyStatus = 'ACTIVE' | 'INACTIVE'
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELED' | 'COMPLETED'

export type User = { id: string; name: string; email: string; role: UserRole; avatarUrl?: string | null; createdAt?: string; updatedAt?: string }
export type PropertyImage = { id?: string; propertyId?: string; imageUrl: string; isCover?: boolean; createdAt?: string }
export type Property = { id: string; hostId?: string; title: string; description?: string; propertyType: PropertyType | string; city: string; country: string; address?: string; latitude?: string | number; longitude?: string | number; pricePerNight: string | number; maxGuests: number; bedrooms: number; bathrooms: number; images?: PropertyImage[]; status?: PropertyStatus | string }
export type Booking = { id: string; propertyId: string; guestId?: string; checkIn: string; checkOut: string; guests: number; totalPrice: string | number; status: BookingStatus | string; property?: Partial<Property> }
export type Favorite = { id: string; userId: string; propertyId: string; createdAt: string; property?: Partial<Property> }
export type Review = { id: string; propertyId: string; userId: string; bookingId: string; rating: number; comment: string; createdAt?: string; updatedAt?: string; user?: Pick<User, 'id' | 'name' | 'avatarUrl'> }
export type AdminStats = { totalUsers: number; totalProperties: number; totalBookings: number; totalReviews: number; activeBookings: number; completedBookings: number; canceledBookings: number }
export type PageResponse<T> = { data: T[]; meta: { total: number; page: number; limit: number; lastPage: number } }
export type ApiErrorBody = { statusCode?: number; message?: string | string[]; error?: string }

export class ApiError extends Error {
  status: number
  details?: ApiErrorBody

  constructor(status: number, details?: ApiErrorBody) {
    super(toUserMessage(status, details))
    this.name = 'ApiError'
    this.status = status
    this.details = details
  }
}

export function toUserMessage(status: number, body?: ApiErrorBody) {
  const message = Array.isArray(body?.message) ? body.message.join(', ') : body?.message
  if (message && !/axios|fetch|typeerror/i.test(message)) return message
  if (status === 400) return 'Revisá los datos ingresados.'
  if (status === 401) return 'Necesitás iniciar sesión para continuar.'
  if (status === 403) return 'No tenés permisos para realizar esta acción.'
  if (status === 404) return 'No encontramos el recurso solicitado.'
  if (status === 409) return 'La operación entra en conflicto con datos existentes.'
  if (status === 422) return 'La operación no puede realizarse por una regla de negocio.'
  return 'No pudimos completar la operación. Intentá nuevamente.'
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers })
  const body = await response.json().catch(() => undefined)
  if (!response.ok) throw new ApiError(response.status, body)
  return body as T
}

const qs = (params?: URLSearchParams | Record<string, string | number | undefined>) => {
  if (!params) return ''
  const search = params instanceof URLSearchParams ? params : new URLSearchParams()
  if (!(params instanceof URLSearchParams)) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value))
    })
  }
  const query = search.toString()
  return query ? `?${query}` : ''
}

export const api = {
  listProperties: (params?: URLSearchParams | Record<string, string | number | undefined>) => request<PageResponse<Property>>(`/properties${qs(params)}`),
  getProperty: (id: string) => request<Property>(`/properties/${id}`),
  login: (data: { email: string; password: string }) => request<{ accessToken: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  register: (data: { name: string; email: string; password: string }) => request<{ accessToken: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  me: (token: string) => request<User>('/auth/me', {}, token),
  profile: (token: string) => request<User>('/users/me', {}, token),
  updateProfile: (token: string, data: { name?: string; avatarUrl?: string }) => request<User>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }, token),
  favorites: (token: string, page = 1, limit = 50) => request<PageResponse<Favorite>>(`/favorites${qs({ page, limit })}`, {}, token),
  addFavorite: (token: string, propertyId: string) => request<Favorite>(`/favorites/${propertyId}`, { method: 'POST' }, token),
  removeFavorite: (token: string, propertyId: string) => request<void>(`/favorites/${propertyId}`, { method: 'DELETE' }, token),
  bookings: (token: string, page = 1, limit = 20) => request<PageResponse<Booking>>(`/users/me/bookings${qs({ page, limit })}`, {}, token),
  booking: (token: string, id: string) => request<Booking>(`/bookings/${id}`, {}, token),
  createBooking: (token: string, data: { propertyId: string; checkIn: string; checkOut: string; guests: number }) => request<Booking>('/bookings', { method: 'POST', body: JSON.stringify(data) }, token),
  cancelBooking: (token: string, id: string) => request<Booking>(`/bookings/${id}/cancel`, { method: 'PATCH' }, token),
  propertyReviews: (propertyId: string, page = 1, limit = 10) => request<PageResponse<Review>>(`/properties/${propertyId}/reviews${qs({ page, limit })}`),
  createReview: (token: string, data: { propertyId: string; bookingId: string; rating: number; comment: string }) => request<Review>('/reviews', { method: 'POST', body: JSON.stringify(data) }, token),
  updateReview: (token: string, id: string, data: { rating?: number; comment?: string }) => request<Review>(`/reviews/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteReview: (token: string, id: string) => request<void>(`/reviews/${id}`, { method: 'DELETE' }, token),
  createProperty: (token: string, data: Omit<Property, 'id' | 'images' | 'status'>) => request<Property>('/properties', { method: 'POST', body: JSON.stringify(data) }, token),
  updateProperty: (token: string, id: string, data: Partial<Property>) => request<Property>(`/properties/${id}`, { method: 'PATCH', body: JSON.stringify(data) }, token),
  deleteProperty: (token: string, id: string) => request<void>(`/properties/${id}`, { method: 'DELETE' }, token),
  adminStats: (token: string) => request<AdminStats>('/admin/stats', {}, token),
  adminUsers: (token: string) => request<PageResponse<User>>('/admin/users?page=1&limit=10', {}, token),
  adminProperties: (token: string) => request<PageResponse<Property>>('/admin/properties?page=1&limit=10', {}, token),
  adminBookings: (token: string) => request<PageResponse<Booking>>('/admin/bookings?page=1&limit=10', {}, token),
  adminReviews: (token: string) => request<PageResponse<Review>>('/admin/reviews?page=1&limit=10', {}, token),
  changeUserRole: (token: string, id: string, role: UserRole) => request<User>(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }, token),
  deleteUser: (token: string, id: string) => request<void>(`/admin/users/${id}`, { method: 'DELETE' }, token),
  adminDeleteReview: (token: string, id: string) => request<void>(`/admin/reviews/${id}`, { method: 'DELETE' }, token),
}
