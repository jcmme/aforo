-- AFORO · Ronda 6: preparación para tiendas
-- Google Play exige un enlace al aviso de privacidad DENTRO de la app.
-- La URL vive como parámetro editable (configuración sin código): cuando el
-- abogado entregue la versión definitiva en el dominio propio, se cambia
-- aquí sin publicar una actualización de la app.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'aviso_privacidad_url',
   '"https://jcmme.github.io/aforo/aviso-privacidad.html"',
   'URL pública del aviso de privacidad (sustituir por la del dominio propio al tener la versión legal)')
on conflict do nothing;
