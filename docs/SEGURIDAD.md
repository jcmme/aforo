# Seguridad de AFORO — endurecimiento y modelo de aislamiento

Este documento resume el modelo de seguridad tras la ronda de endurecimiento
(migración `0011_seguridad.sql` + Edge Functions). El principio rector es el de
`CLAUDE.md` §2 y §3: **aislamiento multi-tenant estricto** y **denegación por
defecto**. Nada se autoriza solo desde el cliente.

## Los dos ejes de toda acción sensible

Cada Edge Function que toca datos de un tenant valida **dos cosas
independientes** antes de actuar. Una sola no basta:

1. **Matriz de permisos** (`puedeAccion`) — ¿este *rol* puede ejecutar esta
   acción? Se lee de la tabla `permisos` (solo existen filas permitidas ⇒
   denegación por defecto).
2. **Pertenencia al tenant** (`verificarTenant`) — ¿este *usuario* pertenece al
   corporativo/antro sobre el que actúa? Ser "cadenero" no basta: hay que ser
   cadenero **de ese antro**.

El hueco que se cerró: antes `puedeAccion` respondía "¿tiene el rol X en
*algún* lugar?". Un gerente del corporativo A pasaba el filtro para actuar
sobre el corporativo B. Ahora la matriz se evalúa **acotada al corporativo
objetivo**, y además se exige pertenencia explícita.

### Alcance de los roles

- **Super Admin (MABI)** es transversal: pertenece a todos los tenants por
  diseño (alta de corporativos, promociones, soporte).
- **Roles de alcance corporativo** (dueño, socio, gerente general): cubren
  cualquier antro de **su** corporativo.
- **Roles atados a un antro** (cadenero, hostess, capitán, cajero, gerente
  individual, RP): solo alcanzan el antro de su membresía.

## Qué se endureció

### Edge Functions (servidor de confianza)

- `verificarTenant()` nuevo en `_shared/auth.ts`; `puedeAccion()` acepta un
  alcance de tenant opcional y evalúa la matriz solo con los roles vigentes en
  ese corporativo/antro.
- Se añadió la validación de tenant a todas las funciones operativas y de
  gestión que reciben un antro/reserva: `validar-puerta`, `acceso-manual`,
  `escanear-mesa`, `mover-mesa`, `gestion-minimo`, `capturar-consumo`,
  `acuse-promo`, `contador-penetracion`, `generar-invitacion`,
  `revocar-invitacion`, y la rama de invitado de `crear-reserva`.
- **Invitaciones**: el código pasó de `Math.random` a **CSPRNG**
  (`crypto.getRandomValues`, base32 sin caracteres ambiguos, ~64 bits). El
  corporativo/antro objetivo se valida contra la membresía del invitador (no se
  puede invitar a un corporativo ajeno) y la **escalera** se evalúa con los
  roles que el invitador tiene **en ese** corporativo.
- **Fuerza bruta de códigos**: `reclamar-invitacion` registra intentos en
  `intentos_codigo` y **bloquea temporalmente** tras N fallos (config
  `invitacion_intentos_max` = 3, `invitacion_bloqueo_minutos` = 15, editables).
  Se corrigió además un bug por el que un fallo silencioso de alta de membresía
  devolvía éxito.

### Base de datos (RLS — última línea de defensa)

- **Reservas y QR**: se eliminó la escritura directa del cliente. Toda
  creación/transición pasa por Edge Function (service_role); ya no se puede,
  por la API, insertar una reserva "completada" a mano o alterar un QR.
- **Antros y eventos**: la escritura dejó de estar abierta a cualquier miembro
  del corporativo; exige permiso de gestión (gerente+ o super admin) y, siempre,
  el mismo corporativo.
- **Verificación de correo/teléfono**: un trigger impide que el usuario se
  marque a sí mismo como verificado; solo el servidor puede ponerlo en `true`
  tras una verificación real.
- **Reputación**: la lectura por panel (gerente+) quedó acotada a usuarios
  relevantes para su corporativo (con reserva o membresía ahí), cerrando una
  fuga transversal.

### QR

- Token **firmado** con HMAC-SHA256 (secreto `AFORO_QR_SECRET`, solo en el
  servidor) y verificado con comparación de **tiempo constante**. No es
  adivinable ni secuencial.

## Pendientes conocidos (para la fase de producción con datos reales)

- **Verificación real de teléfono**: hoy el teléfono se captura, no se
  verifica (SMS quedó fuera de alcance por decisión de producto). El trigger ya
  impide el auto-marcado, pero el flujo de verificación server-side debe
  implementarse cuando exista proveedor. Mientras tanto, el dato es "declarado".
- **Sincronizar `email_verificado`** desde el estado real de Supabase Auth
  (`email_confirmed_at`) mediante un proceso server-side.
- **`resenas_antro` / `tyc_antro`** son de lectura pública (reseñas y T&C se
  muestran a cualquier cliente). No hay dato secreto de tenant, pero conviene
  exponerlos por una **vista** que omita identificadores internos
  (`cliente_id`, borradores `texto_pendiente`) — minimización de datos.
- **Pruebas automatizadas de aislamiento**: falta una batería que verifique,
  con usuarios de dos corporativos, que ninguno alcanza datos del otro
  (CLAUDE.md pide el aislamiento "probado explícitamente").
- **Rate limiting a nivel de gateway** (además del de códigos) para login y
  endpoints sensibles, y **respaldos automáticos** con restauración probada.

> El sistema que maneje datos reales y dinero debe ser revisado por un
> desarrollador backend/seguridad antes de producción (CLAUDE.md §3).
