-- AFORO · Datos de demostración para Supabase (CLAUDE.md §11).
-- Espejo del seed local de la app. Ejecutar tras las migraciones.
-- Las reservas y usuarios se crean en tiempo de ejecución (requieren auth).

insert into corporativos (id, nombre, plan) values
  ('11111111-1111-1111-1111-111111111111', 'Grupo Nocturno Puebla', 'pro'),
  ('22222222-2222-2222-2222-222222222222', 'Distrito Angelópolis', 'pro')
on conflict (id) do nothing;

-- Feature flags por corporativo (qué módulos ve cada tenant).
insert into feature_flags (corporativo_id, clave, habilitado) values
  ('11111111-1111-1111-1111-111111111111', 'modulo_operacion', true),
  ('11111111-1111-1111-1111-111111111111', 'modulo_inteligencia', true),
  ('11111111-1111-1111-1111-111111111111', 'modulo_gestion', true),
  ('22222222-2222-2222-2222-222222222222', 'modulo_operacion', true),
  ('22222222-2222-2222-2222-222222222222', 'modulo_inteligencia', false),
  ('22222222-2222-2222-2222-222222222222', 'modulo_gestion', true)
on conflict (corporativo_id, clave) do nothing;

insert into antros (id, corporativo_id, nombre, descripcion, zona, direccion, lat, lng, horario, fotos, modalidades, ventana_cancelacion, al_llenar) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Lumen', 'Club de electrónica y house en el corazón de la Juárez.',
   'La Paz', 'Av. Juárez 2104, La Paz, Puebla', 19.0444, -98.2000,
   'Jue-Sáb 22:00 - 04:00',
   '{https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800}',
   '{acceso,mesa}', '18:00', 'lista_espera'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Terraza Cholula', 'Rooftop con reggaetón y vista a los volcanes.',
   'Cholula', 'Calle 14 Ote 611, San Pedro Cholula', 19.0634, -98.3072,
   'Mié-Sáb 21:00 - 03:00',
   '{https://images.unsplash.com/photo-1545128485-c400e7702796?w=800}',
   '{acceso,mesa}', '20:00', 'cerrar'),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Distrito 23', 'Antro multinivel en Angelópolis, hip-hop y comercial.',
   'Angelópolis', 'Blvd. del Niño Poblano 2510, Angelópolis', 19.0185, -98.2401,
   'Vie-Sáb 23:00 - 05:00',
   '{https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800}',
   '{acceso,mesa}', '21:00', 'lista_espera')
on conflict (id) do nothing;

insert into eventos (antro_id, corporativo_id, nombre, descripcion, fecha, fotos, cupo_maximo, modalidades, al_llenar) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'Lumen presenta: ANNA', 'Noche de techno melódico con invitada internacional.',
   '2026-07-03T22:00:00Z',
   '{https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800}',
   300, '{acceso,mesa}', 'lista_espera'),
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   'House Sessions', 'Residentes de la casa, entrada general.',
   '2026-07-04T22:00:00Z',
   '{https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800}',
   250, '{acceso,mesa}', 'cerrar'),
  ('a2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
   'Terraza Sunset', 'Reggaetón y mezcal al atardecer.',
   '2026-07-03T22:00:00Z',
   '{https://images.unsplash.com/photo-1556035511-3168381ea4d4?w=800}',
   150, '{acceso,mesa}', 'cerrar'),
  ('a3333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222',
   'Distrito Saturday', 'Hip-hop en planta baja, comercial arriba.',
   '2026-07-04T22:00:00Z',
   '{https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800}',
   400, '{acceso,mesa}', 'lista_espera')
on conflict do nothing;
