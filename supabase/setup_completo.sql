-- AFORO · Setup COMPLETO en un solo archivo.
-- Incluye: las 11 migraciones (tablas + RLS + endurecimiento de seguridad)
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

