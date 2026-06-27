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
