// Edge Function: crear-resena
// El cliente califica un antro con estrellas + foto opcional. Solo si tuvo una
// reserva con al menos un QR usado en puerta ahí (llegó de verdad — mismo
// principio que "solo check-ins verificados cuentan", CLAUDE.md §6).

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'dejar_resena', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { antroId, estrellas, fotoUrl } = (await req.json().catch(() => ({}))) ?? {};
  if (!antroId || !Number.isInteger(estrellas) || estrellas < 1 || estrellas > 5) {
    return json({ error: 'Datos inválidos' }, 400);
  }

  // Verifica que llegó de verdad: una reserva suya en ese antro con un QR usado.
  const { data: reservas } = await svc
    .from('reservas')
    .select('id, qr_codes(estado)')
    .eq('antro_id', antroId)
    .eq('cliente_id', usuario.id);
  const llego = (reservas ?? []).some((r: Record<string, any>) =>
    (r.qr_codes ?? []).some((q: any) => q.estado === 'usado_puerta'),
  );
  if (!llego) return json({ error: 'Solo puedes calificar lugares donde ya verificamos tu llegada' }, 403);

  await svc.from('resenas_antro').insert({
    antro_id: antroId,
    cliente_id: usuario.id,
    estrellas,
    foto_url: fotoUrl ?? null,
  });

  return json({ ok: true }, 201);
});
