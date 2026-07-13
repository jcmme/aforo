// Edge Function: gestion-minimo
// El capitán hace cumplir el consumo mínimo: cambia a una mesa menos exclusiva
// o, si no hay, registra que se invitó a retirarse. Queda en la bitácora e
// incidencias (panel Cadena). Solo capitán.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'hacer_cumplir_minimo', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { reservaId, accion, nota } = (await req.json().catch(() => ({}))) ?? {};
  // accion: 'invitar_retirar' (cambiar de mesa usa la función mover-mesa).
  if (!reservaId || accion !== 'invitar_retirar') {
    return json({ error: 'Acción inválida' }, 400);
  }

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

  await svc.from('incidencias').insert({
    antro_id: reserva.antro_id,
    corporativo_id: reserva.corporativo_id,
    tipo: 'consumo_minimo_no_cumplido',
    detalle: { reservaId, accion, nota },
    responsable_id: usuario.id,
  });
  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: reserva.corporativo_id,
    accion: 'hacer_cumplir_minimo',
    entidad: 'reservas',
    entidad_id: reservaId,
    detalle: { accion, nota },
  });

  return json({ ok: true }, 201);
});
