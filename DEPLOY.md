# Publicar Aforo en Neon + Vercel

Guía paso a paso para tener un link real. Esta guía ya se ejecutó completa —
lo que está aquí es lo que realmente funcionó, no la teoría.

## Dónde vive hoy

- **Frontend (el link que se comparte):** https://frontend-ten-iota-72.vercel.app
- **Backend (API):** https://backend-red-eight-49.vercel.app
- **Base de datos:** Neon (`neondb`), administrada desde la pestaña Storage
  del proyecto `backend` en Vercel.

## 0. Cómo está armado

**Dos** proyectos en **Vercel** (el backend/API y el frontend), apuntando
ambos al mismo repo `jcmme/aforo` — cada uno con su propio "Root Directory"
(`backend` y `frontend`), igual que antes eran dos servicios separados en
Railway. La base de datos (**Neon**, Postgres) se crea *desde dentro* del
proyecto del backend en Vercel — no hace falta entrar a neon.com aparte,
Vercel la aprovisiona y conecta sola.

Diferencia de fondo con Railway: Vercel no corre un proceso que queda
prendido — corre **funciones serverless** que se despiertan por request.
Por eso las migraciones y el seed ya no corren solos en cada deploy: se
corren a mano desde tu máquina (paso 3).

## 1. Vercel — backend

1. Cuenta en [vercel.com](https://vercel.com) con tu GitHub.
2. **Add New → Project** → importa `jcmme/aforo`.
3. **Root Directory** → `backend`. Framework Preset: "Other" (Vercel respeta
   el `vercel.json` que ya está en `backend/` para el build y las rutas).
4. **Environment Variables**:
   - `JWT_SECRET` → un valor largo y aleatorio (`openssl rand -hex 32`)
   - `JWT_EXPIRES_IN` → `8h`
   - `CORS_ORIGIN` → la URL del frontend (se completa en el paso 5)
   - `DATABASE_SSL` → `true`
   - (`DATABASE_URL` la crea sola la integración de Neon, paso 2)
5. **Deploy**.

## 2. Crear la base de datos (Neon, desde Vercel)

1. Dentro del proyecto del backend en Vercel → menú izquierdo → **Storage**.
2. **Create Database** → **Neon** → elige la región más cercana.
3. Vercel agrega solo ~18 variables con la conexión, entre ellas
   `DATABASE_URL` (con pooler, la que usa la app) y `DATABASE_URL_UNPOOLED`
   (conexión directa, para migraciones). No hay que copiar nada a mano.
4. **Redeploy** el backend para que tome las variables nuevas (un deploy ya
   construido no las recoge solo).

## 3. Correr migraciones y el seed (desde tu máquina)

Las variables se traen con el CLI de Vercel, sin copiar secretos a mano:

```bash
cd backend
npx vercel login          # abre el navegador; responde "y" al instalar el CLI
npx vercel link           # elige el proyecto "backend"
npx vercel env pull .env.vercel --environment=production
```

Después, en `backend/.env` pon la conexión **sin pooler** (las migraciones
son DDL y necesitan conexión directa, no la del pooler):

```
DATABASE_URL=<el valor de DATABASE_URL_UNPOOLED que trajo el pull>
DATABASE_SSL=true
```

Y corre:

```bash
npm run migration:run   # crea todas las tablas
npm run seed            # roles + Super Admin (jcmme18@gmail.com / cambia-esta-password)
```

Repite **solo** `migration:run` cada vez que agregues una migración nueva,
antes de que el código que depende de esa tabla/columna llegue a producción.

## 4. Vercel — frontend

1. **Add New → Project** → mismo repo `jcmme/aforo`.
2. **Root Directory** → `frontend` (Vercel detecta "Vite" solo).
3. **Environment Variables** → `VITE_API_URL` → la URL del backend.
4. **Deploy**. Ojo: Vite hornea esa URL en el bundle **al compilar**, así que
   si la cambias después hay que hacer redeploy, no basta con guardarla.

## 5. Cerrar el círculo: restringir CORS

1. En el proyecto del **backend** → **Environment Variables** → `CORS_ORIGIN`
   = la URL del frontend (sin `/` al final).
2. **Redeploy** del backend.

Con eso, el backend solo acepta peticiones desde el frontend (cualquier otro
origen queda bloqueado — ya verificado).

## 6. Entrar

Abre https://frontend-ten-iota-72.vercel.app y entra con:

- **jcmme18@gmail.com** / **cambia-esta-password** (Super Admin)

Cambia esa contraseña desde Configuración antes de compartir el link.

## Dos trampas que ya nos costaron horas

Ambas ya están resueltas en el código, pero vale saber por qué existen:

1. **`channel_binding=require` en la URL de Neon.** Neon lo agrega por
   default; el driver de Postgres de Node (`pg`) no lo soporta y, en vez de
   fallar rápido, **se cuelga** hasta que Vercel mata la función a los 300s.
   Se limpia en código (`backend/src/database/database-url.util.ts`), no en
   el dashboard — porque la variable la administra la integración de Neon y
   Vercel no deja editar su valor a mano.

2. **El adaptador serverless.** Vercel invoca la función con `(req, res)` de
   Node, no con `(event, context)` de AWS Lambda. Usar un adaptador estilo
   Lambda hace que **ninguna** ruta responda nunca (cuelgue de 300s en todas).
   `backend/api/index.ts` le pasa la app de Express directo, que ya es un
   request listener con esa firma.

## Si algo no arranca

- **Todo se cuelga y termina en 504 / "FUNCTION_INVOCATION_TIMEOUT"**: revisa
  las dos trampas de arriba, y que `DATABASE_SSL=true` esté puesta.
- **Login funciona pero todo da 403**: no corrió el seed (paso 3).
- **Frontend carga pero no trae datos / error de CORS en la consola**:
  `CORS_ORIGIN` no coincide exacto con la URL del frontend, o falta el
  redeploy del backend.
- **El frontend le pega a la URL vieja del API**: `VITE_API_URL` se hornea en
  el build — hay que redesplegar el frontend, no solo guardar la variable.
- **Agregaste una migración y el deploy "no la ve"**: es esperado, aquí no se
  corren solas. Repite `migration:run` del paso 3.

## Después

Este deploy trae los datos de prueba del seed (`Antros Demo Puebla`, un
antro, 4 usuarios). Cuando llegue el primer cliente real, se da de alta desde
la sección **Clientes** del panel de Super Admin, no con el seed.
