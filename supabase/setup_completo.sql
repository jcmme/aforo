-- AFORO · Setup COMPLETO en un solo archivo.
-- Incluye: las 14 migraciones (tablas + RLS + endurecimiento de seguridad)
-- y al final el seed de datos demo (antros de Puebla) para poder navegar.
-- USO: pégalo completo en el SQL Editor de Supabase y pulsa Run. Una vez.
-- Es idempotente: si lo corres dos veces no duplica nada.
-- ---------------------------------------------------------------------------


-- ===========================================================================
-- >>> migrations/0001_schema.sql
-- ===========================================================================
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


-- ===========================================================================
-- >>> migrations/0002_rls.sql
-- ===========================================================================
-- AFORO · Row-Level Security (denegación por defecto, CLAUDE.md §2 y §3)
--
-- Postura: RLS activado en TODAS las tablas. Sin policy explícita = sin acceso.
-- Las lecturas públicas (antros, eventos) y las del propio usuario (reservas,
-- perfil) se abren con policies acotadas. Las escrituras sensibles pasan por
-- Edge Functions con la `service_role` (que omite RLS) y validan la matriz de
-- permisos en el servidor. Así nada se autoriza solo desde el cliente.

-- ---------------------------------------------------------------------------
-- Helpers de autorización (SECURITY DEFINER para leer membresías sin recursión)
-- ---------------------------------------------------------------------------

create or replace function auth_corporativos()
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select corporativo_id from membresias
  where usuario_id = auth.uid() and activo;
$$;

create or replace function es_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from membresias
    where usuario_id = auth.uid() and activo and rol = 'super_admin'
  );
$$;

-- ¿El usuario tiene permiso para una acción según la matriz? (denegación por
-- defecto: solo cuenta si existe la fila permitida para alguno de sus roles).
create or replace function tiene_permiso(in_accion text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1
    from membresias m
    join permisos p
      on p.rol = m.rol and p.accion = in_accion and p.permitido
    where m.usuario_id = auth.uid() and m.activo
  );
$$;

-- ---------------------------------------------------------------------------
-- Activar RLS en todas las tablas del esquema público
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname = 'public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Perfil propio
-- ---------------------------------------------------------------------------
drop policy if exists usuarios_select_propio on usuarios;
create policy usuarios_select_propio on usuarios
  for select using (auth.uid() = id);

drop policy if exists usuarios_insert_propio on usuarios;
create policy usuarios_insert_propio on usuarios
  for insert with check (auth.uid() = id);

drop policy if exists usuarios_update_propio on usuarios;
create policy usuarios_update_propio on usuarios
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Descubrimiento público: antros y eventos son de lectura abierta
-- ---------------------------------------------------------------------------
drop policy if exists antros_select_publico on antros;
create policy antros_select_publico on antros for select using (true);

drop policy if exists eventos_select_publico on eventos;
create policy eventos_select_publico on eventos for select using (true);

-- Escritura de antros/eventos: solo super admin o staff con permiso de su
-- corporativo (las Edge Functions con service_role cubren el resto).
drop policy if exists antros_escritura_staff on antros;
create policy antros_escritura_staff on antros
  for all
  using (es_super_admin() or corporativo_id in (select auth_corporativos()))
  with check (es_super_admin() or corporativo_id in (select auth_corporativos()));

drop policy if exists eventos_escritura_staff on eventos;
create policy eventos_escritura_staff on eventos
  for all
  using (es_super_admin() or corporativo_id in (select auth_corporativos()))
  with check (es_super_admin() or corporativo_id in (select auth_corporativos()));

-- ---------------------------------------------------------------------------
-- Reservas y QR: el cliente ve lo suyo; el staff, lo de su corporativo
-- ---------------------------------------------------------------------------
drop policy if exists reservas_select_propias on reservas;
create policy reservas_select_propias on reservas
  for select using (
    cliente_id = auth.uid()
    or rp_id = auth.uid()
    or corporativo_id in (select auth_corporativos())
  );

-- El cliente puede crear su propia reserva (la Edge Function aplica reglas de
-- negocio; esta policy es la red de seguridad a nivel fila).
drop policy if exists reservas_insert_propias on reservas;
create policy reservas_insert_propias on reservas
  for insert with check (cliente_id = auth.uid());

drop policy if exists reservas_update_propias on reservas;
create policy reservas_update_propias on reservas
  for update using (
    cliente_id = auth.uid() or corporativo_id in (select auth_corporativos())
  );

