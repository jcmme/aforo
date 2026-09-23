# Publicar Aforo en Neon + Vercel

Guía paso a paso para tener un link real. Son ~30-40 minutos, casi todo dando
clic en interfaces web.

## 0. Qué vas a crear

**Dos** proyectos en **Vercel** (el backend/API y el frontend), apuntando
ambos al mismo repo `jcmme/aforo` — cada uno con su propio "Root Directory"
(`backend` y `frontend`), igual que antes eran dos servicios separados en
Railway. La base de datos (**Neon**, Postgres) se crea *desde dentro* del
proyecto del backend en Vercel — no hace falta entrar a neon.com aparte,
Vercel la aprovisiona y conecta sola.

Diferencia de fondo con Railway: Vercel no corre un proceso que queda
prendido — corre **funciones serverless** que se despiertan por request.
Por eso las migraciones y el seed ya no corren solos en cada deploy: se
corren a mano, una vez, desde tu máquina (paso 3).

## 1. Vercel — backend

1. Cuenta en [vercel.com](https://vercel.com) con tu GitHub.
2. **Add New → Project** → importa `jcmme/aforo`.
3. **Root Directory** → `backend`. Framework Preset: "Other" (Vercel debería
   respetar el `vercel.json` que ya está en `backend/` para el build y las
   rutas).
4. **Environment Variables**, antes de desplegar:
   - `JWT_SECRET` → un valor largo y aleatorio (corre `openssl rand -hex 32`
     en tu terminal y pega el resultado)
   - `JWT_EXPIRES_IN` → `8h`
   - `CORS_ORIGIN` → déjala vacía por ahora, la completas en el paso 5
   - (`DATABASE_URL` y `DATABASE_SSL` los agregas en el paso 2, todavía no)
5. **Deploy**. Va a fallar al conectar a la base (todavía no existe) —
   normal, lo arreglamos ahora. Copia la URL que te dio (ej.
   `https://aforo-backend.vercel.app`), la necesitas en el paso 4.

## 2. Crear la base de datos (Neon, desde Vercel)

1. Dentro del proyecto del backend en Vercel → pestaña **Storage**.
2. **Create Database** → **Neon** (aparece como "Neon Postgres" en el
   marketplace de integraciones) → sigue el asistente, elige la región más
   cercana.
3. Al conectarla, Vercel agrega solo las variables de entorno con la
   conexión a tu proyecto del backend — no las escribes tú. Ve a
   **Settings → Environment Variables** y busca cuáles quedaron: debería
   haber una que apunte a Postgres (normalmente `DATABASE_URL`) y otra sin
   pooling para trabajo administrativo (algo como `DATABASE_URL_UNPOOLED`
   o `..._NO_SSL` / `..._UNPOOLED` — el nombre exacto lo confirmas ahí).
   Si ninguna se llama literalmente `DATABASE_URL`, renombra o duplica la
   que sí es Postgres a ese nombre — el código la busca así.
4. Agrega manualmente (Neon ya exige SSL en la URL, pero esta variable
   también controla el tamaño del pool de conexiones, así que ponla igual):
   - `DATABASE_SSL` → `true`
5. **Redeploy** el backend (Deployments → los tres puntos del último →
   Redeploy) para que tome las variables nuevas.

## 3. Correr migraciones y el seed (una sola vez, desde tu máquina)

La forma más segura de tener exactamente las mismas variables que usa
Vercel (sin copiarlas a mano y arriesgarte a un typo) es traerlas con su
propio CLI:

1. `cd backend && npx vercel login` (una vez).
2. `npx vercel link` → selecciona el proyecto del backend que ya creaste.
3. `npx vercel env pull .env.vercel` → descarga un archivo con las
   variables reales de Vercel (incluida la conexión de Neon).
4. Abre `.env.vercel`, copia el valor de la variable de conexión **sin
   pooling** (la del paso 2.3, ej. `DATABASE_URL_UNPOOLED`) y pégalo como
   `DATABASE_URL` en un `backend/.env` nuevo — junto con `DATABASE_SSL=true`.
   Las migraciones (DDL) necesitan la conexión directa, no la que usa
   pooler.
5. `npm run migration:run` — crea todas las tablas.
6. `npm run seed` — crea los roles y el Super Admin
   (`jcmme18@gmail.com` / `cambia-esta-password`).
7. Borra `.env.vercel` y `backend/.env` cuando termines (ya están en
   `.gitignore`, pero mejor no dejarlos sueltos). Repites este paso (solo
   `migration:run`, sin el seed) cada vez que agregues una migración nueva
   en el futuro, antes de que el código que depende de esa tabla/columna
   llegue a producción.

## 4. Vercel — frontend

1. Otra vez **Add New → Project** → mismo repo `jcmme/aforo`.
2. **Root Directory** → `frontend`. Vercel debería detectar "Vite" solo
   como framework preset.
3. **Environment Variables** → `VITE_API_URL` → la URL del backend del
   paso 1.
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
  proyecto backend en Vercel — casi siempre es que la variable de conexión
  de Neon no se llama exactamente `DATABASE_URL`, o falta `DATABASE_SSL=true`.
- **"too many connections"**: confirma que `DATABASE_SSL=true` esté
  puesta — sin ella, el pool no se achica a `1` por invocación.
- **Frontend carga pero no trae datos / CORS error en la consola del
  navegador**: `CORS_ORIGIN` en el backend no coincide exactamente con la
  URL del frontend (revisa que no le falte o sobre una `/` al final), o
  todavía no hiciste el redeploy del paso 5.
- **Login funciona pero todo da 403**: seguro el seed (paso 3) no corrió —
  vuelve a correrlo.
- **Agregaste una migración nueva y el deploy "no la ve"**: es esperado —
  a diferencia de Railway, aquí las migraciones no se corren solas.
  Repite el paso 3 (solo `migration:run`).

## Después

Este deploy sigue trayendo datos de prueba (`Antros Demo Puebla`, un antro,
4 usuarios) del seed. Cuando quieras usarlo con tu operación real, o cuando
tengas el primer cliente real, avísame y lo damos de alta desde la sección
**Clientes** del panel de Super Admin en vez de con el seed.
