// Edge Function: mover-mesa
// Asigna o mueve la mesa de una reserva. Historial ENCADENADO: nunca sobrescribe;
// "mesa actual" = último eslabón. Hostess, capitán o gerente.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'asignar_mover_mesa', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { reservaId, mesaNueva } = (await req.json().catch(() => ({}))) ?? {};
  if (!reservaId || !mesaNueva?.trim()) {
    return json({ error: 'Falta reservaId o mesaNueva' }, 400);
  }

  const { data: reserva } = await svc
    .from('reservas')
    .select('id, mesa_texto, corporativo_id')
    .eq('id', reservaId)
    .maybeSingle();
  if (!reserva) return json({ error: 'Reserva no encontrada' }, 404);

  // Nuevo eslabón en el historial (la asignación inicial nunca se borra).
  await svc.from('movimientos_mesa').insert({
    reserva_id: reservaId,
    mesa_anterior: reserva.mesa_texto,
    mesa_nueva: mesaNueva.trim(),
    responsable_id: usuario.id,
  });
  // Espejo de "mesa actual" en la reserva.
  await svc.from('reservas').update({ mesa_texto: mesaNueva.trim() }).eq('id', reservaId);

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: reserva.corporativo_id,
    accion: reserva.mesa_texto ? 'mover_mesa' : 'asignar_mesa',
    entidad: 'reservas',
    entidad_id: reservaId,
    detalle: { de: reserva.mesa_texto, a: mesaNueva.trim() },
  });

  return json({ ok: true, mesaActual: mesaNueva.trim() }, 201);
});
