/**
 * Permisos de la plataforma (de quien opera Aforo), no de un cliente. Ningún
 * rol de cliente los recibe en el seed; solo el Súper Admin los tiene, y
 * únicamente en su vista propia — cuando "entra como" un cliente los pierde,
 * para ver exactamente lo que ve ese cliente.
 */
export const PERMISOS_PLATAFORMA: ReadonlySet<string> = new Set([
  'onboarding.crear_cliente',
  'feature_flags.gestionar_todas',
  'cuentas.ver_todas',
  'auditoria.ver',
]);

/**
 * Qué feature del catálogo prende cada módulo de negocio, según el prefijo del
 * permiso (lo que va antes del primer punto). Un permiso cuyo prefijo no esté
 * aquí (ej. "usuarios.gestionar") no depende de ningún switch.
 */
const MODULO_POR_PREFIJO: Record<string, string> = {
  reservas: 'modulo.reservas',
  metricas: 'modulo.metricas',
  requisiciones: 'modulo.requisiciones',
  personal: 'modulo.personal',
  asistencia: 'modulo.personal',
  nomina: 'modulo.nomina',
  proveedores: 'modulo.proveedores',
  compras: 'modulo.proveedores',
};

export function featureDelModulo(permisoCodigo: string): string | null {
  return MODULO_POR_PREFIJO[permisoCodigo.split('.')[0]] ?? null;
}