drop policy if exists qr_select on qr_codes;
create policy qr_select on qr_codes
  for select using (
    corporativo_id in (select auth_corporativos())
    or reserva_id in (select id from reservas where cliente_id = auth.uid() or rp_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Corporativos: visibles para sus miembros y super admin
-- ---------------------------------------------------------------------------
drop policy if exists corporativos_select on corporativos;
create policy corporativos_select on corporativos
  for select using (es_super_admin() or id in (select auth_corporativos()));

-- Membresías: cada quien ve las suyas; el staff de un corporativo ve las de su
-- corporativo (para gestión de personal en secciones posteriores).
drop policy if exists membresias_select on membresias;
create policy membresias_select on membresias
  for select using (
    usuario_id = auth.uid() or corporativo_id in (select auth_corporativos())
  );

-- ---------------------------------------------------------------------------
-- Configuración: lectura para miembros del corporativo (o global). Escritura,
-- solo super admin. El resto de tablas (módulos 2-4, auditoría) quedan sin
-- policy = denegación total para clientes; se operan vía service_role.
-- ---------------------------------------------------------------------------
drop policy if exists config_select on config_parametros;
create policy config_select on config_parametros
  for select using (
    scope = 'global'
    or corporativo_id in (select auth_corporativos())
    or es_super_admin()
  );

drop policy if exists feature_flags_select on feature_flags;
create policy feature_flags_select on feature_flags
  for select using (corporativo_id in (select auth_corporativos()) or es_super_admin());

drop policy if exists permisos_select on permisos;
create policy permisos_select on permisos for select using (auth.role() = 'authenticated');


-- ===========================================================================
-- >>> migrations/0003_config_seed.sql
-- ===========================================================================
-- AFORO · Seed de configuración (no tenant-specific): matriz de permisos,
-- parámetros de negocio editables e insignias base. Configuración sin código
-- (CLAUDE.md §2, §5, §6). Editable después desde el panel de Súper Admin.

-- ---------------------------------------------------------------------------
-- Matriz de permisos (CLAUDE.md §5). Denegación por defecto: solo se insertan
-- las combinaciones permitidas. "Capitán" = operativo+social (rol 'capitan').
-- "Gerente" = individual+general. Dueño/socios: visibilidad de consulta.
-- ---------------------------------------------------------------------------
insert into permisos (rol, accion) values
  ('cliente','crear_reserva'), ('rp','crear_reserva'),
  ('capitan','crear_reserva'), ('gerente','crear_reserva'),
  ('gerente_general','crear_reserva'), ('super_admin','crear_reserva'),

  ('capitan','compartir_qr'), ('rp','compartir_qr'),

  ('cliente','cancelar_reserva_propia'),

  ('cadenero','escanear_puerta'), ('hostess','escanear_puerta'),
  ('cadenero','marcar_llego'), ('hostess','marcar_llego'),
  ('cadenero','acceso_manual'), ('hostess','acceso_manual'),
  ('cadenero','override_amarillo'), ('hostess','override_amarillo'),
  ('cadenero','contador_sin_reserva'),

  ('cajero','capturar_consumo'), ('super_admin','capturar_consumo'),
  ('cajero','consultar_consumo_minimo'), ('super_admin','consultar_consumo_minimo'),

  ('hostess','asignar_mover_mesa'), ('capitan','asignar_mover_mesa'),
  ('gerente','asignar_mover_mesa'), ('gerente_general','asignar_mover_mesa'),

  ('capitan','escanear_mesa'),
  ('capitan','hacer_cumplir_minimo'),
  ('capitan','acuse_promo'), ('super_admin','acuse_promo'),

  ('capitan','ver_desempeno_rps'), ('gerente','ver_desempeno_rps'),
  ('gerente_general','ver_desempeno_rps'), ('dueno','ver_desempeno_rps'),
  ('socio','ver_desempeno_rps'), ('super_admin','ver_desempeno_rps'),

  ('gerente','ver_metricas_antro'), ('gerente_general','ver_metricas_antro'),
  ('dueno','ver_metricas_antro'), ('socio','ver_metricas_antro'),
  ('super_admin','ver_metricas_antro'),

  ('gerente','exportar_datos'), ('gerente_general','exportar_datos'),
  ('dueno','exportar_datos'), ('socio','exportar_datos'),
  ('super_admin','exportar_datos'),

  ('gerente','panel_cadena'), ('gerente_general','panel_cadena'),
  ('dueno','panel_cadena'), ('socio','panel_cadena'),
  ('super_admin','panel_cadena'),

  ('gerente','gestionar_personal'), ('gerente_general','gestionar_personal'),
  ('super_admin','gestionar_personal'),

  ('capitan','gestionar_invitaciones'), ('gerente','gestionar_invitaciones'),
  ('gerente_general','gestionar_invitaciones'), ('super_admin','gestionar_invitaciones'),

  ('super_admin','cargar_promociones'),
  ('super_admin','alta_corporativos'),
  ('super_admin','feature_flags_planes')
on conflict (rol, accion) do nothing;

-- ---------------------------------------------------------------------------
-- Parámetros de negocio globales (editables; precedencia antro > corp > global)
-- ---------------------------------------------------------------------------
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','ventana_cancelacion_default', '"18:00"', 'Hora límite de cancelación sin penalización'),
  ('global','consumo_minimo_mesa_default', '5000', 'Consumo mínimo por mesa (MXN) por defecto'),
  ('global','invitacion_caducidad_horas', '72', 'Caducidad de invitaciones de personal'),
  ('global','invitacion_intentos_max', '3', 'Intentos fallidos antes de bloquear ingreso de códigos'),
  ('global','login_intentos_max', '5', 'Intentos fallidos de login antes de bloqueo temporal'),
  ('global','score_umbral_fantasma', '60', 'Umbral del score para alerta de fantasma'),
  ('global','hito_constancia_reservas', '15', 'Reservas completas en una noche'),
  ('global','hito_maquina_ventas_monto', '250000', 'Consumo en una noche (MXN)'),
  ('global','hito_confiabilidad_showrate', '0.85', 'Show rate sostenido en el mes'),
  ('global','hito_cero_fantasmas_dias', '30', 'Días sin no-shows'),
  ('global','hito_volumen_historico', '1000', 'Personas traídas en total'),
  ('global','texto_confirmacion_reserva', '"Tu reserva está confirmada. Comparte tus QR con tus invitados."', 'Texto de la notificación de confirmación')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Insignias base (CLAUDE.md §6 — hitos). Cifras configurables.
-- ---------------------------------------------------------------------------
insert into insignias (clave, nombre, descripcion) values
  ('constancia','Constancia','15 reservas completas en una noche'),
  ('maquina_ventas','Máquina de ventas','250 mil en consumo en una noche'),
  ('confiabilidad','Confiabilidad','Show rate ≥ 85% sostenido en el mes'),
  ('cero_fantasmas','Cero fantasmas','Un mes sin no-shows'),
  ('volumen_historico','Volumen histórico','1,000 personas traídas en total')
on conflict (clave) do nothing;


-- ===========================================================================
-- >>> migrations/0004_operacion.sql
-- ===========================================================================
-- AFORO · Sección 2: Operación en piso
-- Construye SOBRE el esquema existente (reservas, qr_codes, accesos_puerta,
-- movimientos_mesa, contador_penetracion, mesas, incidencias). Aquí se añade
-- la tabla de acuses de promo, parámetros de configuración del módulo y las
-- políticas RLS de las tablas de operación (denegación por defecto: el staff
-- solo ve/registra lo de SU corporativo).

-- ---------------------------------------------------------------------------
-- Acuse de "promo aplicada" (registro de entrega, no autorización). CLAUDE.md §6
-- ---------------------------------------------------------------------------
create table if not exists acuses_promo (
  id                 uuid primary key default gen_random_uuid(),
  reserva_id         uuid not null references reservas(id) on delete cascade,
  antro_id           uuid not null references antros(id) on delete cascade,
  corporativo_id     uuid not null references corporativos(id) on delete cascade,
  promo_descripcion  text,
  capitan_id         uuid references usuarios(id) on delete set null,
  creado_en          timestamptz not null default now()
);
create index if not exists acuses_promo_reserva_idx on acuses_promo(reserva_id);

-- ---------------------------------------------------------------------------
-- Configuración del módulo (editable, sin código). CLAUDE.md §2
-- ---------------------------------------------------------------------------

-- Los 6 motivos de acceso manual viven como parámetro (no quemados en código).
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','motivos_acceso_manual',
   '["QR no escanea","Cliente sin celular / sin batería","Invitado extra autorizado","La app no abre / error de la app","Reserva no aparece / error de sincronización","Otro"]',
   'Motivos de acceso manual en puerta (el último, "Otro", exige explicación)'),
  ('global','consumo_minimo_masivo', 'false',
   'Comportamiento flexible del consumo mínimo para eventos masivos')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS de las tablas de operación (todas ya tienen RLS activado en 0002).
-- Lectura para el staff del corporativo; las escrituras pasan por Edge
-- Functions con service_role (que omite RLS y valida la matriz de permisos).
-- ---------------------------------------------------------------------------

drop policy if exists accesos_select_staff on accesos_puerta;
create policy accesos_select_staff on accesos_puerta
  for select using (corporativo_id in (select auth_corporativos()));

drop policy if exists contador_select_staff on contador_penetracion;
create policy contador_select_staff on contador_penetracion
  for select using (
    antro_id in (select id from antros where corporativo_id in (select auth_corporativos()))
  );

drop policy if exists mesas_select_staff on mesas;
create policy mesas_select_staff on mesas
  for select using (
    antro_id in (select id from antros where corporativo_id in (select auth_corporativos()))
  );

drop policy if exists movimientos_select_staff on movimientos_mesa;
create policy movimientos_select_staff on movimientos_mesa
  for select using (
    reserva_id in (select id from reservas where corporativo_id in (select auth_corporativos()))
  );

drop policy if exists incidencias_select_staff on incidencias;
create policy incidencias_select_staff on incidencias
  for select using (corporativo_id in (select auth_corporativos()));

drop policy if exists acuses_select_staff on acuses_promo;
create policy acuses_select_staff on acuses_promo
  for select using (corporativo_id in (select auth_corporativos()));


-- ===========================================================================
-- >>> migrations/0005_inteligencia.sql
-- ===========================================================================
-- AFORO · Sección 3: Inteligencia, red social y staff
-- Construye SOBRE el esquema existente. Añade parámetros del módulo y las RLS de
-- las tablas de inteligencia. Las métricas, ranking, insignias y score se
-- computan de datos REALES (llegadas verificadas, no-shows, consumo capturado).

-- ---------------------------------------------------------------------------
-- Configuración editable del módulo (CLAUDE.md §2)
-- ---------------------------------------------------------------------------
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','ranking_periodo', '"semanal"', 'Periodo del ranking de consumo'),
  ('global','score_por_noshow', '20', 'Cuánto baja el score por cada no-show'),
  ('global','limite_reservas_fantasma', '40', 'Score igual o menor: se limitan reservas'),
  ('global','bloqueo_fantasma', '20', 'Score igual o menor: bloqueo')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- RLS de tablas de inteligencia (lectura acotada; escrituras vía Edge Functions
-- con service_role). Denegación por defecto.
-- ---------------------------------------------------------------------------

-- Consumo: lo ve el staff del corporativo (lo captura el cajero por función).
drop policy if exists consumo_select_staff on consumo_mesa;
create policy consumo_select_staff on consumo_mesa
  for select using (
    antro_id in (select id from antros where corporativo_id in (select auth_corporativos()))
  );

-- Insignias: catálogo de lectura pública.
drop policy if exists insignias_select on insignias;
create policy insignias_select on insignias for select using (true);

-- Insignias de usuario: cada quien ve las suyas; el staff del corporativo también.
drop policy if exists usuario_insignias_select on usuario_insignias;
create policy usuario_insignias_select on usuario_insignias
  for select using (
    usuario_id = auth.uid()
    or usuario_id in (
      select usuario_id from membresias where corporativo_id in (select auth_corporativos())
    )
  );

-- Ranking: legible para el staff del corporativo del antro.
drop policy if exists ranking_select_staff on ranking_consumo;
create policy ranking_select_staff on ranking_consumo
  for select using (
    antro_id in (select id from antros where corporativo_id in (select auth_corporativos()))
  );

-- Reputación: la ve el propio usuario y el staff con permiso de panel (gerente+).
drop policy if exists reputacion_select on reputacion;
create policy reputacion_select on reputacion
  for select using (usuario_id = auth.uid() or tiene_permiso('panel_cadena'));

-- Alertas de fantasma: solo roles con panel_cadena, de su corporativo.
drop policy if exists alertas_select on alertas_fantasma;
create policy alertas_select on alertas_fantasma
  for select using (
    tiene_permiso('panel_cadena') and corporativo_id in (select auth_corporativos())
  );

-- Huella de identidad: dato sensible; nadie lee desde el cliente (solo service_role).
-- (RLS activado en 0002, sin policy = denegado por defecto.)


-- ===========================================================================
-- >>> migrations/0006_gestion.sql
-- ===========================================================================
-- AFORO · Sección 4: Paneles de gestión y monetización
-- Los paneles LEEN y consolidan datos ya registrados. Aquí se añaden parámetros
-- (interruptores y textos de notificaciones) y las RLS de invitaciones,
-- promociones, planes y suscripciones. Denegación por defecto.

-- ---------------------------------------------------------------------------
-- Configuración: interruptores de notificaciones (apagados por defecto) y textos
-- ---------------------------------------------------------------------------
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','notif_posible_fantasma', 'false', 'Avisar al gerente cuando un cliente cae en su límite de score'),
  ('global','notif_cupo_alcanzado', 'false', 'Avisar al gerente cuando se alcanza el cupo del antro'),
  ('global','texto_recordatorio_evento', '"Hoy es tu noche. Te esperamos."', 'Texto del recordatorio del día del evento'),
  ('global','texto_lista_espera', '"Entraste a la lista de espera. Te avisamos si se libera un lugar."', 'Texto de entrada a lista de espera')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Invitaciones: las ve y administra el staff con permiso de su corporativo.
-- Las escrituras (generar/revocar/reclamar) pasan por Edge Functions que validan
-- la escalera de invitación. El reclamo lo hace el invitado (función pública).
-- ---------------------------------------------------------------------------
drop policy if exists invitaciones_select_staff on invitaciones;
create policy invitaciones_select_staff on invitaciones
  for select using (
    tiene_permiso('gestionar_invitaciones') and corporativo_id in (select auth_corporativos())
  );

-- ---------------------------------------------------------------------------
-- Promociones: creación exclusiva del Súper Admin (vía función). El staff del
-- corporativo puede LEER las promos asignadas a sus antros.
-- ---------------------------------------------------------------------------
drop policy if exists promociones_select on promociones;
create policy promociones_select on promociones
  for select using (
    es_super_admin() or corporativo_id in (select auth_corporativos())
  );

-- ---------------------------------------------------------------------------
-- Planes (catálogo) y suscripciones.
-- ---------------------------------------------------------------------------
drop policy if exists planes_select on planes;
create policy planes_select on planes for select using (auth.role() = 'authenticated');

drop policy if exists suscripciones_select on suscripciones;
create policy suscripciones_select on suscripciones
  for select using (es_super_admin() or corporativo_id in (select auth_corporativos()));

-- Nota: la edición de parámetros, feature flags, planes y promociones se hace
-- con la service_role desde el panel de Súper Admin (Edge Functions), que valida
-- el permiso 'feature_flags_planes' / 'cargar_promociones' antes de escribir.


-- ===========================================================================
-- >>> migrations/0007_invitados.sql
-- ===========================================================================
-- AFORO · Ronda 5: reservas de invitados sin cuenta, reseñas y T&C por antro
-- Construye SOBRE el esquema existente. Denegación por defecto (RLS).

-- ---------------------------------------------------------------------------
-- 1) Reservas de invitados sin cuenta (capitán/RP registra solo nombre+tel).
--    cliente_id pasa a ser nullable; se guarda la identidad del invitado.
-- ---------------------------------------------------------------------------
alter table reservas alter column cliente_id drop not null;
alter table reservas add column if not exists invitado_nombre text;
alter table reservas add column if not exists invitado_telefono text;
alter table reservas add constraint reservas_cliente_o_invitado
  check (cliente_id is not null or invitado_nombre is not null);

-- La policy de insert directo del cliente exige cliente_id = auth.uid(); las
-- reservas de invitado SIEMPRE pasan por la Edge Function `crear-reserva` con
-- service_role (que valida que el llamante sea staff), así no hace falta
-- tocar esa policy para permitir cliente_id null desde el cliente.

-- ---------------------------------------------------------------------------
-- 2) Reseñas de clientes hacia el antro (estrellas + foto; comentario listo
--    en el modelo, sin UI todavía — CLAUDE.md, ronda 5).
-- ---------------------------------------------------------------------------
create table if not exists resenas_antro (
  id           uuid primary key default gen_random_uuid(),
  antro_id     uuid not null references antros(id) on delete cascade,
  cliente_id   uuid not null references usuarios(id) on delete cascade,
  estrellas    integer not null check (estrellas between 1 and 5),
  foto_url     text,
  comentario   text,
  creado_en    timestamptz not null default now()
);
create index if not exists resenas_antro_idx on resenas_antro(antro_id);

alter table resenas_antro enable row level security;

drop policy if exists resenas_select_publico on resenas_antro;
create policy resenas_select_publico on resenas_antro for select using (true);

-- La escritura pasa por la Edge Function `crear-resena` (valida que el
-- cliente sí llegó, con un QR usado en puerta, antes de insertar).

-- ---------------------------------------------------------------------------
-- 3) T&C por antro (3 niveles: general de la app, corporativo, antro). El
--    cliente ve el del antro al reservar. Workflow con aprobación del Súper
--    Admin y corte semanal (martes 12:00, editable) — ver aprobar-tyc.
-- ---------------------------------------------------------------------------
alter table antros add column if not exists responsable_tyc_id uuid references usuarios(id);

create table if not exists tyc_antro (
  antro_id         uuid primary key references antros(id) on delete cascade,
  texto_vigente    text not null default '',
  texto_pendiente  text,
  estado           text not null default 'sin_cambios'
                     check (estado in ('sin_cambios', 'esperando_aprobacion')),
  propuesto_en     timestamptz,
  aprobado_por     uuid references usuarios(id),
  aprobado_en      timestamptz,
  aplica_desde     timestamptz
);

alter table tyc_antro enable row level security;

drop policy if exists tyc_select_publico on tyc_antro;
create policy tyc_select_publico on tyc_antro for select using (true);

-- Escritura (proponer / aprobar) vía Edge Functions `editar-tyc-antro` y
-- `aprobar-tyc`, que validan responsable designado y permiso `aprobar_tyc`.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'tyc_general', '"Uso de AFORO sujeto a mayoría de edad y a las políticas de privacidad de la plataforma."', 'T&C general de la app (nivel 1)')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 4) Matriz de permisos nuevos (CLAUDE.md §5, ronda 5)
-- ---------------------------------------------------------------------------
insert into permisos (rol, accion) values
  ('rp','dejar_resena'),       -- toda cuenta cliente puede reseñar; se deja explícito
  ('cliente','dejar_resena'),
  ('super_admin','aprobar_tyc'),
  ('gerente','editar_tyc'), ('gerente_general','editar_tyc'), ('capitan','editar_tyc'),
  ('hostess','editar_tyc'), ('cajero','editar_tyc'), ('rp','editar_tyc'),
  ('super_admin','editar_tyc')
on conflict (rol, accion) do nothing;


-- ===========================================================================
-- >>> migrations/0008_feed.sql
-- ===========================================================================
-- AFORO · Ronda 5: feed social persistido (comentarios + reacciones)
-- El feed hoy se computaba al vuelo (sin id estable en BD). Para poder
-- comentar/reaccionar hace falta persistir cada publicación cuando ocurre el
-- logro real (insignia desbloqueada, entrada al top 3, racha) — no se inventa
-- contenido, solo se guarda el evento real en el momento en que se detecta.

