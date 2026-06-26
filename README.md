# AFORO

Plataforma multi-tenant de gestión de reservas para la industria del
entretenimiento nocturno (antros) en México. Desarrollada por MABI.

La fuente de verdad del producto es [`CLAUDE.md`](CLAUDE.md). La arquitectura
está en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y el modelo de datos en
[`docs/DATA_MODEL.md`](docs/DATA_MODEL.md).

## Stack

- **App:** Expo (React Native) + TypeScript + Expo Router. Una sola app con
  navegación por rol; en esta etapa, la experiencia del **cliente** (estética de
  vida nocturna, modo oscuro, QR protagonista).
- **Backend:** Supabase — PostgreSQL + API REST (PostgREST) + Auth + Storage +
  Row-Level Security, con **Edge Functions** (TypeScript) para la lógica de
  confianza (firmar/validar QR, matriz de permisos, reglas de negocio).

## Principios (de CLAUDE.md, aplican siempre)

- Multi-tenant con **aislamiento estricto** por corporativo, desde la base de datos.
- **Denegación por defecto**; permisos validados en el servidor (RLS + Edge Functions).
- **Configuración sin código**: reglas de negocio en tablas, no quemadas en el código.
- Seguridad base: contraseñas hasheadas (bcrypt), verificación de correo/teléfono,
  sesiones revocables, **QR firmado** y validado en servidor, HTTPS, cifrado en reposo.

## Cómo correrlo

Requisitos: Node 18+ y la app **Expo Go** (o un emulador).

```bash
npm install
npm start          # escanea el QR con Expo Go
# o:
npm run ios        # simulador iOS (requiere macOS)
npm run android    # emulador Android
```

> **Arranca sin configurar nada.** Sin credenciales de Supabase, la app corre en
> **modo demo** con datos de ejemplo (antros de Puebla): puedes registrarte,
> explorar, reservar y ver tus QR. Ideal para revisarla de inmediato.

## Conectar Supabase (datos reales)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta en orden:
   `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_config_seed.sql`
   y luego `supabase/seed.sql`.
3. Despliega las Edge Functions y su secreto:
   ```bash
   supabase functions deploy crear-reserva cancelar-reserva reclamar-qr
   supabase secrets set AFORO_QR_SECRET="$(openssl rand -hex 32)"
   ```
4. Copia las credenciales del proyecto:
   ```bash
   cp .env.example .env   # rellena EXPO_PUBLIC_SUPABASE_URL y _ANON_KEY
   ```
5. Reinicia: `npm start -- --clear`. La app detecta las variables y deja el modo demo.

## Estructura

```
app/        Pantallas (Expo Router): (auth)/ y (cliente)/ + detalles
src/        components, context, data, lib, permissions, theme, types
supabase/   migrations/ (esquema 4 módulos + RLS + config) · functions/ · seed.sql
docs/       ARCHITECTURE.md · DATA_MODEL.md
```

## Registro de módulos (plan de 4 secciones, CLAUDE.md §8)

| # | Módulo | Estado |
|---|--------|--------|
| 1 | Fundación + App del Cliente | **Hecho** — auth, explorar antros, eventos, crear reserva (acceso/mesa), QR distribuible, mis reservas, cancelación, base del reclamo de RP. Esquema y RLS de los 4 módulos. |
| 2 | Operación en piso | Pendiente (tablas creadas) |
| 3 | Red social + perfil del staff + motor de fantasmas | Pendiente (tablas creadas) |
| 4 | Paneles de gestión + Súper Admin | Pendiente (tablas creadas) |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo de Expo. |
| `npm run ios` / `android` / `web` | Abre en cada plataforma. |
| `npm run typecheck` | Revisa tipos con TypeScript. |
