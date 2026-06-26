// Utilidades de autenticación/autorización para las Edge Functions.
//
// Las funciones usan la `service_role` para operar bajo las reglas de negocio
// (omiten RLS), pero SIEMPRE identifican al usuario desde su JWT y validan la
// matriz de permisos (denegación por defecto) antes de actuar.

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

/**
 * Verifica que el usuario tenga permiso para una acción según la matriz
 * (denegación por defecto). Para el cliente, la acción 'crear_reserva' y
 * 'cancelar_reserva_propia' están permitidas por rol 'cliente' implícito:
 * toda cuenta es cliente aunque no tenga membresía de personal.
 */
export async function puedeAccion(
  svc: SupabaseClient,
  usuarioId: string,
  accion: string,
  accionesCliente: string[] = ['crear_reserva', 'cancelar_reserva_propia'],
): Promise<boolean> {
  // Permiso base del cliente: toda cuenta es cliente aunque no tenga membresía.
  if (accionesCliente.includes(accion)) return true;

  // Roles activos del usuario.
  const { data: membresias } = await svc
    .from('membresias')
    .select('rol')
    .eq('usuario_id', usuarioId)
    .eq('activo', true);
  const roles = (membresias ?? []).map((m) => m.rol as string);
  if (roles.length === 0) return false;

  // ¿Alguno de sus roles tiene la acción permitida en la matriz?
  const { data: permisos } = await svc
    .from('permisos')
    .select('rol')
    .eq('accion', accion)
    .eq('permitido', true)
    .in('rol', roles);
  return Boolean(permisos && permisos.length > 0);
}
