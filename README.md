# AFORO 🌃

App de vida nocturna para México. AFORO ayuda a los clientes a decidir **a dónde
ir esta noche** mostrando los lugares cercanos y su **nivel de aforo en vivo**
(vacío / moderado / lleno), y permite a cada **venue** mantener su información y
ocupación al día.

Es el MVP de una plataforma multi-tenant más grande (operación → inteligencia →
monetización), cuyo diferenciador es el motor de detección de reservas fantasma.
Ver [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) para el panorama completo.

## ✨ MVP

1. **Lista** de lugares cercanos con su nivel de ocupación.
2. **Ficha** de cada lugar: fotos, dirección, horario, cover, tipo de música.
3. **Buscar y filtrar** por zona, música y nivel de aforo.
4. **Panel del venue** para actualizar su aforo y datos.
5. **Auth básica** (registro/login) para clientes y venues.

## 🧱 Stack

- **Expo (React Native) + TypeScript** — un código para iOS y Android.
- **Expo Router** — navegación basada en archivos.
- **Supabase** — Postgres + Auth + Storage + Realtime, con **Row-Level Security**
  para el aislamiento multi-tenant y **PostGIS** para lugares cercanos.

## 🚀 Cómo correrlo

Requisitos: Node 18+ y la app **Expo Go** en tu teléfono (o un emulador).

```bash
npm install
npm start          # abre Expo Dev Tools; escanea el QR con Expo Go
# o directamente:
npm run ios        # simulador iOS (requiere macOS)
npm run android    # emulador Android
npm run web        # navegador
```

> **Arranca sin configurar nada.** Sin credenciales de Supabase, la app corre en
> **modo demo** con datos de ejemplo (antros de la CDMX). Ideal para verla correr
> de inmediato.

## 🔌 Conectar Supabase (datos reales)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En el **SQL Editor**, ejecuta `supabase/migrations/0001_init.sql` y luego
   `supabase/seed.sql`.
3. Copia las credenciales:

   ```bash
   cp .env.example .env
   ```

   Rellena `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   (Project Settings → API).
4. Reinicia el servidor: `npm start -- --clear`.

La app detecta las variables y cambia de modo demo a Supabase real sin tocar código.

## 📁 Estructura

```
app/        Pantallas (Expo Router)
src/        Componentes, capa de datos, auth, tipos, tema
supabase/   Migración SQL + seed
docs/       Arquitectura
```

## 🗺️ Roadmap inmediato

- [ ] Vista de **mapa** (`react-native-maps` + dev build).
- [ ] **Aforo en vivo** vía Supabase Realtime.
- [ ] Reservas + QR + control de acceso.
- [ ] Motor de detección de fantasmas, métricas e hitos.

## 📝 Scripts

| Comando            | Qué hace                          |
|--------------------|-----------------------------------|
| `npm start`        | Inicia el servidor de desarrollo. |
| `npm run ios`      | Abre en simulador iOS.            |
| `npm run android`  | Abre en emulador Android.         |
| `npm run web`      | Abre en navegador.                |
| `npm run typecheck`| Revisa tipos con TypeScript.      |
