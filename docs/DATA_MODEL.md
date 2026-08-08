# Modelo de datos — AFORO

Esquema en `supabase/migrations/0001_schema.sql`. Contempla los 4 módulos desde
el inicio (CLAUDE.md §8). RLS en `0002_rls.sql`; seed de configuración en
`0003_config_seed.sql`. Toda tabla de negocio lleva `corporativo_id` para el
aislamiento multi-tenant.

## Módulo 1 — Identidad, tenancy y reservas (implementado)

- **corporativos** — el tenant. `config` (jsonb) para overrides por corporativo.
- **antros** — venue de un corporativo. Modalidades, ventana de cancelación y
  comportamiento al llenarse configurables.
- **usuarios** — extiende `auth.users`. Toda cuenta nace cliente. Verificación de
  correo y teléfono.
- **membresias** — `usuario × corporativo × antro × rol`. Separa identidad de
  rol-en-tenant; base de la autorización. Un usuario puede ser cliente y además
  tener roles de personal en uno o más corporativos.
- **eventos** — sobre los que se reserva; cupo y modalidades propios.
- **reservas** — modalidad acceso/mesa, nº de invitados, `consumo_minimo`
  (snapshot), `estado` (confirmada/lista_espera/cancelada/no_show/completada),
  `rp_id` opcional.
- **qr_codes** — un QR por invitado. `token` firmado único; `estado`
  pendiente/distribuido/usado_puerta. Identificador persistente, no boleto.
- **enlaces_reclamo** — enlace por QR; al abrirlo, el QR se marca distribuido.

## Configuración y auditoría (transversal)

- **permisos** — matriz `rol × accion` (denegación por defecto: solo filas
  permitidas). Sembrada desde CLAUDE.md §5.
- **config_parametros** — parámetros de negocio con `scope`
  global/corporativo/antro y precedencia antro > corporativo > global.
- **feature_flags** — módulos/funciones habilitados por corporativo.
- **auditoria** — actor, acción, entidad, detalle, hora, corporativo.

## Módulo 2 — Operación en piso (esquema-only)

- **mesas**, **movimientos_mesa** — catálogo de mesas e historial encadenado.
- **accesos_puerta** — log de escaneos (verde/amarillo/rojo/manual), con motivo,
  responsable y `sincronizado` para la cola offline.
- **contador_penetracion** — entradas sin reserva por día operativo.

## Módulo 3 — Inteligencia y red social (esquema-only)

- **huella_identidad**, **reputacion**, **alertas_fantasma** — motor de
  detección de fantasmas (huella, show rate/score, alertas).
- **consumo_mesa** — captura del cajero; alimenta el ranking.
- **insignias**, **usuario_insignias**, **ranking_consumo** — hitos y ranking
  semanal.

## Módulo 4 — Gestión y monetización (esquema-only)

- **incidencias** — panel Cadena (anomalías con hora y responsable).
- **invitaciones** — códigos de un solo uso (o con tope), rol/antro amarrados,
  caducidad. Escalera de invitación (CLAUDE.md §6).
- **planes**, **suscripciones**, **promociones** — monetización (Súper Admin).
- **notificaciones** — eventos al usuario (CLAUDE.md §7).

## Relaciones clave

```
corporativos 1─┬─* antros 1─* eventos 1─* reservas 1─* qr_codes 1─1 enlaces_reclamo
               └─* membresias *─1 usuarios 1─* reservas (cliente_id / rp_id)
permisos (rol × accion)        config_parametros (scope)      feature_flags (corp)
```
