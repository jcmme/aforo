# Aforo — backend

Control interno corporativo para el grupo de antros (Puebla). Ver `/docs` de la conversación de arquitectura para el detalle de diseño; esto es la implementación del esqueleto: `core/rbac` + `core/tenancy` + migración inicial + `core/export` + `core/module-registry`, con `modules/reservas` como primer módulo de negocio de referencia.

## Requisitos

- Node.js 20+
- PostgreSQL 14+

## Arranque local

```bash
npm install
cp .env.example .env   # ajusta DATABASE_URL y JWT_SECRET

npm run migration:run  # crea el esquema
npm run seed            # roles base + corporativo/antro/usuarios de desarrollo

npm run start:dev
```

El seed imprime los usuarios de prueba que crea (contraseña `cambia-esta-password` para todos):

- `gerente.general@aforo.dev` — alcance corporativo, ve todos los antros
- `gerente.antro@aforo.dev` — alcance antro, ve solo Antro Centro
- `rp@aforo.dev` — alcance propio, solo ve sus propias reservas

## Probar el flujo

```bash
# 1. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rp@aforo.dev","password":"cambia-esta-password"}'

# 2. Crear una reserva (usar el accessToken de arriba y el id de "Antro Centro")
curl -X POST http://localhost:3000/reservas \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token>" \
  -d '{"antroId":"<antro-id>","clienteNombre":"Juan Perez","fechaEvento":"2026-08-15","numPersonas":4}'

# 3. Exportar el reporte "reservas por RP" en PDF (con el token de un gerente)
curl -X POST http://localhost:3000/reportes/exportar \
  -H "Content-Type: application/json" -H "Authorization: Bearer <token-gerente>" \
  -d '{"plantillaCodigo":"reservas.export_rp"}' -o reservas.pdf
```

## Agregar un módulo nuevo

1. Crear `src/modules/<nombre>/` siguiendo la forma de `modules/reservas`.
2. Declarar sus permisos y (si aplica) sus plantillas de reporte en `<nombre>.module-definition.ts`.
3. En `<nombre>.module.ts`, registrar la definición en `ModuleRegistryService.register(...)` dentro de `onModuleInit`.
4. Agregar el módulo al `imports` de `AppModule`.

No hace falta tocar nada dentro de `core/` — el catálogo de permisos se sincroniza solo la próxima vez que arranque la app o corra `npm run seed`.
