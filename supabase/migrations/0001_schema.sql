-- AFORO · Esquema base (contempla los 4 módulos, CLAUDE.md §8)
-- En la Sección 1 solo se usa el subconjunto de identidad/tenancy + reservas;
-- el resto de tablas se crean para no rehacer la base después.
-- Ejecutar en el SQL Editor de Supabase o vía `supabase db push`.

create extension if not exists pgcrypto;   -- gen_random_uuid, cifrado de campos
create extension if not exists postgis;    -- geo de antros (cercanía a futuro)

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin create type rol as enum (
  'dueno','socio','gerente_general','gerente','capitan','hostess','rp',
  'cadenero','cajero','super_admin','cliente'
); exception when duplicate_object then null; end $$;

do $$ begin create type subtipo_capitan as enum ('operativo','social');
exception when duplicate_object then null; end $$;

do $$ begin create type modalidad_reserva as enum ('acceso','mesa');
exception when duplicate_object then null; end $$;

do $$ begin create type estado_reserva as enum
  ('confirmada','lista_espera','cancelada','no_show','completada');
exception when duplicate_object then null; end $$;

do $$ begin create type estado_qr as enum ('pendiente','distribuido','usado_puerta');
exception when duplicate_object then null; end $$;

do $$ begin create type comportamiento_lleno as enum ('cerrar','lista_espera');
exception when duplicate_object then null; end $$;

do $$ begin create type resultado_acceso as enum ('verde','amarillo','rojo','manual');
exception when duplicate_object then null; end $$;

-- ===========================================================================
-- MÓDULO 1 · Identidad, tenancy y reservas
-- ===========================================================================

create table if not exists corporativos (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  plan       text,
  config     jsonb not null default '{}',
  creado_en  timestamptz not null default now()
);

create table if not exists antros (
  id                   uuid primary key default gen_random_uuid(),
  corporativo_id       uuid not null references corporativos(id) on delete cascade,
  nombre               text not null,
  descripcion          text,
  zona                 text not null default '',
  direccion            text not null default '',
  lat                  double precision,
  lng                  double precision,
  horario              text not null default '',
  fotos                text[] not null default '{}',
  modalidades          modalidad_reserva[] not null default '{acceso}',
  ventana_cancelacion  text not null default '18:00',
  al_llenar            comportamiento_lleno not null default 'cerrar',
  creado_en            timestamptz not null default now()
);
create index if not exists antros_corporativo_idx on antros(corporativo_id);

-- Perfil de usuario. Extiende auth.users. Toda cuenta nace como cliente.
create table if not exists usuarios (
  id                   uuid primary key references auth.users(id) on delete cascade,
  nombre               text not null,
  username             text unique,
  email                text not null,
  telefono             text,
  email_verificado     boolean not null default false,
  telefono_verificado  boolean not null default false,
  creado_en            timestamptz not null default now()
);

-- Membresía: vincula usuario ↔ rol dentro de un corporativo (y opcional antro).
-- Es la base del aislamiento y la autorización multi-tenant.
create table if not exists membresias (
  id               uuid primary key default gen_random_uuid(),
  usuario_id       uuid not null references usuarios(id) on delete cascade,
  corporativo_id   uuid not null references corporativos(id) on delete cascade,
  antro_id         uuid references antros(id) on delete cascade,
  rol              rol not null,
  subtipo_capitan  subtipo_capitan,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  unique (usuario_id, corporativo_id, antro_id, rol)
);
create index if not exists membresias_usuario_idx on membresias(usuario_id);
create index if not exists membresias_corporativo_idx on membresias(corporativo_id);

