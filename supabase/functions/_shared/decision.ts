// Lógica PURA de aislamiento multi-tenant y matriz de permisos.
//
// Sin dependencias ni E/S: recibe datos (membresías, acciones de cliente) y
// devuelve decisiones. Es la ÚNICA fuente de verdad del aislamiento; tanto las
// Edge Functions (`_shared/auth.ts`) como las pruebas automatizadas
// (`decision.test.ts`) usan estas mismas funciones. Así lo que se prueba es
// exactamente lo que corre en producción, no una copia.

/** Fila de membresía activa: un rol dentro de un corporativo/antro. */
export type Membresia = {
  rol: string;
  corporativo_id: string;
  antro_id: string | null;
};

/** Alcance de tenant sobre el que se ejecuta una acción. */
export type AlcanceTenant = { corporativoId?: string | null; antroId?: string | null };

/**
 * Roles cuyo alcance es TODO el corporativo (no atados a un antro): cubren
 * cualquier antro del corporativo al que pertenecen (CLAUDE.md §4).
 */
export const ROLES_ALCANCE_CORPORATIVO: ReadonlySet<string> = new Set([
  'dueno', 'socio', 'gerente_general', 'super_admin',
]);

/** ¿El usuario tiene alguna membresía de super_admin (transversal)? */
export function esSuperAdmin(membresias: Membresia[]): boolean {
  return membresias.some((m) => m.rol === 'super_admin');
}

/**
 * ¿Esta membresía concreta alcanza el tenant objetivo?
 * - Corporativo: debe coincidir (si se especificó).
 * - Antro: debe coincidir, salvo roles de alcance corporativo o membresías sin
 *   antro (antro_id null = corporativo-wide).
 */
export function membresiaCubreTenant(m: Membresia, tenant: AlcanceTenant): boolean {
  if (tenant.corporativoId && m.corporativo_id !== tenant.corporativoId) return false;
  if (
    tenant.antroId &&
    !ROLES_ALCANCE_CORPORATIVO.has(m.rol) &&
    m.antro_id !== null &&
    m.antro_id !== tenant.antroId
  ) {
    return false;
  }
  return true;
}

/**
 * ¿El usuario PERTENECE al corporativo/antro objetivo? (denegación por defecto).
 * El super_admin pertenece a todo. Es el muro que impide que el personal de un
 * corporativo toque datos de otro (CLAUDE.md §2). Núcleo de `verificarTenant`.
 */
export function perteneceAlTenant(membresias: Membresia[], tenant: AlcanceTenant): boolean {
  if (esSuperAdmin(membresias)) return true;
  return membresias.some((m) => membresiaCubreTenant(m, tenant));
}

/**
 * Roles vigentes del usuario ACOTADOS al tenant objetivo. Si es super_admin, se
 * devuelven todos sus roles (transversal). Si no hay tenant, no se acota.
 * Base de la evaluación de la matriz de permisos con aislamiento.
 */
export function rolesEnTenant(membresias: Membresia[], tenant?: AlcanceTenant): string[] {
  let ms = membresias;
  if (tenant && !esSuperAdmin(membresias)) {
    ms = ms.filter((m) => membresiaCubreTenant(m, tenant));
  }
  return [...new Set(ms.map((m) => m.rol))];
}

/**
 * Decisión completa de autorización (matriz + aislamiento), denegación por
 * defecto. `rolPermiteAccion` es el oráculo de la matriz: para el conjunto de
 * roles ya acotados al tenant, ¿alguno tiene la acción permitida? En producción
 * lo respalda la tabla `permisos`; en las pruebas, un fixture.
 */
export function decidirAccion(
  membresias: Membresia[],
  accion: string,
  opciones: {
    accionesCliente: string[];
    tenant?: AlcanceTenant;
    rolPermiteAccion: (roles: string[]) => boolean;
  },
): boolean {
  // Permiso base del cliente: toda cuenta es cliente aunque no tenga membresía.
  if (opciones.accionesCliente.includes(accion)) return true;
  if (membresias.length === 0) return false;

  const roles = rolesEnTenant(membresias, opciones.tenant);
  if (roles.length === 0) return false;

  return opciones.rolPermiteAccion(roles);
}
