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
