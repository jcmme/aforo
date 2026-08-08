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
