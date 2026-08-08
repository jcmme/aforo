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
