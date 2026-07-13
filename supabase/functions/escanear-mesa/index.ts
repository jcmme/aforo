// Edge Function: escanear-mesa
// Etapa MESA del mismo QR del cliente (solo capitán). Devuelve reserva, RP,
// mesa actual, consumo mínimo y promo. NO sirve para entrar por puerta.
// Notificación al RP CONDICIONAL (solo si se requiere su presencia).

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';
import { verificarToken } from '../_shared/qr.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'escanear_mesa', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { token, antroId, requierePresencia } =
    (await req.json().catch(() => ({}))) ?? {};
  const qrId = token ? await verificarToken(token) : null;
  if (!qrId) return json({ error: 'QR no válido' }, 400);

  const { data: qr } = await svc.from('qr_codes').select('*').eq('id', qrId).maybeSingle();
  if (!qr || qr.antro_id !== antroId) return json({ error: 'QR no corresponde' }, 404);

  const { data: reserva } = await svc
    .from('reservas')
    .select('*, eventos(nombre), rp:usuarios!reservas_rp_id_fkey(id, nombre)')
    .eq('id', qr.reserva_id)
    .maybeSingle();
  if (!reserva) return json({ error: 'Reserva no encontrada' }, 404);

  // Aislamiento: el capitán debe ser de ESTE antro/corporativo.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: reserva.corporativo_id, antroId }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  // Notificación al RP solo si se requiere su presencia.
  if (requierePresencia && reserva.rp?.id) {
    await svc.from('notificaciones').insert({
      usuario_id: reserva.rp.id,
      tipo: 'capitan_escaneo_mesa',
      payload: { reservaId: reserva.id, antroId },
    });
  }

  return json(
    {
      reservaId: reserva.id,
      reservaNombre: reserva.eventos?.nombre ?? 'Reserva',
      rpNombre: reserva.rp?.nombre ?? null,
      mesaActual: reserva.mesa_texto,
      consumoMinimo: reserva.consumo_minimo,
      // La promo viene preautorizada (la carga el Súper Admin en el módulo 4).
      promo: null,
    },
    200,
  );
});
