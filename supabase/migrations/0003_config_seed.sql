-- AFORO · Seed de configuración (no tenant-specific): matriz de permisos,
-- parámetros de negocio editables e insignias base. Configuración sin código
-- (CLAUDE.md §2, §5, §6). Editable después desde el panel de Súper Admin.

-- ---------------------------------------------------------------------------
-- Matriz de permisos (CLAUDE.md §5). Denegación por defecto: solo se insertan
-- las combinaciones permitidas. "Capitán" = operativo+social (rol 'capitan').
-- "Gerente" = individual+general. Dueño/socios: visibilidad de consulta.
-- ---------------------------------------------------------------------------
insert into permisos (rol, accion) values
  ('cliente','crear_reserva'),
  ('capitan','crear_reserva'), ('gerente','crear_reserva'),
  ('gerente_general','crear_reserva'), ('super_admin','crear_reserva'),

  ('capitan','compartir_qr'),

  ('cliente','cancelar_reserva_propia'),

  ('cadenero','escanear_puerta'), ('hostess','escanear_puerta'),
  ('cadenero','marcar_llego'), ('hostess','marcar_llego'),
  ('cadenero','acceso_manual'), ('hostess','acceso_manual'),
  ('cadenero','override_amarillo'), ('hostess','override_amarillo'),
  ('cadenero','contador_sin_reserva'),

  ('cajero','capturar_consumo'), ('super_admin','capturar_consumo'),
  ('cajero','consultar_consumo_minimo'), ('super_admin','consultar_consumo_minimo'),

  ('hostess','asignar_mover_mesa'), ('capitan','asignar_mover_mesa'),
  ('gerente','asignar_mover_mesa'), ('gerente_general','asignar_mover_mesa'),

  ('capitan','escanear_mesa'),
  ('capitan','hacer_cumplir_minimo'),
  ('capitan','acuse_promo'), ('super_admin','acuse_promo'),

  ('capitan','ver_desempeno_rps'), ('gerente','ver_desempeno_rps'),
  ('gerente_general','ver_desempeno_rps'), ('dueno','ver_desempeno_rps'),
  ('socio','ver_desempeno_rps'), ('super_admin','ver_desempeno_rps'),

  ('gerente','ver_metricas_antro'), ('gerente_general','ver_metricas_antro'),
  ('dueno','ver_metricas_antro'), ('socio','ver_metricas_antro'),
  ('super_admin','ver_metricas_antro'),

  ('gerente','exportar_datos'), ('gerente_general','exportar_datos'),
  ('dueno','exportar_datos'), ('socio','exportar_datos'),
  ('super_admin','exportar_datos'),

  ('gerente','panel_cadena'), ('gerente_general','panel_cadena'),
  ('dueno','panel_cadena'), ('socio','panel_cadena'),
  ('super_admin','panel_cadena'),

  ('gerente','gestionar_personal'), ('gerente_general','gestionar_personal'),
  ('super_admin','gestionar_personal'),

  ('capitan','gestionar_invitaciones'), ('gerente','gestionar_invitaciones'),
  ('gerente_general','gestionar_invitaciones'), ('super_admin','gestionar_invitaciones'),

  ('super_admin','cargar_promociones'),
  ('super_admin','alta_corporativos'),
  ('super_admin','feature_flags_planes')
on conflict (rol, accion) do nothing;

-- ---------------------------------------------------------------------------
-- Parámetros de negocio globales (editables; precedencia antro > corp > global)
-- ---------------------------------------------------------------------------
insert into config_parametros (scope, clave, valor, descripcion) values
  ('global','ventana_cancelacion_default', '"18:00"', 'Hora límite de cancelación sin penalización'),
  ('global','consumo_minimo_mesa_default', '5000', 'Consumo mínimo por mesa (MXN) por defecto'),
  ('global','invitacion_caducidad_horas', '72', 'Caducidad de invitaciones de personal'),
  ('global','invitacion_intentos_max', '3', 'Intentos fallidos antes de bloquear ingreso de códigos'),
  ('global','login_intentos_max', '5', 'Intentos fallidos de login antes de bloqueo temporal'),
  ('global','score_umbral_fantasma', '60', 'Umbral del score para alerta de fantasma'),
  ('global','hito_constancia_reservas', '15', 'Reservas completas en una noche'),
  ('global','hito_maquina_ventas_monto', '250000', 'Consumo en una noche (MXN)'),
  ('global','hito_confiabilidad_showrate', '0.85', 'Show rate sostenido en el mes'),
  ('global','hito_cero_fantasmas_dias', '30', 'Días sin no-shows'),
  ('global','hito_volumen_historico', '1000', 'Personas traídas en total'),
  ('global','texto_confirmacion_reserva', '"Tu reserva está confirmada. Comparte tus QR con tus invitados."', 'Texto de la notificación de confirmación')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Insignias base (CLAUDE.md §6 — hitos). Cifras configurables.
-- ---------------------------------------------------------------------------
insert into insignias (clave, nombre, descripcion) values
  ('constancia','Constancia','15 reservas completas en una noche'),
  ('maquina_ventas','Máquina de ventas','250 mil en consumo en una noche'),
  ('confiabilidad','Confiabilidad','Show rate ≥ 85% sostenido en el mes'),
  ('cero_fantasmas','Cero fantasmas','Un mes sin no-shows'),
  ('volumen_historico','Volumen histórico','1,000 personas traídas en total')
on conflict (clave) do nothing;