create table if not exists feed_eventos (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null check (tipo in ('insignia', 'ranking', 'racha')),
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  corporativo_id  uuid not null references corporativos(id) on delete cascade,
  texto           text not null,
  creado_en       timestamptz not null default now()
);
create index if not exists feed_eventos_corp_idx on feed_eventos(corporativo_id, creado_en desc);

create table if not exists feed_comentarios (
  id              uuid primary key default gen_random_uuid(),
  feed_evento_id  uuid not null references feed_eventos(id) on delete cascade,
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  texto           text not null,
  creado_en       timestamptz not null default now()
);
create index if not exists feed_comentarios_evento_idx on feed_comentarios(feed_evento_id);

create table if not exists feed_reacciones (
  id              uuid primary key default gen_random_uuid(),
  feed_evento_id  uuid not null references feed_eventos(id) on delete cascade,
  usuario_id      uuid not null references usuarios(id) on delete cascade,
  creado_en       timestamptz not null default now(),
  unique (feed_evento_id, usuario_id)
);

alter table feed_eventos enable row level security;
alter table feed_comentarios enable row level security;
alter table feed_reacciones enable row level security;

-- Visible para el staff del mismo corporativo (comparten el feed).
drop policy if exists feed_eventos_select on feed_eventos;
create policy feed_eventos_select on feed_eventos
  for select using (corporativo_id in (select auth_corporativos()));

drop policy if exists feed_comentarios_select on feed_comentarios;
create policy feed_comentarios_select on feed_comentarios
  for select using (
    feed_evento_id in (select id from feed_eventos where corporativo_id in (select auth_corporativos()))
  );
drop policy if exists feed_comentarios_insert on feed_comentarios;
create policy feed_comentarios_insert on feed_comentarios
  for insert with check (usuario_id = auth.uid());

drop policy if exists feed_reacciones_select on feed_reacciones;
create policy feed_reacciones_select on feed_reacciones
  for select using (
    feed_evento_id in (select id from feed_eventos where corporativo_id in (select auth_corporativos()))
  );
drop policy if exists feed_reacciones_insert on feed_reacciones;
create policy feed_reacciones_insert on feed_reacciones
  for all using (usuario_id = auth.uid()) with check (usuario_id = auth.uid());


-- ===========================================================================
-- >>> migrations/0009_tiendas.sql
-- ===========================================================================
-- AFORO · Ronda 6: preparación para tiendas
-- Google Play exige un enlace al aviso de privacidad DENTRO de la app.
-- La URL vive como parámetro editable (configuración sin código): cuando el
-- abogado entregue la versión definitiva en el dominio propio, se cambia
-- aquí sin publicar una actualización de la app.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'aviso_privacidad_url',
   '"https://jcmme.github.io/aforo/aviso-privacidad.html"',
   'URL pública del aviso de privacidad (sustituir por la del dominio propio al tener la versión legal)')
on conflict do nothing;


-- ===========================================================================
-- >>> migrations/0010_fotos.sql
-- ===========================================================================
-- AFORO · Fotos de antro con moderación (los antros suben, Súper Admin aprueba)
--
-- Cada foto nace 'pendiente' y solo se muestra al cliente cuando el Súper Admin
-- la 'aprueba'. Formato estándar 3:2 (se valida en la app/subida). Escrituras
-- vía Edge Functions con validación de tenant y permiso (denegación por
-- defecto). Lectura pública SOLO de las aprobadas.

create table if not exists fotos_antro (
  id             uuid primary key default gen_random_uuid(),
  antro_id       uuid not null references antros(id) on delete cascade,
  corporativo_id uuid not null references corporativos(id) on delete cascade,
  url            text not null,
  estado         text not null default 'pendiente'
                   check (estado in ('pendiente', 'aprobada', 'rechazada')),
  orden          integer not null default 0,
  subida_por     uuid references usuarios(id) on delete set null,
  aprobada_por   uuid references usuarios(id) on delete set null,
  creada_en      timestamptz not null default now(),
  aprobada_en    timestamptz
);
create index if not exists fotos_antro_idx on fotos_antro(antro_id, estado, orden);

alter table fotos_antro enable row level security;

-- El cliente (y cualquiera) solo ve las aprobadas.
drop policy if exists fotos_select_aprobadas on fotos_antro;
create policy fotos_select_aprobadas on fotos_antro
  for select using (estado = 'aprobada');

-- El staff del corporativo ve también las suyas pendientes/rechazadas.
drop policy if exists fotos_select_staff on fotos_antro;
create policy fotos_select_staff on fotos_antro
  for select using (corporativo_id in (select auth_corporativos()) or es_super_admin());

-- Escritura (subir / moderar) SOLO vía Edge Functions con service_role, que
-- validan permiso + pertenencia al corporativo. Sin policy de insert/update
-- para el cliente = denegación por defecto.

insert into permisos (rol, accion) values
  ('gerente', 'subir_foto_antro'),
  ('gerente_general', 'subir_foto_antro'),
  ('super_admin', 'subir_foto_antro'),
  ('super_admin', 'moderar_fotos')
on conflict (rol, accion) do nothing;


-- ===========================================================================
-- >>> migrations/0011_seguridad.sql
-- ===========================================================================
-- AFORO · Endurecimiento de seguridad (auditoría interna)
--
-- Cierra los huecos detectados en la auditoría, con foco en el AISLAMIENTO
-- MULTI-TENANT (CLAUDE.md §2, §3): que el personal de un corporativo no pueda
-- leer ni escribir datos de otro, por ninguna vía (API directa ni Edge
-- Function). Complementa el eje de tenant que ahora validan las funciones.
--
-- Resumen de cambios:
--   1. RLS de reservas: se prohíbe la escritura DIRECTA del cliente (toda
--      creación/transición pasa por Edge Function con service_role, que aplica
--      cupo, reglas y firma de QR). Se cierra el bypass de insertar/actualizar
--      reservas a mano (p. ej. marcarse "completada" para simular asistencia).
--   2. RLS de antros/eventos: la escritura deja de estar abierta a cualquier
--      miembro del corporativo; exige permiso de gestión (gerente+ o super
--      admin). Antes un RP/hostess podía editar antros o eventos por la API.
--   3. Trigger que impide auto-marcarse email/teléfono como verificados: solo
--      el servidor (service_role), tras verificación real, puede ponerlos true.
--   4. Tabla de intentos de código de invitación: base del bloqueo temporal
--      por fuerza bruta (3 intentos, editable) — CLAUDE.md §6.

-- ---------------------------------------------------------------------------
-- 1. Reservas: sin escritura directa desde el cliente (denegación por defecto)
-- ---------------------------------------------------------------------------
-- La SELECT sigue acotada (cliente ve lo suyo; staff, lo de su corporativo).
-- Se ELIMINAN las policies de INSERT/UPDATE directas: ninguna ruta del cliente
-- escribe reservas sin pasar por las Edge Functions (crear-reserva /
-- cancelar-reserva), que ya validan permiso + tenant + reglas de negocio.
drop policy if exists reservas_insert_propias on reservas;
drop policy if exists reservas_update_propias on reservas;

-- (No se recrean policies de escritura: sin policy = denegado para el rol
-- authenticated; la service_role de las funciones omite RLS por diseño.)

-- Igual criterio para los QR: el cliente los LEE (para mostrarlos), nunca los
-- escribe a mano; la creación/uso vive en las funciones.
drop policy if exists qr_update on qr_codes;
drop policy if exists qr_insert on qr_codes;

-- ---------------------------------------------------------------------------
-- 2. Antros y eventos: lectura pública; escritura solo gestión con permiso
-- ---------------------------------------------------------------------------
-- Antes: `for all` a cualquier miembro del corporativo (demasiado amplio: un
-- RP o hostess podía alterar antros/eventos). Ahora exige el permiso de
-- gestión del antro (gerente/gerente_general/dueño/socio) o super_admin, y
-- SIEMPRE dentro de su propio corporativo (aislamiento).
drop policy if exists antros_escritura_staff on antros;
create policy antros_escritura_staff on antros
  for all
  using (
    es_super_admin()
    or (corporativo_id in (select auth_corporativos()) and tiene_permiso('ver_metricas_antro'))
  )
  with check (
    es_super_admin()
    or (corporativo_id in (select auth_corporativos()) and tiene_permiso('ver_metricas_antro'))
  );

drop policy if exists eventos_escritura_staff on eventos;
create policy eventos_escritura_staff on eventos
  for all
  using (
    es_super_admin()
    or (corporativo_id in (select auth_corporativos()) and tiene_permiso('ver_metricas_antro'))
  )
  with check (
    es_super_admin()
    or (corporativo_id in (select auth_corporativos()) and tiene_permiso('ver_metricas_antro'))
  );

-- ---------------------------------------------------------------------------
-- 3. Verificación de correo/teléfono a prueba de auto-marcado
-- ---------------------------------------------------------------------------
-- La policy usuarios_update_propio permite al usuario editar SU fila, pero no
-- debe permitirle declararse verificado. Este trigger fuerza que las banderas
-- de verificación solo las pueda cambiar el servidor (service_role) tras una
-- verificación real; el propio usuario nunca las altera.
create or replace function proteger_verificaciones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.role() = 'service_role' solo cuando escribe una Edge Function con la
  -- llave de servicio. Para 'authenticated' (el usuario) se ignoran los valores
  -- entrantes de verificación.
  if coalesce(auth.role(), '') is distinct from 'service_role' then
    if tg_op = 'INSERT' then
      new.email_verificado := false;
      new.telefono_verificado := false;
    else
      new.email_verificado := old.email_verificado;
      new.telefono_verificado := old.telefono_verificado;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_proteger_verificaciones on usuarios;
create trigger trg_proteger_verificaciones
  before insert or update on usuarios
  for each row execute function proteger_verificaciones();

-- ---------------------------------------------------------------------------
-- 4. Intentos de código de invitación (anti fuerza bruta, CLAUDE.md §6)
-- ---------------------------------------------------------------------------
-- Registro por usuario de intentos fallidos de canje de código. Sin policy =
-- inaccesible desde el cliente; solo la Edge Function (service_role) lo maneja.
create table if not exists intentos_codigo (
  usuario_id      uuid primary key references usuarios(id) on delete cascade,
  intentos        integer not null default 0,
  ultimo_intento  timestamptz,
  bloqueado_hasta timestamptz
);
alter table intentos_codigo enable row level security;

-- Duración del bloqueo temporal tras agotar los intentos (editable, sin código).
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','invitacion_bloqueo_minutos', '15', 'Minutos de bloqueo tras agotar los intentos de código')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 5. Reputación: cerrar la lectura transversal (fuga entre corporativos)
-- ---------------------------------------------------------------------------
-- La policy anterior dejaba que CUALQUIER usuario con permiso de panel
-- (gerente+) leyera el score de reputación de TODOS los usuarios de la
-- plataforma, sin filtrar por corporativo. Ahora el gerente solo ve la
-- reputación de usuarios RELEVANTES para su corporativo: quienes tienen una
-- reserva o una membresía en él. El propio usuario siempre ve la suya. El
-- motor antifraude (service_role) omite RLS y no se ve afectado.
drop policy if exists reputacion_select on reputacion;
create policy reputacion_select on reputacion
  for select using (
    usuario_id = auth.uid()
    or (
      tiene_permiso('panel_cadena')
      and (
        usuario_id in (
          select cliente_id from reservas
          where cliente_id is not null and corporativo_id in (select auth_corporativos())
        )
        or usuario_id in (
          select usuario_id from membresias
          where corporativo_id in (select auth_corporativos())
        )
      )
    )
  );


