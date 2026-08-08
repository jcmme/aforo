-- AFORO · Reporte de contenido inapropiado (reseñas y sus fotos)
--
-- Los Términos de Uso que entregó el abogado (Sección 8, 9 y 10) exigen que
-- los usuarios puedan reportar Contenido de Usuario que incumpla las Normas
-- de la Comunidad. No existía ningún mecanismo para esto. Sigue el mismo
-- patrón que el acceso manual en puerta (CLAUDE.md §6): motivos configurables
-- sin código, el último ("Otro") exige nota, y escala al panel Cadena
-- (tabla `incidencias`, ya existente) para que el gerente del antro y Súper
-- Admin lo revisen — no se crea una tabla nueva de moderación.

insert into config_parametros (scope, clave, valor, descripcion) values
  ('global', 'motivos_reporte_contenido',
   '["Contenido falso o engañoso","Discurso de odio o discriminación","Acoso o amenazas","Contenido sexual o inapropiado","Suplantación de identidad","Otro"]',
   'Motivos al reportar una reseña o foto (el último exige nota)')
on conflict do nothing;

-- Toda cuenta cliente puede reportar (igual que puede reseñar).
insert into permisos (rol, accion) values
  ('cliente', 'reportar_contenido')
on conflict (rol, accion) do nothing;