create table if not exists eventos (
  id              uuid primary key default gen_random_uuid(),
  antro_id        uuid not null references antros(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  nombre          text not null,
  descripcion     text,
  fecha           timestamptz not null,
  fotos           text[] not null default '{}',
  cupo_maximo     integer not null default 0,
  modalidades     modalidad_reserva[] not null default '{acceso}',
  al_llenar       comportamiento_lleno not null default 'cerrar',
  creado_en       timestamptz not null default now()
);
create index if not exists eventos_antro_idx on eventos(antro_id);

create table if not exists reservas (
  id              uuid primary key default gen_random_uuid(),
  evento_id       uuid not null references eventos(id) on delete cascade,
  antro_id        uuid not null references antros(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  cliente_id      uuid not null references usuarios(id) on delete cascade,
  rp_id           uuid references usuarios(id) on delete set null,
  modalidad       modalidad_reserva not null,
  num_invitados   integer not null check (num_invitados > 0),
  mesa_texto      text,
  consumo_minimo  integer,
  estado          estado_reserva not null default 'confirmada',
  creada_en       timestamptz not null default now(),
  cancelada_en    timestamptz
);
create index if not exists reservas_cliente_idx on reservas(cliente_id);
create index if not exists reservas_evento_idx on reservas(evento_id);
create index if not exists reservas_corporativo_idx on reservas(corporativo_id);

-- QR por invitado. Identificador persistente y firmado, no boleto de un solo uso.
create table if not exists qr_codes (
  id              uuid primary key default gen_random_uuid(),
  reserva_id      uuid not null references reservas(id) on delete cascade,
  antro_id        uuid not null references antros(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  token           text not null unique,
  estado          estado_qr not null default 'pendiente',
  distribuido_en  timestamptz,
  usado_en        timestamptz,
  creado_en       timestamptz not null default now()
);
create index if not exists qr_codes_reserva_idx on qr_codes(reserva_id);

-- Enlace de reclamo del RP/cliente: al abrirlo, el QR pasa a "distribuido".
create table if not exists enlaces_reclamo (
  id          uuid primary key default gen_random_uuid(),
  qr_id       uuid not null references qr_codes(id) on delete cascade,
  token       text not null unique,
  reclamado   boolean not null default false,
  reclamado_en timestamptz,
  creado_en   timestamptz not null default now()
);

-- ===========================================================================
-- Configuración sin código y auditoría (transversal, CLAUDE.md §2 y §3)
-- ===========================================================================

-- Matriz de permisos: denegación por defecto (solo filas permitidas existen).
create table if not exists permisos (
  rol        rol not null,
  accion     text not null,
  permitido  boolean not null default true,
  primary key (rol, accion)
);

-- Parámetros de negocio editables. Precedencia: antro > corporativo > global.
create table if not exists config_parametros (
  id              uuid primary key default gen_random_uuid(),
  scope           text not null check (scope in ('global','corporativo','antro')),
  corporativo_id  uuid references corporativos(id) on delete cascade,
  antro_id        uuid references antros(id) on delete cascade,
  clave           text not null,
  valor           jsonb not null,
  descripcion     text
);
create unique index if not exists config_unica
  on config_parametros(scope, coalesce(corporativo_id, '00000000-0000-0000-0000-000000000000'),
                       coalesce(antro_id, '00000000-0000-0000-0000-000000000000'), clave);

create table if not exists feature_flags (
  id              uuid primary key default gen_random_uuid(),
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  clave           text not null,
  habilitado      boolean not null default false,
  unique (corporativo_id, clave)
);

create table if not exists auditoria (
  id              uuid primary key default gen_random_uuid(),
  actor_id        uuid references usuarios(id) on delete set null,
  corporativo_id  uuid references corporativos(id) on delete set null,
  accion          text not null,
  entidad         text,
  entidad_id      text,
  detalle         jsonb,
  creado_en       timestamptz not null default now()
);
create index if not exists auditoria_corporativo_idx on auditoria(corporativo_id);

-- ===========================================================================
-- MÓDULO 2 · Operación en piso (esquema-only; lógica en Sección 2)
-- ===========================================================================

create table if not exists mesas (
  id              uuid primary key default gen_random_uuid(),
  antro_id        uuid not null references antros(id) on delete cascade,
  nombre          text not null,
  exclusividad    integer not null default 0,
  consumo_minimo  integer not null default 0,
  activa          boolean not null default true
);

create table if not exists movimientos_mesa (
  id             uuid primary key default gen_random_uuid(),
  reserva_id     uuid not null references reservas(id) on delete cascade,
  mesa_anterior  text,
  mesa_nueva     text not null,
  responsable_id uuid references usuarios(id) on delete set null,
  creado_en      timestamptz not null default now()
);

create table if not exists accesos_puerta (
  id              uuid primary key default gen_random_uuid(),
  qr_id           uuid references qr_codes(id) on delete set null,
  reserva_id      uuid references reservas(id) on delete set null,
  antro_id        uuid not null references antros(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  resultado       resultado_acceso not null,
  motivo          text,
  nota            text,
  responsable_id  uuid references usuarios(id) on delete set null,
  ocurrido_en     timestamptz not null default now(),
  sincronizado    boolean not null default true
);
create index if not exists accesos_antro_idx on accesos_puerta(antro_id);

create table if not exists contador_penetracion (
  id              uuid primary key default gen_random_uuid(),
  antro_id        uuid not null references antros(id) on delete cascade,
  fecha_operativa date not null,
  sin_reserva     integer not null default 0,
  responsable_id  uuid references usuarios(id) on delete set null,
  unique (antro_id, fecha_operativa)
);

-- ===========================================================================
-- MÓDULO 3 · Inteligencia, red social y staff (esquema-only)
-- ===========================================================================

create table if not exists huella_identidad (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid references usuarios(id) on delete cascade,
  telefono_normalizado text,
  device_ids          text[] not null default '{}',
  creado_en           timestamptz not null default now()
);

create table if not exists reputacion (
  usuario_id   uuid primary key references usuarios(id) on delete cascade,
  show_rate    numeric not null default 1,
  score        numeric not null default 100,
  actualizado  timestamptz not null default now()
);

create table if not exists alertas_fantasma (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid references usuarios(id) on delete cascade,
  corporativo_id  uuid references corporativos(id) on delete cascade,
  tipo            text not null,
  detalle         jsonb,
  creado_en       timestamptz not null default now()
);

create table if not exists consumo_mesa (
  id              uuid primary key default gen_random_uuid(),
  reserva_id      uuid not null references reservas(id) on delete cascade,
  antro_id        uuid not null references antros(id) on delete cascade,
  monto           integer not null,
  capturado_por   uuid references usuarios(id) on delete set null,
  creado_en       timestamptz not null default now()
);

create table if not exists insignias (
  id           uuid primary key default gen_random_uuid(),
  clave        text not null unique,
  nombre       text not null,
  descripcion  text,
  config       jsonb not null default '{}'
);

create table if not exists usuario_insignias (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references usuarios(id) on delete cascade,
  insignia_id  uuid not null references insignias(id) on delete cascade,
  otorgada_en  timestamptz not null default now(),
  unique (usuario_id, insignia_id)
);

create table if not exists ranking_consumo (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  antro_id        uuid not null references antros(id) on delete cascade,
  semana          date not null,
  monto           integer not null default 0,
  unique (usuario_id, antro_id, semana)
);

-- ===========================================================================
-- MÓDULO 4 · Paneles de gestión y monetización (esquema-only)
-- ===========================================================================

create table if not exists incidencias (
  id              uuid primary key default gen_random_uuid(),
  antro_id        uuid not null references antros(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  tipo            text not null,
  detalle         jsonb,
  responsable_id  uuid references usuarios(id) on delete set null,
  creado_en       timestamptz not null default now()
);

create table if not exists invitaciones (
  id              uuid primary key default gen_random_uuid(),
  codigo          text not null unique,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  antro_id        uuid references antros(id) on delete cascade,
  rol             rol not null,
  usos_max        integer not null default 1,
  usos            integer not null default 0,
  caduca_en       timestamptz not null,
  creada_por      uuid references usuarios(id) on delete set null,
  revocada        boolean not null default false,
  creada_en       timestamptz not null default now()
);

create table if not exists planes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  config      jsonb not null default '{}'
);

create table if not exists suscripciones (
  id              uuid primary key default gen_random_uuid(),
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  plan_id         uuid references planes(id) on delete set null,
  activa          boolean not null default true,
  creado_en       timestamptz not null default now()
);

create table if not exists promociones (
  id              uuid primary key default gen_random_uuid(),
  corporativo_id  uuid references corporativos(id) on delete cascade,
  antro_id        uuid references antros(id) on delete cascade,
  nombre          text not null,
  detalle         jsonb,
  creada_por      uuid references usuarios(id) on delete set null,
  creada_en       timestamptz not null default now()
);

create table if not exists notificaciones (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references usuarios(id) on delete cascade,
  tipo         text not null,
  payload      jsonb,
  leida        boolean not null default false,
  creado_en    timestamptz not null default now()
);
create index if not exists notificaciones_usuario_idx on notificaciones(usuario_id);
