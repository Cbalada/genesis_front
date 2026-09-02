# Genesis Rentals - Funcionalidades del proyecto

## 1. Descripción general

Genesis Rentals es una plataforma de alquileres de propiedades inspirada en modelos tipo Airbnb. El proyecto combina:

- Frontend: Next.js + React + TypeScript + Tailwind
- Backend: NestJS + TypeScript
- Autenticación: JWT
- Base de datos: PostgreSQL / TypeORM (según la estructura del backend)
- Objetivo: permitir a usuarios buscar alojamientos, reservar, guardar favoritos y gestionar propiedades como anfitrión o administrador.

El flujo principal del sistema está orientado a tres actores:

- Guest / huésped: busca, compara, reserva y califica alojamientos.
- Host / propietario: publica propiedades, gestiona disponibilidad y recibe reservas.
- Admin / administrador: supervisa usuarios, propiedades, reservas y reseñas.

---

## 2. Funcionalidades del frontend

### 2.1 Landing page / home

La aplicación principal en Next muestra una interfaz moderna con:

- Hero section con propuesta de valor
- Barra de búsqueda de destino
- Selector de viajeros
- Filtros por tipo de propiedad
- Carrusel visual de propiedades destacadas
- CTA para explorar alojamientos o publicar un espacio
- Sección de inspiración y marketing visual

La vista principal incluye elementos de UX tipo marketplace:

- tarjetas de propiedades con imagen, ubicación y precio
- favoritos con botón de corazón
- modal con detalle del alojamiento
- control para iniciar sesión o continuar como invitado

### 2.2 Búsqueda de propiedades

La búsqueda permite:

- filtrar por ciudad o destino
- filtrar por tipo de propiedad (HOUSE, APARTMENT, etc.)
- seleccionar cantidad de viajeros
- consultar propiedades desde la API
- mostrar un fallback visual cuando la API no responde

La llamada del frontend usa la API:

- GET /api/properties
- con parámetros como: city, propertyType, guests, page, limit

### 2.3 Detalle de propiedad

Al hacer click en una propiedad, el frontend abre un modal con:

- nombre del alojamiento
- ciudad y país
- cantidad de habitaciones, baños y huéspedes
- descripción
- precio por noche
- botón para reservar

Esto permite una experiencia rápida sin salir de la página principal.

### 2.4 Sistema de autenticación

La app incluye un modal de login con credenciales demo:

- Email: guest@genesis.com
- Password: Password123!

También se prepara la lógica para:

- registro de usuarios
- obtener perfil autenticado
- sesión JWT

### 2.5 Favoritos

El frontend tiene lógica para guardar propiedades en favoritos:

- botón de corazón por propiedad
- si el usuario no está logueado, pide iniciar sesión
- si está autenticado, alterna la propiedad como favorita

Esto corresponde a la funcionalidad del backend en:

- POST /api/favorites/:propertyId
- DELETE /api/favorites/:propertyId
- GET /api/favorites

### 2.6 Publicación de alojamiento para anfitriones

La aplicación tiene un modal para anfitriones con:

- título del alojamiento
- ciudad
- precio por noche
- máximo de huéspedes
- flujo de demo para guardar el alojamiento

Este flujo representa la funcionalidad de creación de propiedades del backend:

- POST /api/properties

### 2.7 Reserva de alojamiento

La UI incluye un flujo de reserva con:

- botón de Reservar
- validación de sesión activa
- mensaje de acción para completar fechas y continuar con la reserva

La lógica real del backend soporta:

- POST /api/bookings
- cálculo de total de la reserva
- check-in y check-out
- validación de huéspedes y propiedad

---

## 3. Funcionalidades del backend API

El backend de NestJS expone una API REST con un conjunto robusto de módulos para la gestión del alquiler.

### 3.1 Autenticación y usuarios

#### Registro

- POST /api/auth/register
- Permite crear un usuario nuevo
- Devuelve JWT + datos del usuario

#### Login

- POST /api/auth/login
- Valida email y contraseña
- Devuelve accessToken y user

#### Perfil autenticado

- GET /api/auth/me
- Retorna información del usuario logueado

#### Perfil propio

- GET /api/users/me
- PATCH /api/users/me
- Permite ver y actualizar nombre, avatar y datos básicos

#### Roles del sistema

- GUEST: huésped
- HOST: propietario / anfitrión
- ADMIN: administrador

---

## 4. Gestión de propiedades

### Funcionalidades principales

- Listar propiedades con filtros y paginación
- Ver detalles de una propiedad por ID
- Crear propiedades (solo HOST/ADMIN)
- Actualizar propiedades
- Eliminar o desactivar propiedades
- Adjuntar imágenes
- Definir imagen principal / cover

### Endpoints principales

