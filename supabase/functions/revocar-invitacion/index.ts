// Edge Function: revocar-invitacion
// El invitador revoca al instante. Solo quien gestiona invitaciones de su corporativo.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'gestionar_invitaciones', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { id } = (await req.json().catch(() => ({}))) ?? {};
  if (!id) return json({ error: 'Falta id' }, 400);

  const { data: inv } = await svc.from('invitaciones').select('corporativo_id').eq('id', id).maybeSingle();
  if (!inv) return json({ error: 'No encontrada' }, 404);

  await svc.from('invitaciones').update({ revocada: true }).eq('id', id);
  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: inv.corporativo_id, accion: 'revocar_invitacion',
    entidad: 'invitaciones', entidad_id: id,
  });
  return json({ ok: true }, 200);
});