-- ===========================================================================
-- >>> migrations/0012_verificacion_email.sql
-- ===========================================================================
-- AFORO · Verificación de cuenta solo por correo (CLAUDE.md §3)
--
-- Decisión: se retira el requisito de verificar teléfono (nunca se integró un
-- proveedor SMS). El teléfono se sigue capturando como dato de contacto y para
-- el motor antifraude (huella de identidad, CLAUDE.md §6), pero deja de ser
-- una verificación obligatoria en el registro.
--
-- Además, esta migración CIERRA UN HUECO real de la 0011: hasta ahora nada
-- ponía en true ni email_verificado ni telefono_verificado. El registro
-- insertaba la fila de `usuarios` desde el cliente antes de tener sesión (si
-- el proyecto exige confirmar correo, esa escritura fallaba por RLS al no
-- haber `auth.uid()` todavía) y ninguna ruta sincronizaba la confirmación real
-- de Supabase Auth. Se resuelve con dos triggers sobre `auth.users` (tabla que
-- administra Supabase, fuera de nuestras políticas RLS):
--   1. Al crearse el usuario en Auth, se crea su fila en `public.usuarios`
--      (ya no depende de que el cliente tenga sesión).
--   2. Al confirmarse su correo en Auth, se marca `email_verificado = true`.

-- ---------------------------------------------------------------------------
-- 1. Retirar el requisito de teléfono verificado
-- ---------------------------------------------------------------------------
alter table usuarios drop column if exists telefono_verificado;

