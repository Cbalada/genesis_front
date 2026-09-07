# Genesis Rentals - Estado actual del proyecto

## 1. Descripción general

Genesis Rentals es una plataforma de alquileres tipo marketplace inspirada en Airbnb. El proyecto está compuesto por:

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind
- Backend: NestJS + TypeScript + JWT + TypeORM
- Base de datos: PostgreSQL
- Objetivo: permitir buscar propiedades, reservar, guardar favoritos, crear alojamientos y administrar la operación con roles.

La aplicación está pensada para tres perfiles principales:

- Guest / huésped: busca propiedades, filtra por destino, reserva y califica alojamientos.
- Host / propietario: publica propiedades, gestiona disponibilidad y recibe reservas.
- Admin / administrador: supervisa usuarios, propiedades, reservas y reseñas.

El proyecto ya contempla flujo real de autenticación, permisos por rol, panel de administración y conexión con la API del backend desde el frontend.

---

## 2. Estado actual del frontend

La parte del cliente en Next.js ya incluye una landing page y una experiencia de búsqueda completa con UX tipo marketplace.

### 2.1 Landing page y buscador

La app principal en `app/page.tsx` implementa:

- hero section con propuesta de valor
- barra de búsqueda por destino
- selector de fechas de check-in y check-out
- selector de huéspedes
- filtros por tipo de propiedad
- listado de propiedades con cards visuales
- CTA para explorar alojamientos y publicar un espacio
- sección de inspiración visual

### 2.2 Búsqueda y filtros

La búsqueda del frontend consume la API del backend con `GET /api/properties` y soporta:

- ciudad/destino
- tipo de propiedad (`HOUSE`, `APARTMENT`, `ROOM`, `HOTEL`, etc.)
- cantidad de huéspedes
- paginación
- fallback visual si la API no responde

El cliente usa `URLSearchParams` y un helper centralizado en `lib/api.ts` para construir las query strings.

### 2.3 Detalle de propiedad

Al hacer click en una propiedad, el frontend abre un modal con:

- título del alojamiento
- ciudad y país
- habitaciones, baños y huéspedes máximos
- descripción
- precio por noche
- botón para reservar

### 2.4 Autenticación y sesión

El frontend incluye:

- modal de login con credenciales demo
- persistencia de sesión en `localStorage`
- restauración automática del usuario logueado
- manejo del token JWT en requests autenticados
- flujo de cierre de sesión

Credenciales demo oficiales:

- Email: `guest@genesis.com`
- Password: `Password123!`

También se soportan usuarios con roles:

- `ADMIN`
- `HOST`
- `GUEST`

### 2.5 Favoritos

La interfaz permite guardar y quitar propiedades como favoritas:

- botón de corazón por propiedad
- bloqueo si el usuario no está autenticado
- sincronización con la API de favoritos del backend

Endpoints utilizados:

- `GET /api/favorites`
- `POST /api/favorites/:propertyId`
- `DELETE /api/favorites/:propertyId`

### 2.6 Publicación de alojamiento para anfitriones

La app incluye un flujo de anfitrión funcional para crear propiedades reales desde el modal existente de publicación, manteniendo el CTA y la estética visual general de la landing page.

El flujo actual incluye:

- formulario completo con título, descripción, tipo de propiedad, ciudad, país, dirección
- precio por noche, máximo de huéspedes, baños y cantidad de habitaciones
- validación de campos obligatorios y valores positivos
- validación de tipos permitidos según el enum del backend: `APARTMENT`, `HOUSE`, `ROOM`, `HOTEL`, `OTHER`
- bloqueo si el usuario no está autenticado
- validación de permisos: solo usuarios con rol `HOST` o `ADMIN` pueden publicar
- envío autenticado a la API con JWT a `POST /api/properties`
- manejo de estados de carga, éxito y error
- cierre y limpieza del modal luego de una publicación correcta
- scroll interno del modal para mantener la experiencia usable en móvil y desktop

El payload enviado al backend incluye campos como:

- title
- description
- propertyType
- city
- country
- address
- latitude
- longitude
- pricePerNight
- maxGuests
- bedrooms
- bathrooms

Este flujo ya está conectado con la API del backend y reutiliza el wrapper centralizado del cliente, sin reemplazar la lógica real de creación por una simulación visual.

### 2.7 Reserva de alojamiento

El frontend ya implementa un flujo de reserva con:

- selección de fechas
- validación de sesión activa
- cálculo de noches
- envío de la reserva a la API
- control de errores si la propiedad o las fechas no son válidas

Endpoints principales:

- `POST /api/bookings`
- `GET /api/users/me/bookings`
- `PATCH /api/bookings/:id/cancel`

### 2.8 Panel administrativo

La UI del frontend incluye acceso a un panel de administración para usuarios con rol `ADMIN`:

- estadísticas generales
- listado de usuarios
- listado de propiedades
- listado de reservas
- listado de reseñas
- cambio de rol por usuario
- eliminación de usuarios y reseñas

Esto refleja los endpoints del backend bajo `/api/admin`.

---

## 3. Integración actual con la API

El cliente centraliza la comunicación con la API en `lib/api.ts`.

### 3.1 Base URL

El proyecto define:

