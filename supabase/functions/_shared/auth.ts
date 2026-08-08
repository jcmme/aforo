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
import {
  type AlcanceTenant,
  decidirAccion,
  type Membresia,
  perteneceAlTenant,
  rolesEnTenant,
} from './decision.ts';

export type { AlcanceTenant } from './decision.ts';

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

/** Membresías activas del usuario. */
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
 * Delega en la lógica pura `perteneceAlTenant` (probada en decision.test.ts).
 * Este es el muro que impide que el personal de un corporativo toque datos de
 * otro. Es lo MÁS importante del aislamiento multi-tenant (CLAUDE.md §2).
 */
export async function verificarTenant(
  svc: SupabaseClient,
  usuarioId: string,
  tenant: AlcanceTenant,
): Promise<boolean> {
  const membresias = await membresiasActivas(svc, usuarioId);
  return perteneceAlTenant(membresias, tenant);
}

/**
 * Verifica que el usuario tenga permiso para una acción según la matriz
 * (denegación por defecto). Con `tenant`, la matriz se evalúa SOLO con los
 * roles vigentes en ese corporativo/antro: "ser gerente en el corporativo A"
 * no habilita acciones en el corporativo B. El super_admin es transversal.
 *
 * `accionesCliente`: acciones permitidas por el rol 'cliente' implícito (toda
 * cuenta es cliente aunque no tenga membresía). Pasar `[]` para exigir un rol
 * real. La decisión se delega a la lógica pura `decidirAccion`; aquí solo se
 * resuelve el oráculo de la matriz contra la tabla `permisos`.
 */
export async function puedeAccion(
  svc: SupabaseClient,
  usuarioId: string,
  accion: string,
  accionesCliente: string[] = ['crear_reserva', 'cancelar_reserva_propia'],
  tenant?: AlcanceTenant,
): Promise<boolean> {
  // Atajo del cliente sin necesidad de consultar membresías.
  if (accionesCliente.includes(accion)) return true;

  const membresias = await membresiasActivas(svc, usuarioId);

  // Oráculo de la matriz: para los roles ya acotados al tenant, ¿alguno tiene
  // la acción permitida? Se consulta la tabla `permisos` (denegación por
  // defecto: solo existen las filas permitidas). Se usa la MISMA función de
  // aislamiento (`rolesEnTenant`, vía decidirAccion) que prueban los tests.
  const permitidos = new Set<string>();
  const rolesAConsultar = rolesEnTenant(membresias, tenant);
  if (rolesAConsultar.length > 0) {
    const { data } = await svc
      .from('permisos')
      .select('rol')
      .eq('accion', accion)
      .eq('permitido', true)
      .in('rol', rolesAConsultar);
    for (const p of data ?? []) permitidos.add(p.rol as string);
  }

  return decidirAccion(membresias, accion, {
    accionesCliente,
    tenant,
    rolPermiteAccion: (roles) => roles.some((r) => permitidos.has(r)),
  });
}
