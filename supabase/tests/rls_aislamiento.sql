-- AFORO · Prueba de aislamiento multi-tenant a nivel RLS (última línea).
--
-- Complementa las pruebas de la lógica de las Edge Functions
-- (supabase/functions/_shared/decision.test.ts) verificando que la BASE DE
-- DATOS por sí sola impide que un usuario lea datos de otro corporativo, aun
-- si alguien saltara la capa de aplicación y consultara la API directamente.
--
-- Cómo correrla:
--   Pégala completa en el SQL Editor de Supabase DESPUÉS de aplicar todas las
--   migraciones (0001…0011). Corre dentro de una transacción y hace ROLLBACK
--   al final: no deja datos. Si alguna aserción falla, lanza una excepción con
--   el detalle; si todo pasa, verás el mensaje final "OK: aislamiento…".
--
-- Qué simula: dos corporativos (A y B), cada uno con su antro, su gerente y una
-- reserva de un cliente. Luego "inicia sesión" como cada usuario (fijando el
-- claim JWT que lee auth.uid()) y comprueba qué reservas ve.

begin;

-- Silencia los NOTICE de las inserciones para una salida limpia.
set local client_min_messages = warning;

do $$
declare
  corp_a uuid := gen_random_uuid();
  corp_b uuid := gen_random_uuid();
  antro_a uuid := gen_random_uuid();
  antro_b uuid := gen_random_uuid();
  evento_a uuid := gen_random_uuid();
  evento_b uuid := gen_random_uuid();
  gerente_a uuid := gen_random_uuid();
  gerente_b uuid := gen_random_uuid();
  cliente_a uuid := gen_random_uuid();
  cliente_b uuid := gen_random_uuid();
  reserva_a uuid := gen_random_uuid();
  reserva_b uuid := gen_random_uuid();
  visibles int;
begin
  -- --- Semilla mínima (con service_role / owner: omite RLS) -----------------
  -- Usuarios de auth (FK de public.usuarios). Inserción mínima habitual en
  -- Supabase; si tu instancia exige más columnas, agrégalas aquí.
  insert into auth.users (id, aud, role, email, created_at, updated_at)
  values
    (gerente_a, 'authenticated', 'authenticated', 'gerente_a@test.aforo', now(), now()),
    (gerente_b, 'authenticated', 'authenticated', 'gerente_b@test.aforo', now(), now()),
    (cliente_a, 'authenticated', 'authenticated', 'cliente_a@test.aforo', now(), now()),
    (cliente_b, 'authenticated', 'authenticated', 'cliente_b@test.aforo', now(), now());

  insert into corporativos (id, nombre) values (corp_a, 'Corp A'), (corp_b, 'Corp B');
  insert into antros (id, corporativo_id, nombre) values
    (antro_a, corp_a, 'Antro A'), (antro_b, corp_b, 'Antro B');

  insert into usuarios (id, nombre, email) values
    (gerente_a, 'Gerente A', 'gerente_a@test.aforo'),
    (gerente_b, 'Gerente B', 'gerente_b@test.aforo'),
    (cliente_a, 'Cliente A', 'cliente_a@test.aforo'),
    (cliente_b, 'Cliente B', 'cliente_b@test.aforo');

  insert into membresias (usuario_id, corporativo_id, antro_id, rol) values
    (gerente_a, corp_a, antro_a, 'gerente'),
    (gerente_b, corp_b, antro_b, 'gerente');

  insert into eventos (id, antro_id, corporativo_id, nombre, fecha, cupo_maximo) values
    (evento_a, antro_a, corp_a, 'Evento A', now(), 100),
    (evento_b, antro_b, corp_b, 'Evento B', now(), 100);

  insert into reservas (id, evento_id, antro_id, corporativo_id, cliente_id, modalidad, num_invitados) values
    (reserva_a, evento_a, antro_a, corp_a, cliente_a, 'acceso', 2),
    (reserva_b, evento_b, antro_b, corp_b, cliente_b, 'acceso', 2);

  -- A partir de aquí actuamos como usuarios normales sujetos a RLS.
  perform set_config('role', 'authenticated', true);

  -- === Aserción 1: el gerente A ve SOLO las reservas de su corporativo ======
  perform set_config('request.jwt.claims', json_build_object('sub', gerente_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into visibles from reservas;
  if visibles <> 1 then
    raise exception 'FALLO: gerente A ve % reservas (esperado 1, solo la de su corporativo)', visibles;
  end if;
  perform 1 from reservas where corporativo_id = corp_b;
  if found then
    raise exception 'FALLO CRÍTICO: gerente A alcanza una reserva del corporativo B';
  end if;
  reset role;

  -- === Aserción 2: el gerente B tampoco cruza (dirección inversa) ===========
  perform set_config('request.jwt.claims', json_build_object('sub', gerente_b, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into visibles from reservas where corporativo_id = corp_a;
  if visibles <> 0 then
    raise exception 'FALLO CRÍTICO: gerente B alcanza % reservas del corporativo A', visibles;
  end if;
  reset role;

  -- === Aserción 3: el cliente A ve su reserva, no la de otros ===============
  perform set_config('request.jwt.claims', json_build_object('sub', cliente_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  select count(*) into visibles from reservas;
  if visibles <> 1 then
    raise exception 'FALLO: cliente A ve % reservas (esperado 1: la suya)', visibles;
  end if;
  perform 1 from reservas where cliente_id = cliente_b;
  if found then
    raise exception 'FALLO CRÍTICO: cliente A alcanza la reserva del cliente B';
  end if;
  reset role;

  -- === Aserción 4: un cliente NO puede escribir reservas directamente =======
  -- (toda creación pasa por la Edge Function con service_role).
  perform set_config('request.jwt.claims', json_build_object('sub', cliente_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    insert into reservas (evento_id, antro_id, corporativo_id, cliente_id, modalidad, num_invitados)
    values (evento_a, antro_a, corp_a, cliente_a, 'acceso', 1);
    reset role;
    raise exception 'FALLO CRÍTICO: un cliente insertó una reserva directamente (RLS abierto)';
  exception when insufficient_privilege or check_violation then
    -- Esperado: RLS niega la escritura directa.
    reset role;
  end;

  -- === Aserción 5: un cliente NO puede auto-marcarse como verificado ========
  perform set_config('request.jwt.claims', json_build_object('sub', cliente_a, 'role', 'authenticated')::text, true);
  set local role authenticated;
  update usuarios set email_verificado = true where id = cliente_a;
  reset role;
  perform 1 from usuarios where id = cliente_a and email_verificado;
  if found then
    raise exception 'FALLO CRÍTICO: el cliente se marcó como verificado (trigger no protege)';
  end if;

  raise notice 'OK: aislamiento multi-tenant y protecciones RLS verificados (5/5).';
end $$;

rollback;
