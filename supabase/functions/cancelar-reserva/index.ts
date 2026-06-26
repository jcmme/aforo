// Edge Function: cancelar-reserva
// Cancela una reserva propia aplicando la ventana de cancelación (config por
// antro): antes de la hora límite = limpio; después = cuenta como no-show.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const body = await req.json().catch(() => null);
  const reservaId = body?.reservaId;
  if (!reservaId) return json({ error: 'Falta reservaId' }, 400);

  const svc = clienteServicio();

  const { data: reserva } = await svc
    .from('reservas')
    .select('*, eventos(fecha)')
    .eq('id', reservaId)
    .maybeSingle();
  if (!reserva) return json({ error: 'Reserva no encontrada' }, 404);

  // Solo el dueño de la reserva puede cancelarla (acción 'cancelar_reserva_propia').
  if (reserva.cliente_id !== usuario.id) return json({ error: 'No autorizado' }, 403);
  if (reserva.estado === 'cancelada' || reserva.estado === 'no_show') {
    return json({ error: 'La reserva ya no está activa' }, 409);
  }

  // Ventana de cancelación (HH:mm) configurable por antro.
  const ventana =
    (await obtenerParametro<string>(svc, 'ventana_cancelacion_default', {
      corporativoId: reserva.corporativo_id,
      antroId: reserva.antro_id,
    })) ?? '18:00';

  const fechaEvento = new Date(reserva.eventos.fecha);
  const [hh, mm] = ventana.split(':').map(Number);
  const limite = new Date(fechaEvento);
  limite.setHours(hh, mm, 0, 0);

  const ahora = new Date();
  const esNoShow = ahora > limite; // canceló después de la hora límite

  await svc
    .from('reservas')
    .update({
      estado: esNoShow ? 'no_show' : 'cancelada',
      cancelada_en: ahora.toISOString(),
    })
    .eq('id', reservaId);

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: reserva.corporativo_id,
    accion: 'cancelar_reserva',
    entidad: 'reservas',
    entidad_id: reservaId,
    detalle: { esNoShow },
  });

  return json({ ok: true, estado: esNoShow ? 'no_show' : 'cancelada' });
});