```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

Esto permite sobrescribir la URL del backend con una variable de entorno en el frontend cuando sea necesario.

### 3.2 Operaciones implementadas

El cliente incluye wrappers para:

- `listProperties`
- `getProperty`
- `login`
- `register`
- `me`
- `profile`
- `favorites`
- `addFavorite`
- `removeFavorite`
- `bookings`
- `createBooking`
- `cancelBooking`
- `createReview`
- `updateReview`
- `deleteReview`
- `createProperty`
- `updateProperty`
- `deleteProperty`
- `adminStats`
- `adminUsers`
- `adminProperties`
- `adminBookings`
- `adminReviews`
- `changeUserRole`
- `deleteUser`
- `adminDeleteReview`

Además, el cliente cuenta con manejo de errores para convertir respuestas HTTP en mensajes amigables al usuario.

---

## 4. Estado actual del backend

El backend en `proyecto_genesis_back` ya implementa una API REST con módulos claramente separados y lógica de negocio según roles.

### 4.1 Módulos principales

- `auth`: login, registro, perfil autenticado
- `users`: perfil del usuario, actualización propia, reservas y favoritos del usuario
- `properties`: listado, detalle, creación, edición, eliminación y filtros avanzados
- `bookings`: reservas, validaciones de disponibilidad, estados y cancelación
- `favorites`: agregar/quitar/listar propiedades preferidas
- `reviews`: calificaciones y comentarios de alojamientos completos
- `admin`: métricas y gestión global

### 4.2 Roles del sistema

- `GUEST`
- `HOST`
- `ADMIN`

### 4.3 Estados principales

- `PropertyStatus`: `ACTIVE`, `INACTIVE`
- `BookingStatus`: `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`
- `PropertyType`: `APARTMENT`, `HOUSE`, `ROOM`, `HOTEL`, `OTHER`

---

## 5. Endpoints clave del backend

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Usuarios

- `GET /api/users/me`
- `PATCH /api/users/me`
- `GET /api/users/me/bookings`
- `GET /api/users/me/favorites`

### Propiedades

- `GET /api/properties`
- `GET /api/properties/:id`
- `POST /api/properties`
- `PATCH /api/properties/:id`
- `DELETE /api/properties/:id`

### Favoritos

- `GET /api/favorites`
- `POST /api/favorites/:propertyId`
- `DELETE /api/favorites/:propertyId`

### Reservas

- `POST /api/bookings`
- `GET /api/bookings`
- `GET /api/bookings/:id`
- `PATCH /api/bookings/:id/cancel`

### Reseñas

- `POST /api/reviews`
- `GET /api/properties/:propertyId/reviews`
- `PATCH /api/reviews/:id`
- `DELETE /api/reviews/:id`

### Administración

- `GET /api/admin/stats`
- `GET /api/admin/users`
- `PATCH /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`
- `GET /api/admin/properties`
- `GET /api/admin/bookings`
- `GET /api/admin/reviews`

---

## 6. Flujo real del usuario

### Como huésped

1. Ingresa a la landing page.
2. Busca un destino o filtra propiedades.
3. Revisa tarjetas con precio, ubicación y capacidad.
4. Abre el detalle de un alojamiento.
5. Inicia sesión con credenciales demo.
6. Guarda favoritos si quiere.
7. Completa fechas y huéspedes.
8. Crea la reserva a través de la API.
9. Consulta sus reservas y reseñas.

### Como anfitrión

1. Inicia sesión con rol `HOST` o `ADMIN`.
2. Hace click en el CTA de Publicá tu espacio.
3. El modal existente abre con el formulario completo de publicación.
4. Completa todos los campos obligatorios y valida el inmueble antes de enviarlo.
5. El frontend envía los datos reales a `POST /api/properties` usando la sesión autenticada.
6. Si no hay sesión activa, se dispara el flujo de login del sistema.
7. La propiedad queda creada y visible en la lista de alojamientos del frontend.
8. Gestiona reservas y estado de la propiedad.

### Como administrador

1. Revisa métricas del sistema.
2. Gestiona usuarios y roles.
3. Monitorea propiedades, reservas y reseñas.
4. Hace mantenimiento operativo del marketplace.

---

## 7. Stack tecnológico actual

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- lucide-react
- UI con estilo shadcn / componentes reutilizables

### Backend

- NestJS
- TypeScript
- JWT
- TypeORM
- PostgreSQL
- Swagger / documentación API
- Despliegue pensado para entorno serverless o Node tradicional

---

## 8. Datos de prueba recomendados

El backend incluye usuarios de prueba con password común:

- `Password123!`

Usuarios disponibles:

- `admin@genesis.com` — `ADMIN`
- `host@genesis.com` — `HOST`
- `guest@genesis.com` — `GUEST`
- `ana@genesis.com` — `GUEST`

---

## 9. URLs relevantes

### Frontend local

- `http://localhost:3000`

### Backend local

- `http://localhost:3000/api`
- `http://localhost:3000/api/docs`

> Si el frontend y el backend corren en puertos distintos, la URL del backend se puede sobrescribir con `NEXT_PUBLIC_API_URL` en el proyecto frontend.

---

## 10. Resumen ejecutivo

Genesis Rentals ya está en una etapa funcional avanzada: incluye una UI moderna, autenticación con JWT, catálogo de propiedades, favoritos, reservas, reseñas y administración completa. Además, el flujo de publicación para anfitriones quedó reforzado con un formulario real, validación de negocio y conexión auténtica con la API del backend.

La base del proyecto está consolidada y lista para seguir evolucionando con más validaciones, pagos, disponibilidad avanzada y paneles de gestión más completos.

La documentación actual refleja el estado real del repositorio: el frontend ya integra con la API, el backend ya expone la lógica de negocio necesaria para una plataforma de alquileres completa, y el flujo de creación de propiedades ya funciona como una experiencia de publicación real, no demo.