- GET /api/properties
- GET /api/properties/:id
- POST /api/properties
- PATCH /api/properties/:id
- DELETE /api/properties/:id
- POST /api/properties/:id/images
- DELETE /api/properties/:id/images/:imageId
- PATCH /api/properties/:id/images/:imageId/cover

### Filtros disponibles

- city
- country
- minPrice
- maxPrice
- guests
- bedrooms
- bathrooms
- propertyType
- checkIn
- checkOut
- page
- limit
- sortBy
- order

---

## 5. Gestión de reservas

### Funcionalidades principales

- Crear una reserva para una propiedad disponible
- Consultar reservas del usuario o del anfitrión
- Consultar detalles de una reserva
- Cancelar reservas
- Controlar reglas según rol y fechas

### Estados de reserva

- PENDING
- CONFIRMED
- CANCELED
- COMPLETED

### Reglas importantes

- Un HOST no puede reservar su propia propiedad, salvo ADMIN
- El guest solo puede cancelar sus propias reservas con ciertos límites de tiempo
- ADMIN puede ver todas las reservas
- HOST puede ver reservas de sus propiedades
- GUEST puede ver solo sus reservas

### Endpoints principales

- POST /api/bookings
- GET /api/bookings
- GET /api/bookings/:id
- PATCH /api/bookings/:id/cancel

---

## 6. Favoritos

La plataforma permite guardar propiedades preferidas por usuario.

### Funcionalidades

- Agregar propiedad a favoritos
- Quitar propiedad de favoritos
- Listar favoritos de un usuario

### Endpoints

- POST /api/favorites/:propertyId
- DELETE /api/favorites/:propertyId
- GET /api/favorites

Esto se refleja en el frontend con el botón de corazón en cada propiedad.

---

## 7. Reviews / reseñas

Los usuarios pueden dejar opiniones sobre una estadía realizada.

### Funcionalidades

- crear review solo si la reserva corresponde al usuario
- la reserva debe estar completada
- la propiedad y la reserva deben coincidir
- cada reserva puede tener una sola review
- el autor puede modificar o borrar su review

### Endpoints

- POST /api/reviews
- GET /api/properties/:propertyId/reviews
- PATCH /api/reviews/:id
- DELETE /api/reviews/:id

---

## 8. Administración

El backend incluye un área administrativa con métricas y gestión completa.

### Estadísticas

- total de usuarios
- total de propiedades
- total de reservas
- total de reseñas
- reservas activas
- reservas completadas
- reservas canceladas

### Endpoints admin

- GET /api/admin/stats
- GET /api/admin/users
- PATCH /api/admin/users/:id/role
- DELETE /api/admin/users/:id
- GET /api/admin/properties
- GET /api/admin/bookings
- GET /api/admin/reviews

Esto permite un control centralizado del funcionamiento de la plataforma.

---

## 9. Flujo típico del usuario

### Como huésped

1. Ingresa a la landing page
2. Busca un destino o filtra propiedades
3. Revisa las tarjetas con precios y datos
4. Abre el detalle de una propiedad
5. Inicia sesión
6. Guarda favoritos si quiere
7. Reserva el alojamiento con fechas y cantidad de huéspedes
8. Puede luego ver sus reservas y reseñas

### Como anfitrión

1. Inicia sesión como HOST
2. Accede a la opción de publicar alojamiento
3. Completa datos del inmueble
4. Crea la propiedad con precio, ubicación y capacidad
5. Gestiona reservas y mantiene la propiedad activa/inactiva

### Como administrador

1. Ver métricas del sistema
2. Revisar usuarios, propiedades y reservas
3. Cambiar roles
4. Gestionar contenido y actividad global

---

## 10. Stack tecnológico

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- lucide-react icons

### Backend

- NestJS
- TypeScript
- JWT
- TypeORM / DB layer
- módulos de auth, users, properties, bookings, favorites, reviews, admin

---

## 11. Resumen ejecutivo

Genesis Rentals es una plataforma completa de alquileres con capacidad para:

- explorar propiedades
- gestionar cuentas y roles
- publicar alojamientos
- reservar y cancelar estadías
- guardar favoritos
- dejar reseñas
- administrar la operación desde un panel de admin

Es un proyecto orientado a ser una solución realista de marketplace inmobiliario / turístico con lógica de negocio clara, validación de permisos y experiencia de usuario moderna.

---

## 12. Datos de prueba recomendados

El backend documenta usuarios de prueba con password:

- Password123!

Usuarios:

- admin@genesis.com (ADMIN)
- host@genesis.com (HOST)
- guest@genesis.com (GUEST)
- ana@genesis.com (GUEST)

---

## 13. URLs relevantes

Frontend local:

- http://localhost:3000 (o el puerto del proyecto Next)

Backend local:

- http://localhost:3000/api (según configuración del backend)
- http://localhost:3000/api/docs

Esta documentación resume las funcionalidades principales y la arquitectura funcional del proyecto Genesis Rentals.
