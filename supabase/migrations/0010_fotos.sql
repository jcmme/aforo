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
