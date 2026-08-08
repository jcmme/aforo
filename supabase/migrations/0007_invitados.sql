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