-- ---------------------------------------------------------------------------
-- 2. Crear el perfil en public.usuarios cuando Auth crea el usuario
-- ---------------------------------------------------------------------------
-- security definer: corre con los privilegios de quien la crea (el rol que
-- aplica las migraciones), así que no depende de que el cliente ya tenga
-- sesión ni pasa por las policies de usuarios_insert_propio.
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.usuarios (id, nombre, username, email, telefono)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    nullif(new.raw_user_meta_data ->> 'username', ''),
    new.email,
    nullif(new.raw_user_meta_data ->> 'telefono', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_manejar_nuevo_usuario on auth.users;
create trigger trg_manejar_nuevo_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ---------------------------------------------------------------------------
-- 3. Reflejar en public.usuarios cuando Auth confirma el correo
-- ---------------------------------------------------------------------------
create or replace function public.sincronizar_email_verificado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and old.email_confirmed_at is null then
    update public.usuarios set email_verificado = true where id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sincronizar_email_verificado on auth.users;
create trigger trg_sincronizar_email_verificado
  after update on auth.users
  for each row execute function public.sincronizar_email_verificado();

-- ---------------------------------------------------------------------------
-- 4. Ajustar el candado de auto-verificación (migración 0011)
-- ---------------------------------------------------------------------------
-- Antes bloqueaba cualquier escritura que no llegara con JWT de
-- 'service_role', lo que también habría bloqueado a los triggers de arriba
-- (corren sin JWT: auth.role() da null ahí). El candado que de verdad importa
-- es contra el usuario final autenticado por la API (rol 'authenticated'),
-- que es quien podría intentar auto-marcarse verificado editando su propia
-- fila vía la policy usuarios_update_propio. Se quita también la referencia a
-- telefono_verificado, columna que ya no existe.
create or replace function proteger_verificaciones()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(auth.role(), '') = 'authenticated' then
    if tg_op = 'INSERT' then
      new.email_verificado := false;
    else
      new.email_verificado := old.email_verificado;
    end if;
  end if;
  return new;
end;
$$;


-- ===========================================================================
-- >>> migrations/0013_legal_textos.sql
-- ===========================================================================
-- AFORO · Texto completo del Aviso de Privacidad y los Términos de Uso
--
-- El abogado (Juan Pablo) entregó las versiones revisadas de ambos documentos
-- en agosto de 2026. Se guardan como parámetro editable (no en el bundle de
-- la app) para que Súper Admin pueda corregirlos —p. ej. al confirmar el
-- correo de contacto o el proveedor de infraestructura, hoy [correo] y
-- [proveedor] en el texto— sin necesidad de publicar una actualización de la
-- app en las tiendas. Formato markdown ligero (ver src/data/legalTextos.ts,
-- que trae el mismo texto como valor por defecto para el modo demo).
--
-- Nota: la Sección 7 (política de inasistencias) del T&C todavía describe un
-- esquema de "3 inasistencias en 6 meses" con números fijos que NO coincide
-- con el motor de score de reputación continuo ya construido (migraciones
-- 0005/0011). Se sube tal cual la entregó el abogado; hay una propuesta de
-- redacción alternativa (alineada al score real) pendiente de su revisión,
-- que se actualizará aquí en cuanto la confirme — sin tocar código, solo
-- este parámetro.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'aviso_privacidad_texto', to_jsonb($AVISOTXT$# Aviso de Privacidad Integral

## Identidad del responsable

AFORO es la aplicación móvil y el sitio web a través de los cuales las personas mayores de edad, dentro de territorio mexicano, pueden consultar el catálogo de restaurantes, bares y antros afiliados (los “Establecimientos”) por ubicación o por búsqueda, generar reservaciones mediante código QR, y publicar reseñas y fotografías. El responsable del tratamiento de los datos personales descritos en este aviso es Manuel Argüelles Sierra, a título personal en tanto no se constituya la sociedad mercantil titular del proyecto AFORO (momento en el cual esta identificación se sustituirá por la denominación social correspondiente, con notificación previa a los titulares conforme a la sección Cambios a este aviso), con domicilio en Parque Provenza, Lomas de Angelópolis III, Marsella 97, Puebla, Puebla, México, y correo electrónico de contacto [correo].

Este documento constituye el aviso de privacidad integral de AFORO, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) vigente desde el 21 de marzo de 2025, su Reglamento en lo que no se oponga a dicha reforma, y los Lineamientos del Aviso de Privacidad aplicables. En el formulario de registro dentro de la aplicación encontrará, además, una versión simplificada de este aviso, la cual remite al presente documento para su consulta completa.

## Alcance de este aviso

AFORO está disponible exclusivamente para su uso dentro de territorio mexicano y dirigida únicamente a personas mayores de 18 años, en atención a la naturaleza de los Establecimientos afiliados, varios de los cuales venden bebidas alcohólicas. Al registrarse, usted declara bajo protesta de decir verdad contar con 18 años cumplidos; si tenemos indicios razonables de que una cuenta no cumple este requisito, procederemos a suspenderla y a eliminar la información asociada, salvo obligación legal de conservarla.

Este aviso aplica a dos categorías de titulares cuyos datos personales tratamos bajo finalidades distintas: por un lado, los usuarios finales que utilizan AFORO para buscar, reservar, reseñar y compartir fotografías; por otro, las personas físicas que actúan como representantes o personas de contacto de los Establecimientos afiliados al catálogo. A lo largo de este documento se distingue con claridad cuándo una disposición corresponde a uno u otro grupo, y cuándo resulta aplicable a ambos.

## Datos personales que recabamos de los usuarios

Cuando usted se registra como usuario, recabamos su nombre completo, nombre de usuario, correo electrónico, número de teléfono, y una contraseña que almacenamos exclusivamente en forma cifrada, sin que sea legible en ningún momento por nuestro personal. El teléfono nos permite confirmar sus reservaciones, contactarlo en caso de cambios, y aplicar la política de prevención de fraude descrita más adelante en este aviso. Del uso cotidiano de la aplicación derivan, además, su historial de búsquedas dentro del catálogo, las reservaciones que solicite y confirme, los códigos QR generados para su acceso, y sus cancelaciones.

Si usted decide publicar una reseña o fotografía sobre algún Establecimiento, dicho contenido se trata también como parte de su información dentro de la plataforma. Usted es responsable de que las imágenes que suba no contengan datos personales o la imagen de terceros identificables (por ejemplo, otros comensales), sin su consentimiento, y AFORO se reserva la facultad de moderar, editar o retirar cualquier fotografía que incumpla esta condición.

Adicionalmente, como ocurre en cualquier aplicación o sitio web, nuestros servidores registran de forma automática ciertos datos técnicos de conexión (incluyendo su dirección IP, el tipo de dispositivo y sistema operativo, y las marcas de tiempo de sus solicitudes) con fines de administración, seguridad y diagnóstico del Servicio; estos datos no se utilizan para identificarlo individualmente fuera de dichos fines y se conservan por el plazo señalado en la sección Conservación de la información.

No solicitamos ni tratamos datos personales sensibles (origen étnico, estado de salud, creencias religiosas, preferencia sexual u opiniones políticas), ni datos financieros o bancarios, dado que AFORO no procesa pagos: el consumo en el Establecimiento se liquida directamente ahí.

## Datos personales que recabamos de los Establecimientos

Cuando un restaurante, bar o antro se afilia a AFORO, recabamos los datos personales de la persona física que actúa como su representante o contacto: nombre completo, puesto o cargo, correo electrónico y número de teléfono. Para efectos de facturación conforme al Contrato de Prestación de Servicios celebrado con el Establecimiento, recabamos también su razón social o nombre comercial, domicilio fiscal, y el Registro Federal de Contribuyentes (RFC) correspondiente. Cuando el Establecimiento opera como persona moral, el RFC corresponde a dicha persona moral y no constituye, por sí mismo, un dato personal; cuando corresponde a una persona física con actividad empresarial, sí queda protegido por este aviso.

Si el Establecimiento cuenta con acceso a un panel de administración, tratamos también sus credenciales de acceso. La información propia del negocio que el Establecimiento publica en su ficha del catálogo (nombre comercial, dirección, horarios, menú y fotografías) corresponde al negocio y no constituye, en sí misma, un dato personal de un tercero, salvo que el Establecimiento decida incluir voluntariamente información identificable de su propio personal, en cuyo caso será responsable de contar con el consentimiento correspondiente.

## Finalidades del tratamiento

Tratamos los datos personales de los usuarios para crear y administrar su cuenta, operar el catálogo y sus funciones de búsqueda, gestionar sus reservaciones y la validación de su código QR, publicar y moderar el contenido que comparta, comunicarle confirmaciones y avisos propios del Servicio, verificar su identidad, y prevenir fraude derivado de reservaciones incumplidas de forma reiterada, conforme a la política correspondiente de nuestros Términos y Condiciones de Uso. Estas finalidades constituyen el objeto mismo del Servicio y su fundamento es la ejecución del contrato que se perfecciona entre usted y AFORO al aceptar dichos Términos. Con su consentimiento adicional y expreso, podemos también enviarle promociones o novedades de Establecimientos afiliados; usted puede negar u revocar este consentimiento en cualquier momento, sin que ello afecte el resto del Servicio, conforme a la sección Revocación del consentimiento.

Los datos personales de los Establecimientos se tratan para formalizar y ejecutar el Contrato de Prestación de Servicios correspondiente, administrar su ficha dentro del catálogo, facturar y cobrar la contraprestación pactada, transmitirles las reservaciones recibidas (limitadas al nombre bajo el cual el usuario registró su reservación, según se detalla en Transferencias de datos personales), y brindarles soporte y reportes de desempeño. El fundamento de estos tratamientos es igualmente la ejecución del contrato celebrado con el Establecimiento, así como el cumplimiento de las obligaciones fiscales aplicables.

Adicionalmente, utilizamos datos de uso agregados y anonimizados (por ejemplo, la frecuencia con la que se buscan ciertas categorías de Establecimientos o zonas geográficas) para mejorar el funcionamiento del catálogo y nuestras decisiones de producto. Este tratamiento estadístico no genera perfiles individuales con fines publicitarios de terceros, ni da lugar a decisiones automatizadas que produzcan efectos jurídicos sobre usted, salvo el mecanismo de prevención de fraude descrito en Identificadores técnicos, geolocalización y tecnologías similares, el cual está siempre sujeto al derecho de réplica y revisión humana previsto en nuestros Términos y Condiciones de Uso.

## Transferencias de datos personales

Compartimos su información personal únicamente en los casos estrictamente necesarios para operar el Servicio, y siempre bajo obligaciones de confidencialidad y seguridad equivalentes a las de este aviso.

Al Establecimiento con el que usted reserva le transmitimos exclusivamente el nombre bajo el cual registró su reservación, con el único propósito de que pueda identificarlo a su llegada; en ningún caso compartimos su teléfono, correo electrónico o cualquier otro dato de contacto, mismos que permanecen bajo nuestro resguardo.

AFORO contrata además proveedores de infraestructura tecnológica que actúan como encargados del tratamiento (esto es, que procesan datos personales exclusivamente conforme a nuestras instrucciones y no como responsables independientes) para alojar nuestra base de datos, nuestro backend y, en su caso, el panel de administración de los Establecimientos. Con independencia del proveedor específico, todo encargado del tratamiento que utilicemos, presente o futuro, queda sujeto contractualmente a implementar medidas de seguridad equivalentes a las descritas en Medidas de seguridad, a no utilizar los datos personales para fines propios, y a devolvernos o eliminar la información al concluir la relación contractual. Actualmente contemplamos a [proveedor], como nuestro proveedor de base de datos,; en cuanto se confirme, actualizaremos esta sección con su identidad y ubicación exactas. En la medida en que el proveedor definitivo se encuentre fuera de territorio mexicano, dicha remisión de datos a un encargado del tratamiento no constituye una transferencia a un tercero responsable y, por tanto, no requiere de su consentimiento adicional conforme a la LFPDPPP; no obstante, en un ejercicio de transparencia se lo informamos expresamente, y nos comprometemos a exigirle contractualmente un nivel de protección de datos personales equivalente al que exige la legislación mexicana.

Compartimos también los datos de facturación de los Establecimientos con nuestro despacho contable externo, bajo obligación de confidencialidad, para el cumplimiento de obligaciones fiscales. Fuera de los supuestos anteriores, no vendemos ni compartimos su información personal con terceros para fines de publicidad ajenos al Servicio, y solo la divulgaríamos adicionalmente cuando exista una obligación legal que nos obligue a ello, o para proteger nuestros derechos, los de otros usuarios o los de los Establecimientos frente a un uso indebido de la plataforma.

## Conservación de la información

Conservamos los datos de su cuenta (usuario o Establecimiento) durante el tiempo en que la relación con AFORO permanezca activa. Tratándose de usuarios, si su cuenta permanece inactiva durante 24 meses consecutivos, o si usted solicita su eliminación, sus datos personales se suprimen de nuestros sistemas activos y sus reservaciones anteriores se conservan únicamente de forma anonimizada (es decir, despojadas de manera irreversible de cualquier elemento que permita reasociarlas con usted) con fines estadísticos. Tratándose de Establecimientos, conservamos su información mientras subsista la relación contractual y, posteriormente, durante los plazos que exija la normatividad fiscal y contable aplicable, incluido el Código Fiscal de la Federación.

Le informamos que, tras la eliminación de su cuenta, sus datos personales podrán persistir de forma temporal en nuestras copias de seguridad por un plazo adicional de hasta 30 días, transcurrido el cual se sobrescriben de forma automática y definitiva; durante ese plazo, dichos respaldos permanecen aislados de nuestros sistemas activos y no se utilizan para ningún tratamiento. Los datos técnicos de conexión descritos en Datos personales que recabamos de los usuarios, incluida su dirección IP, se conservan por un plazo de 12 meses con fines de seguridad y diagnóstico, tras el cual se eliminan o anonimizan.

## Derechos ARCO

Como titular de sus datos personales, usted tiene derecho a acceder a ellos, a solicitar su rectificación cuando sean inexactos o estén desactualizados, a solicitar su cancelación cuando considere que no son tratados conforme a los principios y obligaciones que marca la ley, y a oponerse a su tratamiento para fines específicos (derechos “ARCO”). Para ejercer cualquiera de estos derechos, envíe una solicitud a [correo] que incluya su nombre, un medio para recibir nuestra respuesta, los documentos que acrediten su identidad (o, tratándose de un Establecimiento, su representación), y una descripción clara del dato y del derecho que desea ejercer. Le responderemos dentro de los plazos previstos por la LFPDPPP y, de proceder su solicitud, la haremos efectiva dentro de los quince días hábiles siguientes. Si usted es un usuario final, adicionalmente puede acceder y rectificar los datos de su perfil directamente desde la aplicación, y eliminar su cuenta en cualquier momento desde el menú Perfil y posteriormente la opción que diga “Eliminar mi cuenta”.

## Revocación del consentimiento

Usted puede revocar en cualquier momento el consentimiento que nos haya otorgado para el tratamiento de sus datos personales, ya sea de forma total o para finalidades específicas, escribiendo a [correo] o, si es usuario final, desde los ajustes de privacidad de la aplicación. La revocación del consentimiento necesario para las finalidades primarias descritas en Finalidades del tratamiento podrá implicar que dejemos de poder prestarle el Servicio o ejecutar el contrato correspondiente, según sea el caso, y no tiene efectos retroactivos respecto de los tratamientos realizados con anterioridad a que sea efectiva. Salvo por los tratamientos que este aviso identifica como sujetos a consentimiento expreso (geolocalización y comunicaciones de mercadotecnia), el tratamiento de sus datos no sensibles se rige por el consentimiento tácito derivado del uso continuado del Servicio, conforme al artículo 8 de la LFPDPPP.

## Medidas de seguridad

En caso de que ocurra una vulneración de seguridad en cualquier fase del tratamiento que afecte de forma significativa sus derechos patrimoniales o morales, se lo notificaremos de forma inmediata a través del correo electrónico registrado en su cuenta o mediante un aviso dentro de la aplicación, informándole la naturaleza del incidente, los datos comprometidos y las medidas correctivas adoptadas, conforme a lo previsto por la LFPDPPP.

## Identificadores técnicos, geolocalización y tecnologías similares

Cuando usted activa la búsqueda de Establecimientos cercanos, solicitamos el permiso de ubicación de su dispositivo conforme a los mecanismos propios de iOS y Android. Este dato se utiliza únicamente durante su sesión de uso para mostrarle resultados cercanos a su posición, no se conserva de forma histórica ni se comparte con Establecimientos o terceros para fines distintos, y usted puede negarlo en cualquier momento sin dejar de usar el catálogo mediante la búsqueda por texto o dirección. El fundamento de este tratamiento es su consentimiento expreso, otorgado a través del propio permiso del sistema operativo.

Con el fin de prevenir el uso fraudulento del Servicio (en particular, evitar que una persona eluda las consecuencias de reservaciones incumplidas de forma reiterada mediante la creación de cuentas adicionales), tratamos un identificador técnico derivado de las características de su dispositivo (“huella de dispositivo”), almacenado de forma cifrada. Este identificador se utiliza exclusivamente para dicha finalidad, no se comparte con Establecimientos ni con terceros, no se utiliza con fines de mercadotecnia, y no rastrea su actividad fuera de AFORO. Cualquier consecuencia que este tratamiento pueda tener sobre su cuenta está sujeta al derecho de réplica y revisión humana previsto en nuestros Términos y Condiciones de Uso, por lo que en ningún caso una suspensión se adopta de forma exclusivamente automatizada, sin posibilidad de que usted la controvierta.

AFORO no utiliza cookies publicitarias ni tecnologías de rastreo de terceros con fines de publicidad. Los identificadores técnicos que tratamos se limitan a los descritos en esta sección y a los datos de conexión señalados en Datos personales que recabamos de los usuarios, y en ningún caso se ceden a redes publicitarias.

## Cambios a este aviso

Podemos actualizar este aviso de privacidad en cualquier momento, en particular para reflejar la identidad definitiva de la responsable una vez constituida la sociedad mercantil titular del proyecto, o para confirmar la identidad y ubicación de nuestro proveedor de infraestructura tecnológica conforme a Transferencias de datos personales. La versión vigente estará siempre disponible dentro de la aplicación y en [dirección del sitio web]. Cuando una modificación implique nuevas finalidades que requieran su consentimiento, se lo solicitaremos nuevamente antes de aplicarla, y le notificaremos los cambios sustanciales mediante un aviso dentro de la aplicación o por correo electrónico.

## Autoridad competente

Si usted considera que su derecho a la protección de datos personales ha sido vulnerado, puede acudir ante la Secretaría Anticorrupción y Buen Gobierno, autoridad competente en materia de protección de datos personales en posesión de particulares conforme a la LFPDPPP vigente.

## Consentimiento

Si usted es un usuario final, al crear su cuenta y utilizar AFORO manifiesta haber leído y comprendido este aviso de privacidad, y otorga su consentimiento para el tratamiento de sus datos personales conforme a lo aquí descrito, salvo por aquellos tratamientos que, conforme a la ley, requieran un consentimiento expreso adicional (como el envío de comunicaciones promocionales o el uso de su ubicación), mismo que le solicitaremos de forma separada al momento correspondiente. Si usted es representante de un Establecimiento afiliado, dicho consentimiento se entiende otorgado al firmar el Contrato de Prestación de Servicios correspondiente y/o al utilizar el panel de administración de AFORO.

_Última actualización: 03 de agosto de 2026._$AVISOTXT$::text),
   'Texto completo del Aviso de Privacidad integral, mostrado dentro de la app'),
  ('global', 'terminos_uso_texto', to_jsonb($TCTXT$# Términos y Condiciones de Uso

## Quiénes somos y aceptación de estos Términos

AFORO es una aplicación móvil (disponible en iOS y Android) y un sitio web (el "Servicio") publicados por Manuel Argüelles Sierra (a título personal, en tanto no se constituya la sociedad mercantil titular del proyecto AFORO, momento en el cual esta identificación se sustituirá por la denominación social correspondiente), con domicilio en Parque Provenza, Lomas de Angelópolis III, Marsella 97, Puebla, Puebla, México. AFORO permite a sus usuarios consultar un catálogo de restaurantes, bares y antros ("Establecimientos") por ubicación o por búsqueda, generar reservaciones mediante código QR, y publicar reseñas y fotografías sobre los Establecimientos.

Al crear una cuenta o utilizar el Servicio de cualquier forma, usted acepta estos Términos y Condiciones de Uso (los "Términos") en su totalidad. Si no está de acuerdo con ellos, no debe utilizar AFORO. Le recomendamos leer también nuestro Aviso de Privacidad, que forma parte integrante de estos Términos.

Estos Términos incluyen, entre otras, las reglas sobre contenido generado por el usuario, las Normas de la Comunidad y las facultades de moderación descritas en las Secciones 8, 9 y 10, cuya observancia es condición para el uso del Servicio.

## Requisitos de uso y verificación de edad

El Servicio está disponible exclusivamente para su uso dentro de territorio mexicano y está dirigido únicamente a personas mayores de 18 años, en atención a la naturaleza de los Establecimientos que integran el catálogo (incluyendo bares y antros con venta de bebidas alcohólicas). Al registrarse, usted declara bajo protesta de decir verdad que cuenta con 18 años cumplidos y que reside o se encuentra en México. Nos reservamos el derecho de suspender o cancelar cuentas respecto de las cuales tengamos indicios razonables de que no cumplen con este requisito.

Cuando existan indicios razonables de que un usuario no cumple con el requisito de edad mínima antes señalado (incluyendo, entre otros, reportes de terceros, inconsistencias en la información proporcionada al registrarse, o el propio Contenido de Usuario publicado), AFORO podrá solicitarle, en cualquier momento, documentación oficial que acredite su edad. Mientras dicha documentación no sea proporcionada o no resulte satisfactoria a juicio razonable de AFORO, la cuenta correspondiente podrá suspenderse cautelarmente conforme a la Sección 10, sin que ello genere responsabilidad alguna a cargo de AFORO.

## Su cuenta

Para reservar, publicar reseñas o guardar fotografías necesita crear una cuenta con su nombre, correo electrónico, número de teléfono y una contraseña. Usted es responsable de mantener la confidencialidad de sus credenciales y de toda actividad que ocurra en su cuenta. Debe asegurarse de que la información que nos proporciona sea verdadera, vigente y precisa, y notificarnos de inmediato cualquier uso no autorizado de su cuenta. Un mismo número de teléfono, correo electrónico o dispositivo no puede utilizarse para crear varias cuentas con el propósito de eludir las medidas de esta política, incluida la política de inasistencias descrita en la Sección 7.

La creación o el uso de cuentas múltiples con el propósito de eludir estos Términos, o cualquier restricción, sanción o suspensión previamente impuesta por AFORO, constituye una conducta prohibida conforme a la Sección 11.2 (Prevención de fraude y manipulación de la plataforma).

## Permisos del dispositivo

Para operar determinadas funcionalidades del Servicio, la aplicación de AFORO puede solicitar su autorización para acceder a distintos permisos de su dispositivo móvil, incluyendo, según corresponda:

- ubicación, para mostrarle el catálogo de Establecimientos ordenado por cercanía y facilitar la búsqueda geográfica descrita en la Sección 5;

- cámara, para que usted pueda tomar fotografías destinadas a sus reseñas;

- galería o fototeca, para que usted pueda seleccionar y publicar fotografías existentes en su dispositivo; y

- notificaciones, para informarle sobre el estado de sus reservaciones, los avisos relacionados con la política de inasistencias descrita en la Sección 7, y demás comunicaciones relevantes sobre su cuenta.

Estos permisos son solicitados por el propio sistema operativo de su dispositivo (iOS o Android) conforme a sus reglas de privacidad, y usted puede otorgarlos, negarlos o revocarlos en cualquier momento desde la configuración de su dispositivo. Negar o revocar alguno de estos permisos no le impide utilizar el Servicio en lo general, pero podrá limitar o impedir el uso de las funcionalidades que dependen de dicho permiso (por ejemplo, la búsqueda por cercanía, la publicación de fotografías o la recepción de avisos sobre sus reservaciones).

El tratamiento de los datos personales que, en su caso, se obtengan a través de estos permisos (como su ubicación o las fotografías que publique) se realiza conforme a lo descrito en nuestro Aviso de Privacidad, el cual le recomendamos consultar.

## El catálogo y la búsqueda

AFORO le permite consultar el catálogo de Establecimientos afiliados mediante búsqueda por ubicación (activando el permiso de geolocalización de su dispositivo, conforme a lo descrito en la Sección 4) o por palabra clave. El orden y la información mostrada de cada Establecimiento son proporcionados y actualizados por AFORO con base en la información que cada Establecimiento nos entrega, por lo que no garantizamos que dicha información esté siempre actualizada al minuto; le recomendamos confirmar directamente con el Establecimiento cualquier dato relevante para su visita (horarios, aforo, política de acceso).

### 5.1 Composición del catálogo y cambios en los Establecimientos participantes

El catálogo de Establecimientos disponible en AFORO está integrado por comercios que han decidido afiliarse voluntariamente a la plataforma, por lo que su composición puede variar en cualquier momento. Un Establecimiento puede incorporarse al catálogo, salir de él, modificar sus horarios de atención, su política de acceso, de aforo o de cancelación, o dejar de colaborar con AFORO, todo ello por decisión propia del Establecimiento y sin que medie responsabilidad de AFORO frente a usted. AFORO no garantiza la permanencia de ningún Establecimiento específico dentro del catálogo, ni que las condiciones mostradas respecto de un Establecimiento se mantengan invariables entre la fecha en que usted consulta el catálogo y la fecha en que pretenda utilizar el Servicio respecto de dicho Establecimiento.

## Servicio de reservación mediante código QR

AFORO le permite generar una solicitud de reservación que, una vez confirmada por el Establecimiento, se traduce en un código QR que usted deberá presentar al llegar para que el personal del Establecimiento lo valide. Al realizar una reservación, usted celebra una relación directa con el Establecimiento correspondiente; AFORO no es parte de dicha relación, únicamente facilita el mecanismo de solicitud, confirmación y acceso. En consecuencia, AFORO no garantiza que el Establecimiento vaya a honrar la reservación, no es responsable de la calidad del servicio, de los alimentos, bebidas o entretenimiento que usted reciba, ni del cumplimiento de las políticas propias del Establecimiento (aforo, código de vestimenta, política de admisión).

AFORO no procesa pagos ni solicita datos de tarjeta bancaria dentro del Servicio: el consumo se paga directamente en el Establecimiento, por lo que no realizamos preautorizaciones ni cargos de garantía. Al momento de reservar, únicamente compartimos con el Establecimiento el nombre con el que usted registró la reservación, conforme a lo descrito en nuestro Aviso de Privacidad. Cualquier duda sobre disponibilidad, cambio de horario o política interna de acceso deberá dirigirla directamente al Establecimiento.

## Política de inasistencias ("usuarios fantasma")

Como en cualquier sistema de reservaciones, el valor de AFORO para los Establecimientos depende de que las reservaciones confirmadas se honren. Un "usuario fantasma" es aquel que solicita y confirma una reservación a través de AFORO y no se presenta a ella, ni la cancela con la anticipación mínima requerida conforme a esta Sección. Este comportamiento causa un perjuicio directo al Establecimiento, que reserva capacidad, personal y mesa con base en su confirmación.

### 7.1 Cómo cancelar

Si usted no puede asistir a una reservación confirmada, debe cancelarla desde la propia aplicación con al menos 2 horas de anticipación a la hora reservada, salvo que el Establecimiento haya establecido un plazo distinto para un evento específico, mismo que se le mostrará antes de confirmar su reservación. Cancelar dentro de este plazo no genera ninguna consecuencia en su cuenta.

### 7.2 Cómo se registra una inasistencia

Su reservación se considera cumplida cuando el código QR es validado por el personal del Establecimiento al momento de su llegada. Si el código QR no es validado dentro de los 60 minutos siguientes a la hora reservada y usted no canceló la reservación conforme al punto 7.1, AFORO registrará la reservación como una inasistencia con base en la información que el propio Establecimiento reporte a través de la plataforma. Usted acepta recibir una notificación por correo electrónico o dentro de la aplicación informándole que, conforme a nuestros registros, se generó una inasistencia en su cuenta, sea o no ese el caso.

### 7.3 Consecuencias por acumulación de inasistencias

- 1ª inasistencia en un periodo de 6 meses: aviso informativo dentro de la aplicación; sin restricción de uso.

- 2ª inasistencia en el mismo periodo: advertencia formal por correo electrónico, recordándole esta política.

- 3ª inasistencia en el mismo periodo: notificación de suspensión de su cuenta por 12 meses, sujeta al derecho de réplica descrito en el punto 7.4 antes de que la suspensión se haga efectiva.

Si usted no ejerce su derecho de réplica dentro del plazo señalado en el punto 7.4, o si AFORO, tras revisar su aclaración, confirma el registro de la tercera inasistencia, su cuenta quedará suspendida.

### 7.4 Derecho de réplica

Al registrarse su tercera inasistencia dentro del periodo señalado en el punto 7.3, y antes de que la suspensión de su cuenta se haga efectiva, AFORO le notificará por correo electrónico o dentro de la aplicación, otorgándole un plazo de 5 días hábiles para presentar sus aclaraciones a [correo de contacto], explicando las circunstancias del caso (por ejemplo, que el Establecimiento no validó su código QR a pesar de haberse presentado a tiempo). AFORO revisará la información disponible, incluyendo lo reportado por el Establecimiento, y le comunicará su determinación final. Si su aclaración resulta procedente, la inasistencia correspondiente se eliminará de su historial y su cuenta continuará activa sin restricción; en caso contrario, la suspensión se hará efectiva al vencimiento del plazo antes señalado.

### 7.5 Verificación y reservación fantasma reiterada

Para prevenir que una persona evada estas consecuencias creando una cuenta nueva, AFORO trata identificadores técnicos del dispositivo ("huella de dispositivo") conforme a lo descrito en la Sección 5 de nuestro Aviso de Privacidad. Esta información se utiliza exclusivamente para esta finalidad de prevención de fraude, no se comparte con Establecimientos ni con terceros, y no se utiliza con fines de mercadotecnia. Estas conductas también quedan comprendidas dentro de la política de prevención de fraude y manipulación de la plataforma descrita en la Sección 11.2.

### 7.6 Una reservación por persona y prohibición de reventa

Usted acepta utilizar el servicio de reservaciones únicamente para presentarse personalmente a la reservación que confirme, y a no generar más de una reservación activa para el mismo Establecimiento y el mismo horario. Queda estrictamente prohibida la reventa o el intento de reventa de reservaciones generadas a través de AFORO, lo cual constituye causa suficiente para cancelar la reservación correspondiente y, en caso de reincidencia, suspender su cuenta.

## Reseñas, fotografías y Contenido de Usuario

### 8.1 Qué es el Contenido de Usuario y garantías generales

AFORO le permite publicar reseñas, calificaciones, fotografías y comentarios sobre los Establecimientos que visite (en conjunto, el "Contenido de Usuario"). Al enviar Contenido de Usuario, usted garantiza que:

- es veraz, refleja su experiencia y opinión genuina, y no es engañoso, falso ni fraudulento;

- no contiene material ilícito, difamatorio, obsceno, discriminatorio, o que incite al odio, a la violencia, al acoso o a la discriminación por razón de origen étnico o nacional, género, edad, discapacidad, condición social, condiciones de salud, religión, opiniones, preferencias sexuales, estado civil o cualquier otro motivo;

- no contiene contenido sexual explícito ni material que exponga, explote o ponga en riesgo a personas menores de edad;

- no constituye spam, publicidad no autorizada ni manipulación de reseñas, conforme a lo descrito en la Sección 11;

- no busca hacerse pasar por otra persona, Establecimiento o representante de AFORO, conforme a la Sección 11.3;

- no infringe derechos de autor, marca, imagen o cualquier otro derecho de propiedad intelectual de terceros, conforme al procedimiento de la Sección 13; y

- no incluye datos personales de terceros sin su consentimiento.

Usted es el único responsable del Contenido de Usuario que publique. AFORO no respalda, valida ni garantiza la veracidad de ningún Contenido de Usuario, y su publicación no implica que AFORO comparta las opiniones ahí expresadas.

### 8.2 Contenido prohibido

Sin perjuicio de lo anterior, queda estrictamente prohibido publicar Contenido de Usuario que:

- constituya discurso de odio, apología de la violencia, amenazas, o incite a cometer un delito;

- tenga por objeto acosar, intimidar, humillar o exponer a otra persona, incluyendo al personal de un Establecimiento;

- discrimine o denigre a una persona o grupo de personas por cualquiera de los motivos señalados en la Sección 8.1;

- contenga desnudos, contenido sexual explícito o material que sexualice a menores de edad, cuya publicación además podrá ser reportada a las autoridades competentes conforme a la legislación aplicable;

- constituya información falsa presentada como verdadera con el propósito de engañar a otros usuarios o de dañar la reputación de un Establecimiento o de un tercero;

- suplante la identidad de otra persona, Establecimiento o representante de AFORO, conforme a la Sección 11.3;

- constituya spam, cadenas, publicidad no autorizada o cualquiera de las conductas descritas en la Sección 11.4; o

- forme parte de un esquema de manipulación de reseñas conforme a la Sección 11.5.

AFORO se reserva el derecho de retirar, ocultar o restringir la visibilidad de cualquier Contenido de Usuario que, a su juicio razonable, incumpla lo anterior, conforme a las facultades de moderación descritas en la Sección 10, así como de suspender o cancelar la cuenta del usuario responsable conforme a la Sección 17.

### 8.3 Fotografías y derechos de imagen

Al publicar fotografías a través de AFORO, usted declara y garantiza que cuenta con los derechos necesarios para hacerlo, y se obliga a no publicar fotografías que:

- vulneren la privacidad de terceros identificables sin su consentimiento;

- incluyan a personas menores de edad sin la autorización de quien ejerza su patria potestad o tutela;

- infrinjan derechos de imagen, de autor o cualquier otro derecho de propiedad intelectual de un tercero;

- revelen información confidencial de un Establecimiento o de un tercero (por ejemplo, documentos internos, datos de otros clientes o información no destinada a difusión pública); o

- vulneren cualquier otro derecho de terceros.

Si un tercero considera que una fotografía publicada a través de AFORO vulnera sus derechos, podrá presentar un reporte conforme al procedimiento descrito en la Sección 13.

### 8.4 Licencia sobre el Contenido de Usuario

Usted conserva la titularidad de los derechos de autor sobre su Contenido de Usuario. No obstante, al publicarlo a través del Servicio, usted otorga a AFORO una licencia mundial, no exclusiva, gratuita, transferible y sublicenciable para almacenar, usar, reproducir, adaptar (únicamente en lo necesario para su exhibición técnica, por ejemplo, cambios de formato o resolución), distribuir y exhibir dicho Contenido de Usuario dentro del catálogo de AFORO, en la página del Establecimiento correspondiente, y en los materiales de mercadotecnia de AFORO en cualquier medio, con la única finalidad de operar y promocionar el Servicio.

Esta licencia subsiste mientras el Contenido de Usuario permanezca publicado en el Servicio y, respecto de los usos ya realizados con anterioridad a su eliminación (por ejemplo, material de mercadotecnia ya distribuido), de forma irrevocable, sin que ello obligue a AFORO a retirar retroactivamente dicho material ya distribuido. Fuera de dichos usos previos, la licencia terminará respecto del Contenido de Usuario que sea eliminado por usted, retirado por AFORO conforme a la Sección 10, o que deba eliminarse con motivo de la baja de su cuenta conforme a la Sección 8.5 y la Sección 17.

### 8.5 Conservación y eliminación del Contenido de Usuario

Cuando usted elimine una reseña, calificación o fotografía específica, o cuando elimine su cuenta conforme a la Sección 17, dicho Contenido de Usuario dejará de estar visible dentro del Servicio dentro de un plazo razonable. AFORO podrá conservar copias del Contenido de Usuario eliminado exclusivamente en los supuestos y por los plazos descritos en la Sección 17.3, y su tratamiento se realizará conforme a lo dispuesto en nuestro Aviso de Privacidad.

Si considera que una reseña o fotografía de otro usuario incumple estos Términos, puede reportarla desde la propia aplicación conforme al procedimiento de moderación descrito en la Sección 10.

## Normas de la Comunidad y política de tolerancia cero

AFORO mantiene una política de tolerancia cero respecto de las siguientes conductas, ya sea que se manifiesten a través de Contenido de Usuario, mensajes, nombres de usuario, fotografías de perfil o cualquier otra interacción dentro del Servicio:

- discurso de odio y discriminación;

- violencia, apología de la violencia o amenazas;

- acoso, intimidación u hostigamiento hacia otros usuarios, Establecimientos o su personal;

- contenido sexual explícito;

- explotación, exposición o puesta en riesgo de personas menores de edad;

- spam, fraude o esquemas engañosos; y

- cualquier actividad ilícita conforme a la legislación mexicana aplicable.

El incumplimiento de estas Normas de la Comunidad podrá dar lugar, según la gravedad de la conducta y conforme a las facultades descritas en la Sección 10, a la eliminación del contenido correspondiente, a la suspensión temporal de la cuenta, o a la cancelación definitiva de la cuenta, sin perjuicio de que AFORO reporte la conducta a las autoridades competentes cuando la ley así lo exija o cuando razonablemente lo estime pertinente tratándose de conductas que puedan constituir un delito, en particular aquellas relacionadas con menores de edad.

## Moderación de contenido y de cuentas

### 10.1 Facultades de moderación

Para mantener la integridad, seguridad y confiabilidad del Servicio, AFORO podrá, en cualquier momento y a su juicio razonable:

- revisar el Contenido de Usuario publicado a través del Servicio, ya sea de forma aleatoria, automatizada, a partir de reportes de otros usuarios o Establecimientos, o por cualquier otro medio;

- ocultar, retirar o restringir la visibilidad de cualquier Contenido de Usuario que incumpla estos Términos o las Normas de la Comunidad descritas en la Sección 9;

- restringir determinadas funcionalidades del Servicio respecto de una cuenta específica; y

- suspender o cancelar cuentas conforme a lo descrito en la Sección 10.2 y en la Sección 17.

AFORO podrá ejercer estas facultades incluso antes de concluir una investigación completa sobre los hechos correspondientes, cuando ello resulte razonablemente necesario para proteger a otros usuarios, a los Establecimientos, a la plataforma o a terceros, sin que ello genere responsabilidad a cargo de AFORO ni derecho a indemnización alguna a favor del usuario afectado, sin perjuicio del derecho de réplica descrito en la Sección 10.3.

### 10.2 Suspensión inmediata de cuentas

Sin perjuicio de los demás supuestos de suspensión previstos en estos Términos, AFORO podrá suspender o cancelar de forma inmediata y sin previo aviso una cuenta cuando resulte razonablemente necesario para proteger:

- a otros usuarios del Servicio;

- a los Establecimientos o a su personal;

- la integridad, seguridad o disponibilidad de la plataforma;

- una investigación interna en curso relacionada con fraude, manipulación de la plataforma o incumplimiento de estos Términos; o

- el cumplimiento de una obligación legal, un requerimiento de una autoridad competente, o la seguridad informática del Servicio ante un riesgo de ciberseguridad.

### 10.3 Derecho de réplica

Cuando AFORO retire Contenido de Usuario o suspenda una cuenta conforme a esta Sección, notificará al usuario afectado por correo electrónico o dentro de la aplicación, indicando de forma general el motivo de la medida, salvo que dicha notificación pudiera comprometer una investigación en curso o resulte contraria a una disposición legal. El usuario podrá presentar sus aclaraciones a [correo] conforme al procedimiento de contacto descrito en la Sección 20. Lo anterior es independiente del derecho de réplica específico previsto en la Sección 7.4 respecto de la política de inasistencias.

## Política de uso aceptable y conductas prohibidas

### 11.1 Conductas prohibidas generales

Al utilizar AFORO, usted se compromete a no:

- usar el Servicio de forma ilegal o fraudulenta;

- interferir con la seguridad, disponibilidad o funcionamiento del Servicio;

- descompilar, aplicar ingeniería inversa o desensamblar la aplicación, salvo en los casos en que ello esté expresamente permitido por la legislación aplicable;

- utilizar robots, arañas o cualquier proceso automatizado para extraer datos del catálogo ("scraping"); ni

- realizar reservaciones con la intención de no presentarse, conforme a la política de la Sección 7.

El incumplimiento de esta política puede dar lugar a la suspensión o cancelación de su cuenta conforme a la Sección 10 y a la Sección 17, sin perjuicio de las acciones legales que correspondan.

### 11.2 Prevención de fraude y manipulación de la plataforma

Queda estrictamente prohibido:

- utilizar bots, scripts u otros medios de automatización para interactuar con el Servicio;

- crear o utilizar múltiples cuentas para eludir estos Términos, la política de inasistencias de la Sección 7, o cualquier restricción, sanción o suspensión previamente impuesta por AFORO;

- manipular o intentar manipular el algoritmo de posicionamiento del catálogo o de las recomendaciones del Servicio;

- generar reservaciones masivas o simuladas sin intención real de acudir a ellas;

- incurrir en cualquier esquema de fraude en perjuicio de AFORO, de los Establecimientos o de otros usuarios;

- abusar de promociones, códigos de descuento o beneficios ofrecidos a través del Servicio, incluyendo su uso fuera de los términos en que fueron otorgados; o

- crear cuentas de forma reiterada con el propósito de evadir una sanción, suspensión o cancelación previamente impuesta.

AFORO podrá utilizar señales técnicas (incluyendo identificadores de dispositivo conforme a lo descrito en la Sección 7.5), para detectar y prevenir estas conductas, y podrá suspender o cancelar de forma inmediata las cuentas involucradas conforme a la Sección 10.2, sin perjuicio de las acciones legales civiles o penales que correspondan.

### 11.3 Suplantación de identidad

Queda estrictamente prohibido crear una cuenta, publicar Contenido de Usuario, o comunicarse con otros usuarios o Establecimientos haciéndose pasar por: (i) otro usuario; (ii) un Establecimiento; (iii) un empleado o representante de un Establecimiento; o (iv) un administrador, empleado o representante de AFORO. La suplantación de identidad da lugar a la cancelación inmediata de la cuenta correspondiente conforme a la Sección 10.2, sin perjuicio de las acciones legales que, en su caso, correspondan conforme a la legislación civil y penal aplicable.

### 11.4 Spam y comunicaciones no autorizadas

Queda estrictamente prohibido utilizar el Servicio para:

- enviar publicidad, promociones o mensajes comerciales no autorizados por AFORO;

- realizar intentos de phishing o distribuir enlaces maliciosos;

- reenviar cadenas de mensajes o publicar contenido repetitivo sin un propósito genuino relacionado con la reseña de un Establecimiento;

- ofrecer, promocionar o vender productos o servicios ajenos a la finalidad del Servicio; o

- recolectar datos de contacto de otros usuarios o Establecimientos con fines distintos a los previstos en estos Términos.

### 11.5 Manipulación de reseñas y calificaciones

Queda estrictamente prohibido:

- comprar, vender o intercambiar reseñas o calificaciones, propias o de terceros;

- ofrecer o aceptar cualquier incentivo, económico o de otra naturaleza, a cambio de la publicación de una reseña, sea esta positiva o negativa;

- publicar reseñas sobre un Establecimiento que usted no haya visitado;

- crear cuentas falsas, o utilizar cuentas de terceros, con el propósito de alterar artificialmente la calificación o reputación de un Establecimiento; o

- coordinarse con otros usuarios para manipular de forma artificial las calificaciones de un Establecimiento, sea en beneficio o en perjuicio de este.

Un Establecimiento que incentive, solicite o participe en cualquiera de las conductas anteriores respecto de su propio catálogo o del de un competidor podrá ser retirado del catálogo de AFORO conforme a la Sección 5.1, sin perjuicio de las acciones legales que correspondan.

## Propiedad intelectual de AFORO

La marca AFORO, el software, el diseño, la base de datos del catálogo y todo el contenido generado directamente por nosotros (excluyendo el Contenido de Usuario y el material propio de cada Establecimiento) son de nuestra propiedad o de nuestros licenciantes, y están protegidos por la legislación mexicana e internacional en materia de propiedad intelectual. Le otorgamos una licencia limitada, personal, no exclusiva e intransferible para usar la aplicación y el sitio web para su uso personal y no comercial. Queda prohibida cualquier reproducción, distribución o explotación comercial del Servicio sin nuestra autorización previa y por escrito.

## Derechos de autor y propiedad intelectual de terceros

Si usted es titular de un derecho de autor, marca u otro derecho de propiedad intelectual y considera que Contenido de Usuario publicado a través de AFORO infringe dicho derecho, podrá presentar un reporte a [correo de contacto para reclamaciones de propiedad intelectual], indicando al menos:

- sus datos de contacto y, en su caso, los de su representante;

- identificación precisa del derecho presuntamente infringido y, de contar con ella, constancia de su titularidad (por ejemplo, registro ante el Instituto Mexicano de la Propiedad Industrial o constancia de la obra protegida);

- identificación del Contenido de Usuario presuntamente infractor y su ubicación dentro del Servicio; y

- una manifestación, bajo protesta de decir verdad, de que la información proporcionada es exacta y de que usted es el titular del derecho invocado o está autorizado para actuar en su representación.

Recibido un reporte que cumpla con lo anterior, AFORO podrá retirar u ocultar de forma inmediata y cautelar el Contenido de Usuario señalado, sin que ello implique un pronunciamiento sobre el fondo de la controversia. AFORO notificará al usuario que publicó el Contenido de Usuario retirado, quien podrá presentar su propia aclaración conforme al mismo procedimiento, incluyendo, en su caso, la documentación que acredite su derecho a utilizar el material controvertido.

AFORO podrá solicitar a cualquiera de las partes información o documentación adicional para resolver el reporte, y determinará, con base en la información disponible, si el Contenido de Usuario permanece retirado, se restituye, o si el asunto excede su ámbito de actuación, en cuyo caso corresponderá a las partes involucradas resolverlo directamente o ante la autoridad competente, incluyendo el Instituto Mexicano de la Propiedad Industrial, el Instituto Nacional del Derecho de Autor, o los tribunales competentes. Este procedimiento no sustituye ni limita las acciones legales que, conforme a la Ley Federal de Protección a la Propiedad Industrial o a la Ley Federal del Derecho de Autor, correspondan al titular del derecho.

## Enlaces y contenido de terceros

El Servicio puede contener enlaces a sitios web de Establecimientos o de terceros. No somos responsables del contenido ni de las prácticas de privacidad de dichos sitios; le recomendamos revisar sus propias políticas antes de proporcionarles información personal.

## Relación con los Establecimientos y exención de responsabilidad

AFORO actúa únicamente como un intermediario tecnológico que conecta a los usuarios con los Establecimientos participantes en el catálogo. AFORO no es agente, representante, socio, ni está asociado de ninguna otra forma con los Establecimientos, y no es parte de la relación de consumo que se genera entre usted y el Establecimiento a partir de una reservación.

Toda reservación realizada a través de AFORO queda sujeta a las políticas propias de cada Establecimiento (incluyendo, entre otras, sus políticas de aforo, código de vestimenta, admisión, consumo mínimo y cancelación), las cuales son determinadas y aplicadas exclusivamente por dicho Establecimiento, ajenas al control de AFORO, y podrán modificarse conforme a lo descrito en la Sección 5.1.

En consecuencia, y en la máxima medida permitida por la legislación mexicana, AFORO no será responsable frente a usted por:

- que el Establecimiento no honre una reservación confirmada por causas imputables a su propia gestión, incluyendo, entre otras, sobreventa de mesas, error en su calendario o falta de disponibilidad real al momento de su llegada;

- que se le niegue el acceso al Establecimiento por cualquier razón, incluyendo, entre otras, su política de admisión, código de vestimenta, aforo, o cualquier decisión unilateral del personal del Establecimiento;

- la calidad, cantidad, precio o condiciones de los alimentos, bebidas, entretenimiento o cualquier otro servicio prestado por el Establecimiento;

- cualquier lesión, daño, enfermedad, pérdida o perjuicio que usted sufra como resultado de su visita o interacción con el Establecimiento; y

- cualquier controversia derivada de la relación de consumo entre usted y el Establecimiento, incluyendo cobros, propinas, consumo mínimo o políticas de cancelación propias del Establecimiento.

Cualquier reclamación derivada de los supuestos anteriores deberá gestionarla y, en su caso, hacerla valer usted directamente frente al Establecimiento correspondiente, incluyendo, si así lo decide, mediante una queja ante la Procuraduría Federal del Consumidor (PROFECO) o cualquier otra vía legal aplicable. AFORO no es la vía para resolver disputas con Establecimientos; nuestra función se limita a facilitar la solicitud, confirmación y acceso mediante código QR descritos en la Sección 6.

En la máxima medida permitida por la ley, usted libera a AFORO de cualquier reclamación relacionada con su interacción con un Establecimiento, sin perjuicio de los derechos que, en materia de protección al consumidor, le reconozca de forma irrenunciable la legislación mexicana. Adicionalmente, y de forma general, AFORO tampoco será responsable por daños indirectos, incidentales o consecuentes derivados del uso o de la imposibilidad de uso del Servicio, ni de las decisiones que tomemos de buena fe conforme a la política de inasistencias de la Sección 7.

## Disponibilidad, mantenimiento y modificación del Servicio

AFORO no garantiza que el Servicio esté disponible de forma ininterrumpida o libre de errores. AFORO podrá, en cualquier momento y sin que ello genere responsabilidad a su cargo:

- realizar labores de mantenimiento programado o correctivo que impliquen la suspensión temporal, total o parcial, del Servicio;

- modificar, limitar o eliminar funcionalidades existentes;

- introducir nuevas funcionalidades o herramientas;

- retirar Establecimientos del catálogo conforme a lo descrito en la Sección 5.1;

- actualizar la aplicación o el sitio web, incluyendo cambios en sus requerimientos técnicos; y

- realizar cualquier otro cambio tecnológico que AFORO considere necesario por razones de mejora, seguridad, capacidad o cumplimiento legal.

Cuando resulte razonablemente posible, AFORO procurará informar con anticipación las interrupciones programadas del Servicio a través de la propia aplicación. AFORO no será responsable por la imposibilidad temporal de acceder al Servicio derivada de mantenimiento, mejoras, incidentes de seguridad, causas de fuerza mayor, o de cualquier requerimiento de una autoridad competente.

## Suspensión y terminación de su cuenta

### 17.1 Suspensión o cancelación por AFORO

Podemos suspender o cancelar su acceso al Servicio, sin previo aviso, cuando incumpla estos Términos (incluyendo la política de inasistencias de la Sección 7, las Normas de la Comunidad de la Sección 9, o la política de uso aceptable de la Sección 11), cuando exista sospecha razonable de fraude o de uso indebido conforme a la Sección 11.2, o cuando la ley así lo exija, todo ello conforme a las facultades de moderación descritas en la Sección 10.

### 17.2 Eliminación de su cuenta por usted

Usted puede eliminar su cuenta en cualquier momento desde la propia aplicación, en la sección de configuración de cuenta, o solicitándolo a través de los medios de contacto señalados en la Sección 20. Al eliminar su cuenta:

- perderá acceso a su historial de reservaciones y a cualquier código QR pendiente de validar, por lo que las reservaciones confirmadas y no utilizadas se considerarán canceladas;

- sus reseñas, calificaciones y fotografías podrán permanecer visibles dentro del catálogo de forma anónima o disociada de su cuenta, salvo que usted solicite expresamente su eliminación al momento de dar de baja su cuenta, en cuyo caso serán retiradas del Servicio dentro de un plazo razonable; y

- la licencia otorgada conforme a la Sección 8.4 terminará respecto del Contenido de Usuario que sea eliminado conforme al inciso anterior, sin perjuicio de los usos de mercadotecnia ya realizados con anterioridad.

### 17.3 Información que AFORO puede conservar tras la eliminación de la cuenta

No obstante lo anterior, AFORO podrá conservar cierta información, incluyendo Contenido de Usuario asociado a una cuenta eliminada, cuando resulte necesario para: (i) cumplir con obligaciones legales, fiscales o regulatorias aplicables; (ii) atender requerimientos de autoridades competentes; (iii) ejercer o defender derechos de AFORO, de un Establecimiento o de un tercero ante una controversia, reclamación o procedimiento en curso o razonablemente previsible, incluyendo los reportes descritos en la Sección 13; o (iv) prevenir fraude conforme a la Sección 11.2, en cuyo caso la información técnica correspondiente podrá conservarse por el plazo necesario para dicha finalidad. El tratamiento y plazo de conservación de datos personales en estos supuestos se rige por lo dispuesto en nuestro Aviso de Privacidad.

## Modificaciones a estos Términos

Podemos modificar estos Términos en cualquier momento, incluyendo los parámetros numéricos de la política de inasistencias descrita en la Sección 7; los cambios surtirán efecto al publicarse dentro de la aplicación o del sitio web. Su uso continuado del Servicio después de dicha publicación implica su aceptación de los cambios. Le recomendamos revisar estos Términos periódicamente.

## Legislación aplicable y jurisdicción

Estos Términos se rigen por las leyes federales de los Estados Unidos Mexicanos. Para cualquier controversia relacionada con estos Términos, usted y AFORO se someten a la jurisdicción de los tribunales competentes de la ciudad de Puebla, Puebla, renunciando a cualquier otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro, sin perjuicio de las disposiciones de protección al consumidor de aplicación forzosa.

## Contacto

Si tiene dudas sobre estos Términos, incluyendo la política de inasistencias, puede escribirnos a [correo] o a través del formulario de soporte disponible dentro de la aplicación.

Para presentar reportes relacionados con Contenido de Usuario que incumpla estas Normas, incluyendo reclamaciones por infracción de propiedad intelectual conforme a la Sección 13, puede utilizar la función de reporte disponible dentro de la aplicación o escribir a [correo].$TCTXT$::text),
   'Texto completo de los Términos y Condiciones de Uso, mostrado dentro de la app')
