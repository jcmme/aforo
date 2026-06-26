# Arquitectura — AFORO MVP

## Visión

AFORO es una plataforma **multi-tenant** de vida nocturna en México. Varios
**corporativos**, cada uno con sus **antros (venues)**, su personal y sus
métricas, aislados sobre una misma infraestructura. La plataforma tiene tres
capas:

1. **Operación** — reservas + QR + control de acceso.
2. **Inteligencia** — detección de reservas fantasma + métricas + hitos del staff.
3. **Monetización** — suscripción SaaS + difusión pagada + promociones.

El diferenciador es el **motor de detección de fantasmas** (clientes que reservan
y no llegan), sobre el que se apoya el sistema de métricas e hitos.

> Este repositorio contiene el **MVP** (primera versión), enfocado en
> descubrimiento de lugares y aforo en vivo. Las capas de inteligencia y
> monetización se construyen encima del mismo modelo de datos.

## Alcance del MVP

1. Lista de lugares cercanos con nivel de ocupación (vacío / moderado / lleno).
2. Ficha de cada lugar: fotos, dirección, horario, cover, tipo de música.
3. Búsqueda y filtros por zona, música y nivel de aforo.
4. Vista para que un venue actualice su aforo y datos.
5. Auth básica (registro/login) para clientes y para venues.

## Stack

| Capa      | Tecnología                                   | Por qué |
|-----------|----------------------------------------------|---------|
| Móvil     | **Expo (React Native) + TypeScript**         | Un código para iOS y Android; build/deploy con EAS; OTA updates. |
| Ruteo     | **Expo Router**                              | Navegación basada en archivos, deep links y rutas tipadas. |
| Backend   | **Supabase** (Postgres + Auth + Storage + Realtime) | Backend gestionado, sin servidor propio que mantener. |
| Geo       | **PostGIS**                                  | Consulta de lugares cercanos (`nearby_venues`). |
| Multi-tenant | **Row-Level Security (RLS)**              | Aislamiento por corporativo a nivel de base de datos. |

**Por qué Supabase y no un backend propio:** para un MVP, Supabase entrega auth,
API REST/RPC (PostGREST), realtime, storage y RLS sin operar infraestructura.
El "motor de fantasmas", métricas e hitos viven a futuro como funciones SQL y
Edge Functions sobre la misma base, sin reescribir la app.

## Flujo de datos

```
┌─────────────────────────────┐         ┌──────────────────────────────┐
│      App Expo (RN)          │         │           Supabase           │
│                             │  HTTPS  │                              │
│  app/  (pantallas)          │ ──────► │  PostgREST  (tabla venues)   │
│  src/data/venues.ts ────────┼─────────┤  RPC nearby_venues (PostGIS) │
│  src/context/AuthContext ───┼─────────┤  Auth (email/password)       │
│  src/lib/supabase.ts        │         │  RLS por corporativo         │
└─────────────────────────────┘         └──────────────────────────────┘
            │
            └── Sin credenciales → MODO DEMO (src/data/mock.ts)
```

La **capa de datos** (`src/data/venues.ts`) abstrae el origen: si hay
credenciales de Supabase usa la base real; si no, sirve datos locales
(`src/data/mock.ts`). Así la app corre desde el primer `npx expo start` sin
configurar nada, y al pegar las variables de entorno pasa a datos reales sin
cambios de código.

## Modelo de datos (MVP)

- **corporativos** — el tenant.
- **profiles** — extiende `auth.users`; `rol` ∈ {cliente, venue_staff};
  `corporativo_id` para el staff.
- **venues** — antro: geo (PostGIS), fotos, horario, cover, tipos de música,
  nivel de aforo + timestamp de actualización.

RLS: los venues son de **lectura pública** (los clientes descubren sin login);
el **venue_staff** sólo puede crear/editar venues de **su** corporativo.

Ver `supabase/migrations/0001_init.sql`.

## Estructura del proyecto

```
app/                  Pantallas (Expo Router, file-based routing)
  _layout.tsx         Stack raíz + AuthProvider
  index.tsx           Lista + búsqueda + filtros  (MVP 1 y 3)
  venue/[id].tsx      Ficha del lugar             (MVP 2)
  (auth)/login.tsx    Login                       (MVP 5)
  (auth)/register.tsx Registro cliente/venue      (MVP 5)
  admin/index.tsx     Panel del venue: aforo       (MVP 4)
src/
  components/         VenueCard, OccupancyBadge, FilterChips
  context/            AuthContext (sesión)
  data/               Capa de datos + datos demo
  lib/                Cliente Supabase + config de entorno
  types/              Modelo de dominio
  theme.ts            Tokens visuales (tema nocturno + semáforo de aforo)
supabase/             Migración SQL + seed
```

## Siguientes pasos (post-MVP)

- **Vista de mapa** con `react-native-maps` (requiere dev build y API key de
  Google Maps en Android). El listado ya ordena por cercanía con la ubicación.
- **Realtime** del aforo vía Supabase Realtime (suscripción a `venues`).
- **Reservas + QR + control de acceso** (capa de operación).
- **Motor de detección de fantasmas**, métricas e hitos (capa de inteligencia).
- **Suscripción SaaS + difusión + promociones** (capa de monetización).
