# Genesis Rentals - Estado actual del proyecto (actualizado)

## 1. Descripción general

Genesis Rentals es una plataforma de alquileres tipo marketplace inspirada en Airbnb. La estructura del proyecto ya está consolidada y funciona en dos capas:

- Frontend: Next.js 16 + React 19 + TypeScript + Tailwind
- Backend: NestJS + TypeScript + JWT + TypeORM + PostgreSQL
- Objetivo: permitir buscar alojamientos, reservar, guardar favoritos, publicar propiedades, gestionar imágenes, calificar estadías y administrar la operación con roles.

Los perfiles principales del sistema son:

- Guest / huésped: busca propiedades, filtra por destino, reserva y califica alojamientos.
- Host / propietario: publica propiedades, administra imágenes, recibe reservas y gestiona el estado de sus propiedades.
- Admin / administrador: supervisa usuarios, propiedades, reservas, reseñas y roles.

El proyecto ya contempla autenticación real con JWT, permisos por rol, administración de contenido y conexión con la API del backend desde el frontend.

---

## 2. Estado actual del frontend

La parte del cliente en Next.js incluye una landing page premium, una experiencia de búsqueda completa, una página dedicada de alojamientos y flujos reales de autenticación, reserva, favoritos y administración.

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
- fallback de datos si la API no responde

### 2.2 Página dedicada de alojamientos

El proyecto ya cuenta con una vista específica en `app/alojamientos/page.tsx` para explorar todos los alojamientos disponibles.

Incluye:

- listado de resultados completo
- filtrado por destino y capacidad
- selector de fechas y huéspedes
- estado visual de favoritos
- render con imagen principal y layout tipo marketplace
- integración con la API de propiedades y favoritos

### 2.3 Búsqueda y filtros

La búsqueda del frontend consume la API del backend con `GET /api/properties` y soporta:

- ciudad/destino
- `propertyType` (`HOUSE`, `APARTMENT`, `ROOM`, `HOTEL`, `OTHER`)
- cantidad de huéspedes
- rango de precios
- filtros por dormitorios y baños
- fechas de entrada/salida para validación de disponibilidad
- paginación y ordenamiento
- fallback visual si la API no responde

La client-side API usa `URLSearchParams` y un helper centralizado en `lib/api.ts` para construir queries.

### 2.4 Detalle de propiedad y galería

Al hacer click en una propiedad, el frontend abre un modal con:

- título del alojamiento
- ciudad y país
- habitaciones, baños y huéspedes máximos
- descripción
- precio por noche
- galería de imágenes
- navegación entre imágenes
- botón para reservar
- reseñas asociadas a la propiedad

### 2.5 Autenticación y sesión

El frontend incluye:

- modal de login con credenciales demo
- persistencia de sesión en `localStorage`
- restauración automática del usuario logueado
- manejo del token JWT en requests autenticados
- cierre de sesión
- validación del rol activo para mostrar acciones de host/admin

Credenciales demo oficiales:

- Email: `guest@genesis.com`
- Password: `Password123!`

También se soportan usuarios con roles:

- `ADMIN`
- `HOST`
- `GUEST`

### 2.6 Favoritos

La interfaz permite guardar y quitar propiedades como favoritas:

- botón de corazón por propiedad
- bloqueo si el usuario no está autenticado
- sincronización con la API de favoritos del backend

Endpoints utilizados:

- `GET /api/favorites`
- `POST /api/favorites/:propertyId`
- `DELETE /api/favorites/:propertyId`

### 2.7 Publicación de alojamiento para anfitriones

La app incluye un flujo real para publicar propiedades desde el modal de host, manteniendo la identidad visual del marketplace.

El flujo actual incluye:

- formulario completo con título, descripción, tipo de propiedad, ciudad, país, dirección
- precio por noche, máximo de huéspedes, baños y cantidad de habitaciones
- validación de campos obligatorios y valores positivos
- validación de tipos permitidos según el enum del backend: `APARTMENT`, `HOUSE`, `ROOM`, `HOTEL`, `OTHER`
- bloqueo si el usuario no está autenticado
- validación de permisos: solo `HOST` o `ADMIN` pueden publicar
- envío autenticado a `POST /api/properties`
- manejo de estados de carga, éxito y error
- limpieza del modal tras un alta exitosa
- scroll interno del modal para móvil y desktop

Además, el frontend ya contempla carga de imágenes asociadas al inmueble:

- subida de múltiples fotos por propiedad
- validación de tipo y tamaño (`jpeg`, `png`, `webp`, máximo 10MB por archivo)
- límite de 20 imágenes por propiedad
- selección de portada
- eliminación de imágenes
- cambio de imagen principal

La lógica de gestión de imágenes se expone en `components/PropertyImageUploader.tsx` y se conecta con endpoints del backend para archivos multimedia.

### 2.8 Reserva de alojamiento

El frontend ya implementa un flujo de reserva con:

- selección de fechas
- validación de sesión activa
- cálculo de noches
- envío de la reserva a la API
- validación de fechas y huéspedes
- manejo de errores para conflictos o datos inválidos

Endpoints principales:

- `POST /api/bookings`
- `GET /api/users/me/bookings`
- `PATCH /api/bookings/:id/cancel`

### 2.9 Panel administrativo

La UI del frontend incluye acceso a un panel de administración para usuarios con rol `ADMIN`:

- estadísticas generales
- listado de usuarios
- listado de propiedades
- listado de reservas
- listado de reseñas
- cambio de rol por usuario
- eliminación de usuarios y reseñas
- gestión global del marketplace

