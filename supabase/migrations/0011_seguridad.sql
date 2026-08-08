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