on conflict do nothing;


-- ===========================================================================
-- >>> migrations/0014_reportes_contenido.sql
-- ===========================================================================
-- AFORO · Reporte de contenido inapropiado (reseñas y sus fotos)
--
-- Los Términos de Uso que entregó el abogado (Sección 8, 9 y 10) exigen que
-- los usuarios puedan reportar Contenido de Usuario que incumpla las Normas
-- de la Comunidad. No existía ningún mecanismo para esto. Sigue el mismo
-- patrón que el acceso manual en puerta (CLAUDE.md §6): motivos configurables
-- sin código, el último ("Otro") exige nota, y escala al panel Cadena
-- (tabla `incidencias`, ya existente) para que el gerente del antro y Súper
-- Admin lo revisen — no se crea una tabla nueva de moderación.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'motivos_reporte_contenido',
   '["Contenido falso o engañoso","Discurso de odio o discriminación","Acoso o amenazas","Contenido sexual o inapropiado","Suplantación de identidad","Otro"]',
   'Motivos al reportar una reseña o foto (el último exige nota)')
on conflict do nothing;

-- Toda cuenta cliente puede reportar (igual que puede reseñar).
insert into permisos (rol, accion) values
  ('cliente', 'reportar_contenido')
on conflict (rol, accion) do nothing;


