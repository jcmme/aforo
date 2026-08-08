# Arquitectura — AFORO

## Visión

AFORO es una plataforma **multi-tenant** de reservas para antros (CLAUDE.md §1).
Varios **corporativos**, cada uno con sus antros, personal y métricas, aislados
sobre una misma infraestructura. Tres capas: Operación, Inteligencia,
Monetización. Diferenciador: **detección de reservas fantasma**.

Se construye en **4 secciones** (CLAUDE.md §8). La base de datos contempla las
cuatro desde el inicio; cada sección añade lógica encima sin rehacer la base.

## Stack y por qué

| Capa | Tecnología | Razón |
|------|------------|-------|
| App | Expo + TypeScript + Expo Router | Un código iOS/Android; build/deploy con EAS; navegación por rol en una sola app. |
| API + datos | Supabase (PostgreSQL + PostgREST + Auth + Storage) | API REST sobre Postgres sin servidor propio que operar; **RLS** para aislamiento multi-tenant. |
| Lógica de confianza | Supabase **Edge Functions** (TypeScript) | Firma/validación de QR, matriz de permisos y reglas de negocio en el servidor. |

El esquema de Postgres es el activo durable. Si un módulo futuro necesita un
backend dedicado, se añade sobre la misma base sin rehacer datos.

## Cómo se cumplen los principios no negociables

- **Aislamiento multi-tenant** (CLAUDE.md §2): toda tabla de negocio lleva
  `corporativo_id`; **RLS activado en todas** las tablas (sin policy = sin
  acceso). Helpers `auth_corporativos()`, `es_super_admin()`, `tiene_permiso()`.
- **Denegación por defecto**: la matriz vive en la tabla `permisos` (solo filas
  permitidas existen). Las escrituras sensibles pasan por Edge Functions que
  validan permiso + tenant con la `service_role` antes de tocar datos.
- **Configuración sin código**: `config_parametros` (precedencia
  antro > corporativo > global) y `feature_flags` por corporativo. Umbrales,
  cupos, ventanas, textos y montos viven ahí.
- **Seguridad** (CLAUDE.md §3): contraseñas bcrypt (Supabase Auth); verificación
  de correo (Auth) y teléfono (campos listos, requiere proveedor SMS); sesiones
  revocables; QR firmado con HMAC (`AFORO_QR_SECRET`, solo servidor) y validado
  en servidor; HTTPS y cifrado en reposo (Supabase); `pgcrypto` disponible;
  bitácora en `auditoria`.

## Flujo de datos

```
┌─────────────────────────────┐   HTTPS    ┌──────────────────────────────────┐
│        App Expo (RN)        │ ─────────► │             Supabase             │
│  app/  (pantallas por rol)  │            │  PostgREST + RLS (lecturas)      │
│  src/data/* ────────────────┼─ lecturas ─┤  Edge Functions (escrituras):    │
│  src/lib/supabase.ts        │ ─ acciones ┤   crear-reserva / cancelar /     │
│  src/context/AuthContext    │            │   reclamar-qr  (service_role)    │
└─────────────────────────────┘            │  Auth (bcrypt, JWT, verificación)│
            │                              └──────────────────────────────────┘
            └── Sin credenciales → MODO DEMO (src/data/mock.ts)
```

La **capa de datos** (`src/data/`) abstrae el origen: con credenciales usa
Supabase; sin ellas, datos locales. La app navega completa en modo demo.

## Sección 1 — qué se implementó

- **Identidad/tenancy:** `corporativos`, `antros`, `usuarios`, `membresias`.
- **Reservas:** `eventos`, `reservas`, `qr_codes`, `enlaces_reclamo`.
- **Config/seguridad:** `permisos` (matriz §5), `config_parametros`,
  `feature_flags`, `auditoria`.
- **App del cliente:** registro/login/verificación, explorar antros, catálogo de
  eventos, crear reserva (acceso/mesa), QR protagonista distribuible, mis
  reservas, cancelación, reclamo de QR (deep link).
- **Edge Functions:** `crear-reserva`, `cancelar-reserva`, `reclamar-qr` + shared
  (`qr`, `auth`, `config`, `cors`).

## Esquema-only (módulos 2-4)

Las tablas de operación en piso, inteligencia/red social y gestión/monetización
ya existen (ver `docs/DATA_MODEL.md`), con RLS en denegación por defecto. Su
lógica llega en las secciones 2-4.

## Siguientes pasos

- **Sección 2** (operación en piso): escaneo de puerta verde/amarillo/rojo,
  acceso manual con motivos, contador, mesas, escaneo de mesa. Requiere
  `expo-camera` y la cola offline de escaneos.
- Verificación de teléfono con proveedor SMS (Twilio).
- Notificaciones push (CLAUDE.md §7).
