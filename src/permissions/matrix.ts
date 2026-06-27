import type { Accion, Rol } from '@/types';

/**
 * Espejo en cliente de la matriz de permisos (CLAUDE.md §5), usado SOLO para
 * mostrar/ocultar UI. La validación real es server-side (tabla `permisos` +
 * Edge Functions), bajo denegación por defecto. Nunca confíes en este archivo
 * para autorizar una acción sensible.
 *
 * Capitán agrupa operativo y social. Gerente agrupa individual y general.
 */
const MATRIZ: Record<Accion, Rol[]> = {
  // El RP crea reservas y comparte QR (CLAUDE.md §4), aunque la tabla §5 no lo
  // liste como columna; se reconcilia aquí.
  crear_reserva: ['cliente', 'rp', 'capitan', 'gerente', 'super_admin'],
  compartir_qr: ['capitan', 'rp'],
  cancelar_reserva_propia: ['cliente'],
  escanear_puerta: ['cadenero', 'hostess'],
  marcar_llego: ['cadenero', 'hostess'],
  acceso_manual: ['cadenero', 'hostess'],
  override_amarillo: ['cadenero', 'hostess'],
  contador_sin_reserva: ['cadenero'],
  capturar_consumo: ['cajero', 'super_admin'],
  consultar_consumo_minimo: ['cajero', 'super_admin'],
  asignar_mover_mesa: ['hostess', 'capitan', 'gerente'],
  escanear_mesa: ['capitan'],
  hacer_cumplir_minimo: ['capitan'],
  acuse_promo: ['capitan', 'super_admin'],
  ver_desempeno_rps: ['capitan', 'gerente', 'super_admin'],
  ver_metricas_antro: ['gerente', 'super_admin'],
  exportar_datos: ['gerente', 'super_admin'],
  panel_cadena: ['gerente', 'super_admin'],
  gestionar_personal: ['gerente', 'super_admin'],
  gestionar_invitaciones: ['capitan', 'gerente', 'super_admin'],
  cargar_promociones: ['super_admin'],
  alta_corporativos: ['super_admin'],
  feature_flags_planes: ['super_admin'],
};

/** Gerente general comparte permisos de gerente; se normaliza aquí. */
function normalizarRol(rol: Rol): Rol {
  if (rol === 'gerente_general') return 'gerente';
  // Dueño y socios tienen visibilidad total de consulta; se tratan como gerente
  // para efectos de UI (el alcance real lo acota el aislamiento por tenant).
  if (rol === 'dueno' || rol === 'socio') return 'gerente';
  return rol;
}

/** ¿El rol puede ver/intentar esta acción en la UI? (no autoriza de verdad) */
export function puede(rol: Rol | null | undefined, accion: Accion): boolean {
  if (!rol) return false;
  return MATRIZ[accion].includes(normalizarRol(rol));
}
