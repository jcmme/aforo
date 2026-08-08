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
