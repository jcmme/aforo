// Edge Function: capturar-consumo
// El cajero (o súper admin, como soporte) registra el consumo real de una mesa
// con reserva al cierre. EXCLUSIVO de esos roles. Alimenta el ranking.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'capturar_consumo', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { reservaId, monto } = (await req.json().catch(() => ({}))) ?? {};
  if (!reservaId || !Number.isInteger(monto) || monto < 0) {
    return json({ error: 'Datos inválidos' }, 400);
  }

  const { data: reserva } = await svc
    .from('reservas')
    .select('antro_id, corporativo_id')
    .eq('id', reservaId)
    .maybeSingle();
  if (!reserva) return json({ error: 'Reserva no encontrada' }, 404);

  // Aislamiento: el cajero debe ser de ESE antro/corporativo.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: reserva.corporativo_id, antroId: reserva.antro_id }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  await svc.from('consumo_mesa').insert({
    reserva_id: reservaId,
    antro_id: reserva.antro_id,
    monto,
    capturado_por: usuario.id,
  });

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: reserva.corporativo_id,
    accion: 'capturar_consumo',
    entidad: 'reservas',
    entidad_id: reservaId,
    detalle: { monto },
  });

  return json({ ok: true }, 201);
});
