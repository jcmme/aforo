import type { ItemMenu, Rol } from '@/types';

// Tarjetas del "home" de cada rol. Cada tarjeta puede llevar una `accion` de la
// matriz de permisos; el tablero solo muestra las que el rol tiene permitidas
// (denegación por defecto). El cadenero no usa menú (su vista es de dos botones).

const MENUS: Partial<Record<Rol, ItemMenu[]>> = {
  hostess: [
    { clave: 'puerta', titulo: 'Puerta', subtitulo: 'Escanear QR · semáforo', ruta: '/(staff)/escanear', accion: 'escanear_puerta' },
    { clave: 'mesas', titulo: 'Mesas', subtitulo: 'Asignar y mover mesa', ruta: '/(staff)/hostess', accion: 'asignar_mover_mesa' },
  ],
  capitan: [
    { clave: 'mesa', titulo: 'Escanear mesa', subtitulo: 'Reserva · promo · consumo', ruta: '/(staff)/capitan', accion: 'escanear_mesa' },
    { clave: 'desempeno', titulo: 'Desempeño de RPs', subtitulo: 'Ranking semanal', ruta: '/(staff)/ranking', accion: 'ver_desempeno_rps' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
  ],
  cajero: [
    { clave: 'consumo', titulo: 'Capturar consumo', subtitulo: 'Al cierre de cuenta', ruta: '/(staff)/cajero-consumo', accion: 'capturar_consumo' },
    { clave: 'minimos', titulo: 'C. Mínimos', subtitulo: 'Referencia (solo lectura)', ruta: '/(staff)/cajero-minimos', accion: 'consultar_consumo_minimo' },
  ],
  rp: [
    { clave: 'crear', titulo: 'Crear reserva', subtitulo: 'Explorar antros y eventos', ruta: '/(cliente)', accion: 'crear_reserva' },
    { clave: 'perfil', titulo: 'Mi perfil', subtitulo: 'Insignias y métricas', ruta: '/(staff)/perfil-rp' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
    { clave: 'ranking', titulo: 'Ranking', subtitulo: 'Posición semanal', ruta: '/(staff)/ranking' },
  ],
  gerente: [
    { clave: 'fantasmas', titulo: 'Detección de fantasmas', subtitulo: 'Scores y alertas', ruta: '/(staff)/fantasmas', accion: 'panel_cadena' },
    { clave: 'desempeno', titulo: 'Desempeño de RPs', subtitulo: 'Ranking semanal', ruta: '/(staff)/ranking', accion: 'ver_desempeno_rps' },
    { clave: 'feed', titulo: 'Red social', subtitulo: 'Logros del staff', ruta: '/(staff)/feed' },
  ],
};

/** Tarjetas del menú de un rol (sin filtrar por permiso; eso lo hace la vista). */
export function menuDeRol(rol: Rol): ItemMenu[] {
  return MENUS[rol] ?? [];
}
