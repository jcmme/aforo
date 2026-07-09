import type { ItemMenu, Rol } from '@/types';

// Tarjetas del "home" de cada rol. Cada tarjeta puede llevar una `accion` de la
// matriz de permisos; el tablero solo muestra las que el rol tiene permitidas
// (denegación por defecto). El cadenero no usa menú (su vista es de dos botones).

const MENUS: Partial<Record<Rol, ItemMenu[]>> = {
  hostess: [
    { clave: 'puerta', titulo: 'Puerta', subtitulo: 'Escanear QR · semáforo', ruta: '/(staff)/escanear', accion: 'escanear_puerta' },
    { clave: 'mesas', titulo: 'Mesas', subtitulo: 'Asignar y mover mesa', ruta: '/(staff)/hostess', accion: 'asignar_mover_mesa' },
    { clave: 'tyc', titulo: 'T&C del antro', subtitulo: 'Si eres el responsable asignado', ruta: '/(staff)/tyc-antro', accion: 'editar_tyc' },
  ],
  capitan: [
    { clave: 'mesa', titulo: 'Escanear mesa', subtitulo: 'Reserva · promo · consumo', ruta: '/(staff)/capitan', accion: 'escanear_mesa' },
    { clave: 'nueva-reserva', titulo: 'Nueva reserva', subtitulo: 'Registrar a un invitado', ruta: '/(staff)/nueva-reserva', accion: 'crear_reserva' },
    { clave: 'perfil', titulo: 'Mi perfil', subtitulo: 'Insignias y métricas', ruta: '/(staff)/perfil' },
    { clave: 'desempeno', titulo: 'Desempeño de RPs', subtitulo: 'Ranking semanal', ruta: '/(staff)/ranking', accion: 'ver_desempeno_rps' },
    { clave: 'invitaciones', titulo: 'Invitaciones', subtitulo: 'Invitar RPs', ruta: '/(staff)/invitaciones', accion: 'gestionar_invitaciones' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
    { clave: 'tyc', titulo: 'T&C del antro', subtitulo: 'Si eres el responsable asignado', ruta: '/(staff)/tyc-antro', accion: 'editar_tyc' },
  ],
  cajero: [
    { clave: 'consumo', titulo: 'Capturar consumo', subtitulo: 'Al cierre de cuenta', ruta: '/(staff)/cajero-consumo', accion: 'capturar_consumo' },
    { clave: 'minimos', titulo: 'C. Mínimos', subtitulo: 'Referencia (solo lectura)', ruta: '/(staff)/cajero-minimos', accion: 'consultar_consumo_minimo' },
    { clave: 'tyc', titulo: 'T&C del antro', subtitulo: 'Si eres el responsable asignado', ruta: '/(staff)/tyc-antro', accion: 'editar_tyc' },
  ],
  rp: [
    { clave: 'crear', titulo: 'Crear reserva', subtitulo: 'Explorar antros y eventos', ruta: '/(cliente)', accion: 'crear_reserva' },
    { clave: 'nueva-reserva', titulo: 'Nueva reserva', subtitulo: 'Registrar a un invitado', ruta: '/(staff)/nueva-reserva', accion: 'crear_reserva' },
    { clave: 'perfil', titulo: 'Mi perfil', subtitulo: 'Insignias y métricas', ruta: '/(staff)/perfil' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
    { clave: 'ranking', titulo: 'Ranking', subtitulo: 'Posición semanal', ruta: '/(staff)/ranking' },
    { clave: 'tyc', titulo: 'T&C del antro', subtitulo: 'Si eres el responsable asignado', ruta: '/(staff)/tyc-antro', accion: 'editar_tyc' },
  ],
  gerente: [
    { clave: 'metricas', titulo: 'Métricas', subtitulo: 'Afluencia, penetración, RPs', ruta: '/(staff)/metricas', accion: 'ver_metricas_antro' },
    { clave: 'cadena', titulo: 'Panel Cadena', subtitulo: 'Incidencias', ruta: '/(staff)/cadena', accion: 'panel_cadena' },
    { clave: 'fantasmas', titulo: 'Fantasmas', subtitulo: 'Scores y alertas', ruta: '/(staff)/fantasmas', accion: 'panel_cadena' },
    { clave: 'datos', titulo: 'Datos extraíbles', subtitulo: '7 reportes', ruta: '/(staff)/datos', accion: 'exportar_datos' },
    { clave: 'invitaciones', titulo: 'Invitaciones', subtitulo: 'Alta de personal', ruta: '/(staff)/invitaciones', accion: 'gestionar_invitaciones' },
    { clave: 'desempeno', titulo: 'Desempeño de RPs', subtitulo: 'Ranking semanal', ruta: '/(staff)/ranking', accion: 'ver_desempeno_rps' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
    { clave: 'tyc', titulo: 'T&C del antro', subtitulo: 'Si eres el responsable asignado', ruta: '/(staff)/tyc-antro', accion: 'editar_tyc' },
  ],
  super_admin: [
    { clave: 'parametros', titulo: 'Parámetros', subtitulo: 'Editar sin código', ruta: '/(staff)/sa-parametros', accion: 'feature_flags_planes' },
    { clave: 'sa-tyc', titulo: 'Aprobar T&C', subtitulo: 'Cola de cambios pendientes', ruta: '/(staff)/sa-tyc', accion: 'aprobar_tyc' },
    { clave: 'promociones', titulo: 'Promociones', subtitulo: 'Crear y asignar', ruta: '/(staff)/sa-promociones', accion: 'cargar_promociones' },
    { clave: 'sa-fotos', titulo: 'Aprobar fotos', subtitulo: 'Fotos de antros pendientes', ruta: '/(staff)/sa-fotos', accion: 'moderar_fotos' },
    { clave: 'corporativos', titulo: 'Corporativos', subtitulo: 'Alta, flags, suspender', ruta: '/(staff)/sa-corporativos', accion: 'alta_corporativos' },
    { clave: 'planes', titulo: 'Planes y cobro', subtitulo: 'Tier de suscripción', ruta: '/(staff)/sa-planes', accion: 'feature_flags_planes' },
    { clave: 'salud', titulo: 'Salud del producto', subtitulo: 'Adopción por corporativo', ruta: '/(staff)/sa-salud', accion: 'feature_flags_planes' },
    { clave: 'auditoria', titulo: 'Auditoría', subtitulo: 'Bitácora global', ruta: '/(staff)/sa-auditoria', accion: 'feature_flags_planes' },
    { clave: 'datos', titulo: 'Datos extraíbles', subtitulo: '7 reportes (toda la plataforma)', ruta: '/(staff)/datos', accion: 'exportar_datos' },
    { clave: 'fantasmas', titulo: 'Fantasmas', subtitulo: 'Scores y alertas', ruta: '/(staff)/fantasmas', accion: 'panel_cadena' },
  ],
};

/** Tarjetas del menú de un rol (sin filtrar por permiso; eso lo hace la vista). */
export function menuDeRol(rol: Rol): ItemMenu[] {
  return MENUS[rol] ?? [];
}
