// Edge Function: contador-penetracion
// Clicker del cadenero: personas que entran SIN reserva de la app. Arranca en
// ceros por día operativo y persiste. Solo cadenero. Upsert idempotente del
// total del día (el cliente envía el valor absoluto del contador local).

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'contador_sin_reserva', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { antroId, fechaOperativa, sinReserva } =
    (await req.json().catch(() => ({}))) ?? {};
  if (!antroId || !fechaOperativa || !Number.isInteger(sinReserva)) {
    return json({ error: 'Datos inválidos' }, 400);
  }

  // Aislamiento: el cadenero debe ser de ESE antro/corporativo. Se resuelve el
  // corporativo del antro para no confiar en un antroId de otro tenant.
  const { data: antro } = await svc
    .from('antros').select('corporativo_id').eq('id', antroId).maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: antro.corporativo_id, antroId }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  await svc
    .from('contador_penetracion')
    .upsert(
      {
        antro_id: antroId,
        fecha_operativa: fechaOperativa,
        sin_reserva: Math.max(0, sinReserva),
        responsable_id: usuario.id,
      },
      { onConflict: 'antro_id,fecha_operativa' },
    );

  return json({ ok: true }, 200);
});