-- ===========================================================================
-- >>> seed.sql (datos demo: corporativos y antros de Puebla)
-- ===========================================================================
-- AFORO · Datos de demostración para Supabase (CLAUDE.md §11).
-- Espejo del seed local de la app. Ejecutar tras las migraciones.
-- Las reservas y usuarios se crean en tiempo de ejecución (requieren auth).

insert into corporativos (id, nombre, plan) values
  ('11111111-1111-1111-1111-111111111111', 'Grupo Nocturno Puebla', 'pro'),
  ('22222222-2222-2222-2222-222222222222', 'Distrito Angelópolis', 'pro')
on conflict (id) do nothing;

-- Feature flags por corporativo (qué módulos ve cada tenant).
insert into feature_flags (corporativo_id, clave, habilitado) values
  ('11111111-1111-1111-1111-111111111111', 'modulo_operacion', true),
  ('11111111-1111-1111-1111-111111111111', 'modulo_inteligencia', true),
  ('11111111-1111-1111-1111-111111111111', 'modulo_gestion', true),
  ('22222222-2222-2222-2222-222222222222', 'modulo_operacion', true),
  ('22222222-2222-2222-2222-222222222222', 'modulo_inteligencia', false),
  ('22222222-2222-2222-2222-222222222222', 'modulo_gestion', true)
