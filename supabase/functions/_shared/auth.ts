// Utilidades de autenticación/autorización para las Edge Functions.
//
// Las funciones usan la `service_role` para operar bajo las reglas de negocio
// (omiten RLS), pero SIEMPRE identifican al usuario desde su JWT y validan DOS
// ejes antes de actuar (denegación por defecto):
//   1. Matriz de permisos  → ¿este ROL puede ejecutar esta acción?  (puedeAccion)
//   2. Aislamiento tenant   → ¿este usuario PERTENECE al corporativo/antro
//      sobre el que actúa?  (verificarTenant)
// Ambos ejes son obligatorios en toda acción que toque datos de un tenant:
// tener el rol "cadenero" no basta; hay que ser cadenero DE ESE antro.

import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

/** Cliente con service_role: omite RLS. Nunca exponer esta clave al cliente. */
export function clienteServicio(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
}

/** Devuelve el usuario autenticado a partir del header Authorization, o null. */
export async function usuarioDeRequest(
  req: Request,
): Promise<{ id: string } | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return null;
  const anon = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await anon.auth.getUser();
  if (error || !data.user) return null;
  return { id: data.user.id };
}

/** Alcance de tenant sobre el que se ejecuta una acción. */
export type AlcanceTenant = { corporativoId?: string | null; antroId?: string | null };

/** Fila de membresía activa (rol dentro de un corporativo/antro). */
type Membresia = { rol: string; corporativo_id: string; antro_id: string | null };

/**
 * Roles cuyo alcance es TODO el corporativo (no están atados a un antro):
 * cubren cualquier antro del corporativo al que pertenecen.
 */
const ROLES_ALCANCE_CORPORATIVO = new Set([
  'dueno', 'socio', 'gerente_general', 'super_admin',
]);

/** Membresías activas del usuario. Cacheable por request si se desea. */
async function membresiasActivas(
  svc: SupabaseClient,
  usuarioId: string,
): Promise<Membresia[]> {
  const { data } = await svc
    .from('membresias')
    .select('rol, corporativo_id, antro_id')
    .eq('usuario_id', usuarioId)
    .eq('activo', true);
  return (data ?? []) as Membresia[];
}

/**
 * ¿El usuario pertenece al corporativo/antro objetivo? (denegación por defecto).
 *
 * - El super_admin (MABI) es transversal: pertenece a todo.
 * - Un rol de alcance corporativo (dueño, socio, gerente general) cubre
 *   cualquier antro de SU corporativo.
 * - Un rol atado a un antro (cadenero, hostess, capitán, cajero, gerente
 *   individual, RP) solo alcanza el antro de su membresía. Si la membresía no
 *   trae antro (antro_id null) se interpreta como alcance corporativo.
 *
 * Este es el muro que impide que el personal de un corporativo toque datos de
 * otro. Es lo MÁS importante del aislamiento multi-tenant (CLAUDE.md §2).
 */
export async function verificarTenant(
  svc: SupabaseClient,
  usuarioId: string,
  tenant: AlcanceTenant,
): Promise<boolean> {
  const membresias = await membresiasActivas(svc, usuarioId);
  // El super_admin pertenece a todos los tenants por diseño.
  if (membresias.some((m) => m.rol === 'super_admin')) return true;

  return membresias.some((m) => {
    // Debe ser del corporativo objetivo (si se especificó).
    if (tenant.corporativoId && m.corporativo_id !== tenant.corporativoId) return false;
    // Y del antro objetivo, salvo roles de alcance corporativo o membresías
    // sin antro (corporativo-wide).
    if (
      tenant.antroId &&
      !ROLES_ALCANCE_CORPORATIVO.has(m.rol) &&
      m.antro_id !== null &&
      m.antro_id !== tenant.antroId
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Verifica que el usuario tenga permiso para una acción según la matriz
 * (denegación por defecto).
 *
 * Cuando se pasa `tenant`, la matriz se evalúa SOLO con los roles que el
 * usuario tiene DENTRO de ese corporativo/antro: así "ser gerente en el
 * corporativo A" no habilita acciones en el corporativo B. El super_admin es
 * transversal.
 *
 * `accionesCliente`: acciones permitidas por el rol 'cliente' implícito (toda
 * cuenta es cliente aunque no tenga membresía de personal). Pasar `[]` para
 * exigir un rol real.
 */
export async function puedeAccion(
  svc: SupabaseClient,
  usuarioId: string,
  accion: string,
  accionesCliente: string[] = ['crear_reserva', 'cancelar_reserva_propia'],
  tenant?: AlcanceTenant,
): Promise<boolean> {
  // Permiso base del cliente: toda cuenta es cliente aunque no tenga membresía.
  if (accionesCliente.includes(accion)) return true;

  let membresias = await membresiasActivas(svc, usuarioId);
  if (membresias.length === 0) return false;

  const esSuperAdmin = membresias.some((m) => m.rol === 'super_admin');

  // Acotar por tenant: solo cuentan los roles vigentes en ese corporativo/antro
  // (el super_admin es transversal y no se acota).
  if (tenant && !esSuperAdmin) {
    membresias = membresias.filter((m) => {
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
    });
    if (membresias.length === 0) return false;
  }

  const roles = [...new Set(membresias.map((m) => m.rol))];

  // ¿Alguno de sus roles (ya acotados al tenant) tiene la acción permitida?
  const { data: permisos } = await svc
    .from('permisos')
    .select('rol')
    .eq('accion', accion)
    .eq('permitido', true)
    .in('rol', roles);
  return Boolean(permisos && permisos.length > 0);
}
