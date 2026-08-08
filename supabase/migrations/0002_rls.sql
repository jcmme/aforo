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
