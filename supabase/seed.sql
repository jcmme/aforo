-- AFORO · Datos de ejemplo (espejo del modo demo de la app).
-- Ejecutar después de 0001_init.sql.

insert into corporativos (id, nombre) values
  ('11111111-1111-1111-1111-111111111111', 'Grupo Noche CDMX'),
  ('22222222-2222-2222-2222-222222222222', 'Distrito Antros')
on conflict (id) do nothing;

insert into venues
  (corporativo_id, nombre, descripcion, zona, direccion, lat, lng, horario, cover, tipos_musica, fotos, ocupacion)
values
  ('11111111-1111-1111-1111-111111111111', 'Neón Roma',
   'Antro de electrónica con terraza en el corazón de la Roma.',
   'Roma Norte', 'Álvaro Obregón 120, Roma Nte.', 19.4181, -99.1626,
   'Jue-Sáb 22:00 - 04:00', 250, '{electronica,pop}',
   '{https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800}', 'lleno'),

  ('11111111-1111-1111-1111-111111111111', 'Cielo Condesa',
   'Rooftop con vista, reggaetón y mezcal.',
   'Condesa', 'Av. Tamaulipas 55, Hipódromo Condesa', 19.4110, -99.1755,
   'Mié-Sáb 21:00 - 03:00', 150, '{reggaeton,variado}',
   '{https://images.unsplash.com/photo-1545128485-c400e7702796?w=800}', 'moderado'),

  ('22222222-2222-2222-2222-222222222222', 'Bajo Polanco',
   'Club exclusivo, lista y reservados.',
   'Polanco', 'Presidente Masaryk 250, Polanco', 19.4326, -99.1962,
   'Vie-Sáb 23:00 - 05:00', 500, '{hiphop,reggaeton}',
   '{https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800}', 'vacio'),

  ('22222222-2222-2222-2222-222222222222', 'Tropicana Centro',
   'Salón de baile con banda en vivo.',
   'Centro', 'República de Cuba 95, Centro Histórico', 19.4385, -99.1366,
   'Jue-Dom 20:00 - 02:00', 100, '{banda,variado}',
   '{https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800}', 'moderado')
on conflict do nothing;
