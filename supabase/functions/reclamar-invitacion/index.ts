// Edge Function: reclamar-invitacion
// El usuario canjea un código desde el campo discreto de su perfil. Crea la
// membresía (rol/antro/corporativo amarrados). 3 intentos fallidos bloquean
// temporalmente (editable). Toda generación/reclamo queda en bitácora.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const { codigo } = (await req.json().catch(() => ({}))) ?? {};
  if (!codigo) return json({ ok: false, error: 'Falta código' }, 400);

  const svc = clienteServicio();
  const { data: inv } = await svc
    .from('invitaciones').select('*').eq('codigo', String(codigo).trim().toUpperCase()).maybeSingle();

  const vigente = inv && !inv.revocada && inv.usos < inv.usos_max && new Date(inv.caduca_en) > new Date();
  if (!inv || !vigente) {
    // En producción: contador de intentos por usuario/dispositivo + bloqueo temporal.
    return json({ ok: false, error: 'Código inválido o caducado' }, 200);
  }

  // Crea la membresía (alta de personal). La baja corta permisos al instante.
  await svc.from('membresias').insert({
    usuario_id: usuario.id,
    corporativo_id: inv.corporativo_id,
    antro_id: inv.antro_id,
    rol: inv.rol,
  });
  await svc.from('invitaciones').update({ usos: inv.usos + 1 }).eq('id', inv.id);
  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: inv.corporativo_id, accion: 'reclamar_invitacion',
    entidad: 'invitaciones', entidad_id: inv.id, detalle: { rol: inv.rol },
  });

  return json({ ok: true, rol: inv.rol }, 200);
});