Esto refleja los endpoints de `/api/admin` y la lógica del backend.

### 2.10 Perfil y actualización de datos

El frontend ya incluye soporte para consultar y actualizar el perfil del usuario autenticado:

- `me()`
- `profile()`
- `updateProfile()`

Esto permite mantener nombre y avatar en la sesión activa.

---

## 3. Integración actual con la API

El cliente centraliza la comunicación con la API en `lib/api.ts`.

### 3.1 Base URL

El proyecto define:

```ts
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
```

Esto permite sobrescribir la URL del backend cuando frontend y backend corren en puertos distintos o cuando se despliega en un entorno externo.

### 3.2 Operaciones implementadas

El cliente incluye wrappers para:

- `listProperties`
- `getProperty`
- `login`
- `register`
- `me`
- `profile`
- `updateProfile`
- `favorites`
- `addFavorite`
- `removeFavorite`
- `bookings`
- `booking`
- `createBooking`
- `cancelBooking`
- `propertyReviews`
- `createReview`
- `updateReview`
- `deleteReview`
- `createProperty`
- `updateProperty`
- `deleteProperty`
- `uploadPropertyImage`
- `deletePropertyImage`
- `setCoverImage`
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

El backend en `proyecto_genesis_back` ya implementa una API REST modular con lógica de negocio según roles y validaciones por dominio.

### 4.1 Módulos principales

- `auth`: login, registro, perfil autenticado
- `users`: perfil del usuario, actualización propia, reservas y favoritos del usuario
- `properties`: listado, detalle, creación, edición, eliminación, filtros avanzados y administración de imágenes
- `bookings`: reservas, validaciones de disponibilidad, estados y cancelación
- `favorites`: agregar/quitar/listar propiedades preferidas
- `reviews`: calificaciones y comentarios de alojamientos completos
- `admin`: métricas y gestión global
- `upload`: servicio para subir imágenes a Cloudinary con fallback local/Drive

### 4.2 Roles del sistema

- `GUEST`
- `HOST`
- `ADMIN`

### 4.3 Estados principales

- `PropertyStatus`: `ACTIVE`, `INACTIVE`
- `BookingStatus`: `PENDING`, `CONFIRMED`, `CANCELED`, `COMPLETED`
- `PropertyType`: `APARTMENT`, `HOUSE`, `ROOM`, `HOTEL`, `OTHER`

### 4.4 Gestión de imágenes en backend

El backend ya incluye soporte real para imágenes de propiedades, no solo texto o URLs estáticas.

Actuales características:

- almacenamiento de imágenes por propiedad
- soporte de `isCover` para marcar la foto principal
- límite de 20 imágenes por inmueble
- subida directa con `FileInterceptor`
- validación de tamaño y tipo de archivo
- eliminación de imagen física/Cloudinary
- cambio de imagen principal
- fallback a almacenamiento local y Google Drive si la configuración externa no está disponible

Esto se implementa a través de `UploadModule`, `CloudinaryService` y la lógica en `PropertiesController` / `PropertiesService`.

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
- `POST /api/properties/:id/images`
- `DELETE /api/properties/:id/images/:imageId`
- `PATCH /api/properties/:id/images/:imageId/cover`

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
2. Hace click en el CTA de “Publicá tu espacio”.
3. El modal existente abre con el formulario de publicación.
4. Completa los campos obligatorios y valida el inmueble antes de enviarlo.
5. El frontend envía los datos a `POST /api/properties` usando la sesión autenticada.
6. Si no hay sesión activa, se dispara el flujo de login.
7. La propiedad queda creada y visible en la lista de alojamientos.
8. Sube fotos, define la portada y gestiona la galería.
9. Gestiona reservas y el estado de la propiedad.

### Como administrador

1. Revisa métricas del sistema.
2. Gestiona usuarios y roles.
3. Monitorea propiedades, reservas y reseñas.
4. Hace mantenimiento operativo del marketplace.
5. Verifica calidad de contenido y permisos del usuario.

---

## 7. Stack tecnológico actual

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- lucide-react
- UI con estilo shadcn / componentes reutilizables
- App Router de Next.js

### Backend

- NestJS
- TypeScript
- JWT
- TypeORM
- PostgreSQL
- Swagger / documentación API
- Cloudinary para almacenamiento de imágenes
- Google Drive / almacenamiento local como fallback
- despliegue pensado para entorno serverless o Node tradicional

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

### Variables de entorno relevantes

En el backend:

- `DATABASE_URL`
- `JWT_SECRET`
- `PORT`
- `CLOUDINARY_URL` (opcional para almacenamiento en Cloudinary)
- `GOOGLE_DRIVE_CLIENT_EMAIL`, `GOOGLE_DRIVE_PRIVATE_KEY` (opcional si se usa Drive)

---

## 10. Resumen ejecutivo

Genesis Rentals ya está en una etapa funcional avanzada: tiene UI moderna, autenticación con JWT, catálogo de propiedades, favoritos, reservas, reseñas, panel administrativo y flujo real de publicación de alojamientos. Además, se incorporó la gestión de imágenes por propiedad, lo que lleva la experiencia de anfitrión más cerca de un marketplace real, con fotos, portada y validaciones de contenido.

La base del proyecto está consolidada y lista para evolucionar con más validaciones, pagos, disponibilidad avanzada, mejor administración de contenido y paneles operativos más completos.

La documentación actual refleja el estado real del repositorio: el frontend ya integra con la API, el backend ya expone la lógica de negocio necesaria para una plataforma completa de alquileres y el flujo de creación pública de propiedades ya funciona como una experiencia de publicación real, no solo demo.