on conflict (corporativo_id, clave) do nothing;

insert into antros (id, corporativo_id, nombre, descripcion, zona, direccion, lat, lng, horario, fotos, modalidades, ventana_cancelacion, al_llenar) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Lumen', 'Club de electrónica y house en el corazón de la Juárez.',
   'La Paz', 'Av. Juárez 2104, La Paz, Puebla', 19.0444, -98.2000,
   'Jue-Sáb 22:00 - 04:00',
   '{https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800}',
   '{acceso,mesa}', '18:00', 'lista_espera'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Terraza Cholula', 'Rooftop con reggaetón y vista a los volcanes.',
   'Cholula', 'Calle 14 Ote 611, San Pedro Cholula', 19.0634, -98.3072,
   'Mié-Sáb 21:00 - 03:00',
   '{https://images.unsplash.com/photo-1545128485-c400e7702796?w=800}',
   '{acceso,mesa}', '20:00', 'cerrar'),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Distrito 23', 'Antro multinivel en Angelópolis, hip-hop y comercial.',
   'Angelópolis', 'Blvd. del Niño Poblano 2510, Angelópolis', 19.0185, -98.2401,
   'Vie-Sáb 23:00 - 05:00',
   '{https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800}',
   '{acceso,mesa}', '21:00', 'lista_espera')
on conflict (id) do nothing;

insert into eventos (antro_id, corporativo_id, nombre, descripcion, fecha, fotos, cupo_maximo, modalidades, al_llenar) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Lumen presenta: ANNA', 'Noche de techno melódico con invitada internacional.',
   '2026-07-03T22:00:00Z',
   '{https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800}',
   300, '{acceso,mesa}', 'lista_espera'),
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'House Sessions', 'Residentes de la casa, entrada general.',
   '2026-07-04T22:00:00Z',
   '{https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800}',
   250, '{acceso,mesa}', 'cerrar'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Terraza Sunset', 'Reggaetón y mezcal al atardecer.',
   '2026-07-03T22:00:00Z',
   '{https://images.unsplash.com/photo-1556035511-3168381ea4d4?w=800}',
   150, '{acceso,mesa}', 'cerrar'),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Distrito Saturday', 'Hip-hop en planta baja, comercial arriba.',
   '2026-07-04T22:00:00Z',
   '{https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800}',
   400, '{acceso,mesa}', 'lista_espera')
on conflict do nothing;
