// Edge Function: generar-invitacion
// Genera (= aprueba) una invitación de personal. Valida la ESCALERA: nadie
// invita a un rango igual o superior. Código NO adivinable (CSPRNG), caducidad
// editable. El corporativo/antro objetivo se valida contra la membresía del
// invitador: no se puede invitar hacia un corporativo ajeno (aislamiento).

import { cors, json } from '../_shared/cors.ts';
import {
  clienteServicio,
  puedeAccion,
  usuarioDeRequest,
  verificarTenant,
} from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

const ESCALERA: Record<string, string[]> = {
  capitan: ['rp'],
  gerente: ['capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
  gerente_general: ['capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
  super_admin: ['dueno', 'socio', 'gerente_general', 'gerente', 'capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
};

// Código de invitación no adivinable: 64 bits de entropía criptográfica en
// base32 (sin caracteres ambiguos), no Math.random. Formato AF-XXXX-XXXX-XXXX.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin I,O,0,1 para lectura
function codigoSeguro(): string {
  const bytes = new Uint8Array(15);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]);
  const g = (i: number) => chars.slice(i, i + 4).join('');
  return `AF-${g(0)}-${g(4)}-${g(8)}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();

  const { rol, antroId, corporativoId, usosMax } = (await req.json().catch(() => ({}))) ?? {};
  if (!rol || !corporativoId) return json({ error: 'Datos inválidos' }, 400);

  // Aislamiento: el invitador debe pertenecer al corporativo objetivo (y, si se
  // ata a un antro, a ese antro). El super_admin es transversal.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId, antroId: antroId ?? null }))) {
    return json({ error: 'No autorizado en ese corporativo' }, 403);
  }

  // Permiso de la matriz evaluado DENTRO del corporativo objetivo (ser gerente
  // en otro corporativo no habilita aquí).
  if (!(await puedeAccion(svc, usuario.id, 'gestionar_invitaciones', [], { corporativoId, antroId: antroId ?? null }))) {
    return json({ error: 'No autorizado' }, 403);
  }

  // El antro (si se especifica) debe pertenecer al corporativo objetivo.
  if (antroId) {
    const { data: antro } = await svc
      .from('antros').select('corporativo_id').eq('id', antroId).maybeSingle();
    if (!antro || antro.corporativo_id !== corporativoId) {
      return json({ error: 'Antro no pertenece al corporativo' }, 400);
    }
  }

  // Escalera: el rol pedido debe ser invitable por alguno de los roles que el
  // invitador tiene EN ESE corporativo (no en otro). El super_admin invita a
  // cualquiera dentro de la escalera.
  const { data: membresias } = await svc
    .from('membresias').select('rol, corporativo_id')
    .eq('usuario_id', usuario.id).eq('activo', true);
  const rolesAqui = (membresias ?? [])
    .filter((m) => m.rol === 'super_admin' || m.corporativo_id === corporativoId)
    .map((m) => m.rol as string);
  const puedeInvitar = rolesAqui.some((r) => (ESCALERA[r] ?? []).includes(rol));
  if (!puedeInvitar) return json({ error: 'No puedes invitar a ese rango' }, 403);

  const horas = (await obtenerParametro<number>(svc, 'invitacion_caducidad_horas')) ?? 72;
  const { data: inv, error } = await svc
    .from('invitaciones')
    .insert({
      codigo: codigoSeguro(),
      corporativo_id: corporativoId,
      antro_id: antroId ?? null,
      rol,
      usos_max: usosMax ?? 1,
      caduca_en: new Date(Date.now() + horas * 3600 * 1000).toISOString(),
      creada_por: usuario.id,
    })
    .select()
    .single();
  if (error) return json({ error: 'No se pudo crear' }, 500);

  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: corporativoId, accion: 'generar_invitacion',
    entidad: 'invitaciones', entidad_id: inv.id, detalle: { rol, usosMax },
  });
  return json({ invitacion: { ...inv, antroId: inv.antro_id, corporativoId: inv.corporativo_id, usosMax: inv.usos_max, caducaEn: inv.caduca_en, creadaEn: inv.creada_en } }, 201);
});
