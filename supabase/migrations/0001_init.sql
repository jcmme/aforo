-- AFORO · Esquema inicial (MVP)
-- Multi-tenant: corporativos -> venues, aislados por Row-Level Security.
-- Ejecutar en el SQL Editor de Supabase o vía `supabase db push`.

create extension if not exists postgis;

-- ---------------------------------------------------------------------------
-- Tipos
-- ---------------------------------------------------------------------------
do $$ begin
  create type occupancy_level as enum ('vacio', 'moderado', 'lleno');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_role as enum ('cliente', 'venue_staff');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Corporativos (tenants)
-- ---------------------------------------------------------------------------
create table if not exists corporativos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  creado_en   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Perfiles (extienden auth.users)
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  nombre          text,
  rol             user_role not null default 'cliente',
  corporativo_id  uuid references corporativos (id) on delete set null,
  creado_en       timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Venues (antros)
-- ---------------------------------------------------------------------------
create table if not exists venues (
  id                    uuid primary key default gen_random_uuid(),
  corporativo_id        uuid not null references corporativos (id) on delete cascade,
  nombre                text not null,
  descripcion           text,
  zona                  text not null,
  direccion             text not null,
  lat                   double precision not null,
  lng                   double precision not null,
  -- Punto geográfico para consultas de cercanía (PostGIS).
  geom                  geography(Point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,
  horario               text not null default '',
  cover                 integer not null default 0,
  tipos_musica          text[] not null default '{}',
  fotos                 text[] not null default '{}',
  ocupacion             occupancy_level not null default 'vacio',
  ocupacion_actualizada timestamptz not null default now(),
  creado_en             timestamptz not null default now()
);

create index if not exists venues_geom_idx on venues using gist (geom);
create index if not exists venues_zona_idx on venues (zona);
create index if not exists venues_corporativo_idx on venues (corporativo_id);

-- ---------------------------------------------------------------------------
-- RPC: lugares cercanos ordenados por distancia
-- ---------------------------------------------------------------------------
create or replace function nearby_venues(
  in_lat double precision,
  in_lng double precision,
  in_radio_m integer default 5000
)
returns table (like venues including all)
language sql stable
as $$
  select v.*
  from venues v
  where st_dwithin(
    v.geom,
    st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography,
    in_radio_m
  )
  order by v.geom <-> st_setsrid(st_makepoint(in_lng, in_lat), 4326)::geography;
$$;

-- ---------------------------------------------------------------------------
-- Row-Level Security
-- ---------------------------------------------------------------------------
alter table corporativos enable row level security;
alter table profiles     enable row level security;
alter table venues       enable row level security;

-- Helper: corporativo del usuario autenticado.
create or replace function auth_corporativo_id()
returns uuid
language sql stable
as $$
  select corporativo_id from profiles where id = auth.uid();
$$;

-- Perfiles: cada quien ve y edita el suyo.
drop policy if exists "perfil propio (lectura)" on profiles;
create policy "perfil propio (lectura)" on profiles
  for select using (auth.uid() = id);

drop policy if exists "perfil propio (escritura)" on profiles;
create policy "perfil propio (escritura)" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Venues: lectura pública (clientes los descubren sin login).
drop policy if exists "venues lectura publica" on venues;
create policy "venues lectura publica" on venues
  for select using (true);

-- Venues: sólo el staff de su corporativo puede crear/editar.
drop policy if exists "venues escritura por corporativo" on venues;
create policy "venues escritura por corporativo" on venues
  for all
  using (corporativo_id = auth_corporativo_id())
  with check (corporativo_id = auth_corporativo_id());

-- Corporativos: lectura del propio.
drop policy if exists "corporativo propio" on corporativos;
create policy "corporativo propio" on corporativos
  for select using (id = auth_corporativo_id());
