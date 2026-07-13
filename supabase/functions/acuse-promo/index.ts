// Edge Function: acuse-promo
// El capitán marca "promo aplicada" como ACUSE DE ENTREGA (registro, no
// autorización; las promos vienen preautorizadas). El cliente nunca marca esto.
// AFORO registra la promo pero NO la aplica en el POS del antro.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'acuse_promo', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { reservaId, promoDescripcion } = (await req.json().catch(() => ({}))) ?? {};
  if (!reservaId) return json({ error: 'Falta reservaId' }, 400);

  const { data: reserva } = await svc
    .from('reservas')
    .select('antro_id, corporativo_id')
    .eq('id', reservaId)
    .maybeSingle();
  if (!reserva) return json({ error: 'Reserva no encontrada' }, 404);

  // Aislamiento: el capitán debe ser de ESE antro/corporativo.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: reserva.corporativo_id, antroId: reserva.antro_id }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  await svc.from('acuses_promo').insert({
    reserva_id: reservaId,
    antro_id: reserva.antro_id,
    corporativo_id: reserva.corporativo_id,
    promo_descripcion: promoDescripcion ?? null,
    capitan_id: usuario.id,
  });

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: reserva.corporativo_id,
    accion: 'acuse_promo',
    entidad: 'reservas',
    entidad_id: reservaId,
    detalle: { promoDescripcion },
  });

  return json({ ok: true }, 201);
});
