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
2. En el **SQL Editor**, aplica el esquema completo. Dos opciones:
   - **Rápida:** pega y ejecuta `supabase/setup_completo.sql` (las 14
     migraciones en orden, en un solo archivo).
   - **Manual:** ejecuta en orden `supabase/migrations/0001_schema.sql` …
     `0014_reportes_contenido.sql`.

   Luego, para datos demo, ejecuta `supabase/seed.sql`. Verifica el aislamiento
   con `supabase/tests/rls_aislamiento.sql`.
3. Despliega las Edge Functions y su secreto:
   ```bash
   supabase functions deploy \
     crear-reserva cancelar-reserva reclamar-qr \
     validar-puerta acceso-manual mover-mesa escanear-mesa acuse-promo \
     contador-penetracion capturar-consumo recalcular-fantasmas \
     generar-invitacion revocar-invitacion reclamar-invitacion \
     editar-parametro crear-promocion gestion-minimo \
     editar-tyc-antro aprobar-tyc crear-resena eliminar-cuenta \
     subir-foto-antro moderar-foto-antro reportar-resena
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
| 2 | Operación en piso | **Hecho** — cadenero (2 botones), escaneo de puerta verde/amarillo/rojo + acceso manual (6 motivos), contador de penetración, hostess (asignar/mover mesa con historial), capitán (escaneo de mesa, acuse de promo, consumo mínimo). Navegación por rol + selector demo. |
| 3 | Red social + perfil del staff + motor de fantasmas | **Hecho** — menú de tarjetas por rol; vista del cajero (captura de consumo + C. Mínimos); feed, ranking semanal e insignias; perfil del RP; motor de detección de fantasmas (huella, score, alertas, acciones graduadas). |
| 4 | Paneles de gestión + Súper Admin | **Hecho** — panel del gerente (métricas + penetración, antro/consolidado); panel Cadena (incidencias); DATOS EXTRAÍBLES (7 reportes, formato + rango, vista previa/CSV); gestión de invitaciones (escalera, generar/revocar/reclamar); panel de Súper Admin (parámetros sin código, promociones, corporativos + feature flags + suspender, planes, salud del producto, auditoría, switches de notificaciones). |
| 5 | Ronda de pulido (post-4 secciones) | **Hecho** — capitán registra reservas de invitados sin cuenta (nombre + teléfono, link de reclamo con QR real + compartir por WhatsApp + invitación a crear cuenta); métricas/insignias de capitán generalizadas desde RP con metas por rol; reseñas del antro (estrellas + foto); T&C en 3 niveles (app/corporativo/antro) con responsable designado por antro, aprobación de Súper Admin y corte semanal (martes 12:00); feed social persistido con comentarios y reacciones, formato tipo timeline. |
| 6 | Preparación para tiendas | **En curso** — borrado de cuenta dentro de la app (App Store 5.1.1(v) / LFPDPPP) con Edge Function `eliminar-cuenta`; permisos declarados (cámara, galería); `eas.json` y config de builds nativos; guía completa de publicación en [`docs/TIENDAS.md`](docs/TIENDAS.md). Pendiente: backend de producción, cuentas de desarrollador (trámites de MABI). |
| 7 | Rediseño "Platino" + espacio de promociones | **Hecho** — identidad visual monocroma tipo guía Michelin: negro profundo, acento crema/platino (adiós dorado), divisores hairline. Tipografía **unificada** en una sola familia (Jost) con jerarquía por peso — delgada y elegante, sin mezclas. Espacio de promociones del cliente (escaparate neutral, no pertenece a nadie): destacada en grande + lista editorial, cada una lleva a su antro; base lista para las globales de miembros. |
| 8 | Galería de fotos por antro (con moderación) | **Hecho** — cada antro puede tener varias fotos; el cliente las desliza fluidamente (galería paginada 3:2 con puntos y contador). Las suben los antros (gerente) y las **aprueba el Súper Admin** antes de mostrarse (cola en "Aprobar fotos"). Formato estándar 3:2 (1620×1080). Backend: tabla `fotos_antro` con RLS (público solo ve aprobadas) + Edge Functions `subir-foto-antro` (valida pertenencia al corporativo) y `moderar-foto-antro`. |
| 9 | Privacidad en la app + aviso integral | **Hecho** — pantalla de bienvenida/consentimiento (transparente: sin publicidad ni rastreo, huella solo para fraude); "Políticas y privacidad" y "Ajustes de privacidad" (finalidades, promociones opcionales, revocación) — cumple App Review §5.1.1(ii). Aviso de privacidad **integral** para el abogado en [`docs/legal/`](docs/legal/) con anexo que mapea cada requisito de Apple §5.1, Google Data Safety y LFPDPPP a su sección. |
| 10 | Endurecimiento de seguridad (aislamiento multi-tenant) | **Hecho** — se cierra la brecha por la que un rol autorizaba acciones en un corporativo ajeno: toda Edge Function valida ahora **dos ejes** (matriz de permisos + pertenencia al tenant, `verificarTenant`). Códigos de invitación con **CSPRNG** (no `Math.random`) + **bloqueo por fuerza bruta** (tabla `intentos_codigo`). RLS endurecido: sin escritura directa de reservas/QR (todo por función), escritura de antros/eventos solo con permiso de gestión, **trigger** que impide auto-marcarse verificado, y lectura de reputación acotada al corporativo. **Aislamiento probado** (`npm test`): batería con dos corporativos sobre la misma lógica que corre en producción, más una prueba RLS para Supabase. Detalle en [`docs/SEGURIDAD.md`](docs/SEGURIDAD.md). |
| 11 | Verificación de cuenta solo por correo | **Hecho** — se retira el requisito de verificar teléfono (CLAUDE.md §3 actualizado); el teléfono se sigue capturando como dato de contacto/antifraude, pero deja de bloquear la cuenta. Se cierra además un hueco real: nada dejaba `email_verificado` en `true`. Ahora dos triggers sobre `auth.users` (migración `0012_verificacion_email.sql`) crean la fila de `usuarios` en cuanto Auth registra al usuario (ya no depende de tener sesión) y la marcan verificada al confirmar el correo. Pantalla "Revisa tu correo" con reenvío de confirmación (`app/(auth)/verificar.tsx`). |
| 12 | Legal dentro de la app + reporte de contenido + búsqueda | **Hecho** — Términos y Aviso de Privacidad (versión del abogado, ago. 2026) ahora se leen COMPLETOS dentro de la app (`app/legal/terminos.tsx`, `app/legal/aviso.tsx`, componente `DocumentoLegal`), no solo como enlace externo; texto editable sin publicar actualización (`config_parametros`, migración `0013_legal_textos.sql`). Aún con placeholders `[correo]`/`[proveedor]` pendientes de MABI, y la Sección 7 del T&C (política de inasistencias) pendiente de que el abogado confirme la redacción alineada al score real. Botón **"Reportar"** en cada reseña (`app/resena/reportar/[resenaId].tsx`, función `reportar-resena`, motivos configurables) que escala al panel Cadena. Buscador + filtro por zona en la pantalla principal (`app/(cliente)/index.tsx`), sin geolocalización todavía. |

## Scripts

| Comando | Qué hace |
|---|---|
| `npm start` | Servidor de desarrollo de Expo. |
| `npm run ios` / `android` / `web` | Abre en cada plataforma. |
| `npm run typecheck` | Revisa tipos con TypeScript. |
| `npm test` | Pruebas de aislamiento multi-tenant y matriz de permisos (Node 22+, sin dependencias). |
