# Aforo — frontend

Demo mínimo para ver el backend funcionando en pantalla: login + un panel por módulo (Métricas, Reservas, Requisiciones, Personal y asistencia, Nómina). No es la app final, es para validar visualmente que el RBAC y los exports funcionan.

## Arranque local

```bash
npm install
cp .env.example .env   # ajusta VITE_API_URL si el backend no está en localhost:3000

npm run dev
```

Entra con cualquiera de los usuarios que crea `backend`'s `npm run seed` (contraseña `cambia-esta-password`):

- `jcmme18@gmail.com` — Super Admin, ve y hace todo
- `gerente.general@aforo.dev` — ve todos los antros del corporativo
- `gerente.antro@aforo.dev` — ve solo Antro Centro
- `rp@aforo.dev` — solo el panel de Reservas, solo sus propias reservas

Cada panel refleja el permiso real del backend: si el usuario no tiene acceso a una sección, la API regresa 403 y la pantalla lo muestra en vez de romperse.
