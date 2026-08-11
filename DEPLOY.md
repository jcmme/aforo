# Publicar Aforo en Railway

Guía paso a paso para que quede en un link real, no solo corriendo en local. Son ~15 minutos, casi todo dando clic en la interfaz de Railway.

## 0. Qué vas a crear

Un proyecto en Railway con **3 piezas**: la base de datos (Postgres), el backend (API) y el frontend (lo que se ve en el navegador). Railway construye cada una a partir de los `Dockerfile` que ya están en `backend/` y `frontend/` — no tienes que escribir nada, solo conectar las piezas.

## 1. Crear cuenta

Entra a [railway.app](https://railway.app) y regístrate con tu cuenta de GitHub (la misma donde está `jcmme/aforo`). El plan de prueba no pide tarjeta para empezar.

## 2. Crear el proyecto y conectar el repo

1. **New Project** → **Deploy from GitHub repo**
2. Autoriza a Railway a leer tus repos si te lo pide, y selecciona `jcmme/aforo`
3. Railway va a crear un primer servicio automáticamente — lo vamos a configurar como el backend en el siguiente paso

## 3. Configurar el servicio del backend

1. Entra al servicio que se creó → pestaña **Settings**
2. En **Root Directory** pon `backend`
3. Railway debería detectar el `Dockerfile` solo (dice "Dockerfile" como método de build). Si no, en **Build** elige Dockerfile manualmente
4. Ve a la pestaña **Variables** y agrega:
   - `JWT_SECRET` → cualquier texto largo y aleatorio (por ejemplo, corre `openssl rand -hex 32` en tu terminal y pega el resultado)
   - `JWT_EXPIRES_IN` → `8h`
   - `DATABASE_URL` → lo agregamos en el paso 5, todavía no lo pongas
5. Ve a **Settings → Networking** → **Generate Domain**. Te va a dar una URL tipo `https://aforo-backend-production.up.railway.app` — **cópiala**, la necesitas en el paso 6

## 4. Agregar la base de datos

1. En el proyecto (no dentro del servicio), botón **+ New** → **Database** → **Add PostgreSQL**
2. Railway crea el servicio de Postgres solo, sin que tengas que configurar nada

## 5. Conectar el backend con la base de datos

1. Vuelve al servicio del **backend** → **Variables**
2. Agrega `DATABASE_URL` y, en vez de escribir un valor, usa la referencia a la base de datos: Railway te deja escribir `${{Postgres.DATABASE_URL}}` (o seleccionarlo del menú de variables de referencia si te lo ofrece)
3. Guarda — esto va a disparar un redeploy del backend automáticamente. Ese primer arranque corre las migraciones y siembra los usuarios de prueba solo (revisa los **Deploy Logs** del backend, deberías ver `Listo. Datos de desarrollo sembrados.`)

## 6. Crear el servicio del frontend

1. En el proyecto, **+ New** → **GitHub Repo** → selecciona otra vez `jcmme/aforo` (Railway permite dos servicios del mismo repo)
2. **Settings → Root Directory** → `frontend`
3. **Settings → Build** → agrega una **Build Variable** (no la pongas en "Variables" normales, tiene que ser variable de *build*):
   - `VITE_API_URL` → la URL del backend que copiaste en el paso 3 (ej. `https://aforo-backend-production.up.railway.app`)
4. **Settings → Networking** → **Generate Domain** → esta es la URL final, la que vas a abrir en el navegador

## 7. Entrar

Abre la URL del frontend. Entra con:

- **jcmme18@gmail.com** / **cambia-esta-password** (Super Admin — ve y hace todo)

Cambia esa contraseña antes de compartir el link con nadie más — ahora mismo cualquiera que la sepa puede entrar como Super Admin.

## Si algo no arranca

- **Backend en rojo / no conecta a la base**: revisa que `DATABASE_URL` esté puesta como referencia (`${{Postgres.DATABASE_URL}}`), no como texto suelto.
- **Frontend carga pero no trae datos**: casi siempre es que `VITE_API_URL` quedó mal o se puso en el lugar equivocado (tiene que ser *Build Variable*, no variable normal — se hornea en el bundle al compilar, no se lee en tiempo de ejecución).
- **Login funciona pero todo da 403**: revisa en los logs del backend que haya corrido el seed (`Listo. Datos de desarrollo sembrados.`) — si Railway cachea el build y no vuelve a correr el `CMD`, fuerza un redeploy manual.

## Después

Este deploy corre con datos de prueba (`Antros Demo Puebla`, un antro, 4 usuarios). Cuando quieras usarlo con tu operación real, avísame y quitamos el seed automático del arranque para no repoblar datos de prueba en cada deploy.
