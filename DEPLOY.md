# Publicar Aforo en Supabase + Vercel

Guía paso a paso para tener un link real. Son ~30-40 minutos, casi todo dando
clic en interfaces web.

## 0. Qué vas a crear

Un proyecto en **Supabase** (la base de datos Postgres) y **dos** proyectos
en **Vercel** (el backend/API y el frontend), apuntando ambos al mismo repo
`jcmme/aforo` — cada uno con su propio "Root Directory" (`backend` y
`frontend`), igual que antes eran dos servicios separados en Railway.

Diferencia de fondo con Railway: Vercel no corre un proceso que queda
prendido — corre **funciones serverless** que se despiertan por request.
Por eso las migraciones y el seed ya no corren solos en cada deploy: se
corren a mano, una vez, desde tu máquina, apuntando a Supabase (paso 2).

## 1. Supabase — base de datos

1. Cuenta en [supabase.com](https://supabase.com), **New Project** (elige
   una región cercana, ej. `us-east-1`). Te va a pedir una contraseña para
   Postgres — guárdala, la necesitas para armar las URLs de conexión.
2. Ve a **Project Settings → Database → Connection string** y copia dos
   variantes (las vas a necesitar en pasos distintos):
   - **Direct connection** (puerto **5432**) — la usas tú, desde tu
     computadora, solo para correr migraciones y el seed.
   - **Transaction pooler** (puerto **6543**, a veces etiquetada
     "Supavisor") — esta es la que usa el backend ya desplegado en Vercel.

   Ambas se ven parecido a
   `postgresql://postgres.xxxxx:TU-PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres`
   (cambia el puerto según cuál copiaste). Sustituye `TU-PASSWORD` por la
   contraseña del paso 1.

## 2. Correr migraciones y el seed (una sola vez, desde tu máquina)

1. En `backend/`, crea un archivo `.env` (es local, no se sube a git —
   bórralo cuando termines si quieres) con:
   ```
   DATABASE_URL=<la conexión DIRECTA de Supabase, puerto 5432>
   DATABASE_SSL=true
   ```
2. `cd backend && npm run migration:run` — crea todas las tablas.
3. `npm run seed` — crea los roles y el Super Admin
   (`jcmme18@gmail.com` / `cambia-esta-password`).
4. Guarda ese `.env` en algún lugar seguro (o bórralo) — lo vuelves a
   necesitar cada vez que agregues una migración nueva en el futuro:
   repite este paso (solo `migration:run`, no hace falta repetir el seed)
   antes de que el código que depende de esa tabla/columna llegue a
   producción.

## 3. Vercel — backend

1. Cuenta en [vercel.com](https://vercel.com) con tu GitHub.
2. **Add New → Project** → importa `jcmme/aforo`.
3. **Root Directory** → `backend`. Framework Preset: "Other" (Vercel debería
   respetar el `vercel.json` que ya está en `backend/` para el build y las
   rutas).
4. **Environment Variables**, antes de desplegar:
   - `DATABASE_URL` → la conexión del **pooler** de Supabase (puerto 6543)
   - `DATABASE_SSL` → `true`
   - `JWT_SECRET` → un valor largo y aleatorio (corre `openssl rand -hex 32`
     en tu terminal y pega el resultado)
   - `JWT_EXPIRES_IN` → `8h`
   - `CORS_ORIGIN` → déjala vacía por ahora, la completas en el paso 5
5. **Deploy**. Cuando termine, copia la URL que te da (ej.
   `https://aforo-backend.vercel.app`) — la necesitas en el paso 4.

## 4. Vercel — frontend

1. Otra vez **Add New → Project** → mismo repo `jcmme/aforo`.
2. **Root Directory** → `frontend`. Vercel debería detectar "Vite" solo
   como framework preset.
3. **Environment Variables** → `VITE_API_URL` → la URL del backend del
   paso 3.
4. **Deploy**. Esta URL es tu link final, la que vas a compartir.

## 5. Cerrar el círculo: restringir CORS

1. Vuelve al proyecto del **backend** en Vercel → **Settings →
   Environment Variables** → edita `CORS_ORIGIN` con la URL del frontend
   del paso 4 (ej. `https://aforo.vercel.app`).
2. **Deployments** → los tres puntos del último deploy → **Redeploy**, para
   que tome la variable nueva.

## 6. Entrar

Abre la URL del frontend (paso 4). Entra con:

- **jcmme18@gmail.com** / **cambia-esta-password** (Super Admin — ve y hace
  todo)

Cambia esa contraseña desde Configuración antes de compartir el link con
nadie más.

## Si algo no arranca

- **Backend responde 500 o timeout en cada request**: revisa **Logs** del
  proyecto backend en Vercel — casi siempre es `DATABASE_URL` mal puesta
  (recuerda: la del **pooler**, puerto 6543, no la directa) o
  `DATABASE_SSL` sin poner en `true`.
- **"too many connections" / "remaining connection slots are reserved"**:
  confirma que `DATABASE_SSL=true` esté puesta — sin ella, el pool no se
  achica a `1` por invocación y agota las conexiones de Supabase rápido.
- **Frontend carga pero no trae datos / CORS error en la consola del
  navegador**: `CORS_ORIGIN` en el backend no coincide exactamente con la
  URL del frontend (revisa que no le falte o sobre una `/` al final), o
  todavía no hiciste el redeploy del paso 5.
- **Login funciona pero todo da 403**: seguro el seed (paso 2) no corrió —
  vuelve a correrlo apuntando a la conexión directa de Supabase.
- **Agregaste una migración nueva y el deploy "no la ve"**: es esperado —
  a diferencia de Railway, aquí las migraciones no se corren solas.
  Repite el paso 2 (solo `migration:run`) contra Supabase.

## Después

Este deploy sigue trayendo datos de prueba (`Antros Demo Puebla`, un antro,
4 usuarios) del seed. Cuando quieras usarlo con tu operación real, o cuando
tengas el primer cliente real, avísame y lo damos de alta desde la sección
**Clientes** del panel de Super Admin en vez de con el seed.
