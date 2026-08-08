// Edge Function: validar-puerta
// Valida un QR en la puerta y devuelve el semáforo verde/amarillo/rojo.
// La firma del QR se valida SIEMPRE en el servidor. Solo cadenero/hostess.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';
import { verificarToken } from '../_shared/qr.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'escanear_puerta', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { token, antroId } = (await req.json().catch(() => ({}))) ?? {};
  if (!antroId) return json({ error: 'Falta antroId' }, 400);

  const rojo = (motivo: string) => json({ semaforo: 'rojo', motivo }, 200);

  // 1) Firma válida.
  const qrId = token ? await verificarToken(token) : null;
  if (!qrId) return rojo('QR no válido o no corresponde');

  // 2) QR existe y es de este antro.
  const { data: qr } = await svc.from('qr_codes').select('*').eq('id', qrId).maybeSingle();
  if (!qr || qr.token !== token || qr.antro_id !== antroId) {
    return rojo('QR no corresponde a este antro');
  }
  if (qr.estado === 'usado_puerta') return rojo('Este QR ya fue usado para entrar');

  // 3) Reserva activa + datos de pantalla.
  const { data: reserva } = await svc
    .from('reservas')
    .select('*, eventos(nombre), rp:usuarios!reservas_rp_id_fkey(nombre)')
    .eq('id', qr.reserva_id)
    .maybeSingle();
  if (!reserva || !['confirmada', 'lista_espera', 'completada'].includes(reserva.estado)) {
    return rojo('La reserva no está activa');
  }

  // Aislamiento: el que escanea debe ser personal de ESTE antro/corporativo.
  // Tener el rol "cadenero" en otro corporativo no habilita esta puerta.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: reserva.corporativo_id, antroId }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  // 4) Conteo: la puerta espera los QR DISTRIBUIDOS; "adentro" = usado_puerta.
  const { data: qrs } = await svc.from('qr_codes').select('estado').eq('reserva_id', reserva.id);
  const usados = (qrs ?? []).filter((q) => q.estado === 'usado_puerta').length;
  const distribuidos = (qrs ?? []).filter(
    (q) => q.estado === 'distribuido' || q.estado === 'usado_puerta',
  ).length;

  const info = {
    reservaId: reserva.id,
    qrId: qr.id,
    reservaNombre: reserva.eventos?.nombre ?? 'Reserva',
    rpNombre: reserva.rp?.nombre ?? null,
    pxEsperados: reserva.num_invitados,
    distribuidos,
    adentro: usados,
    faltan: Math.max(0, distribuidos - usados),
  };

  // 5) ¿Quedan accesos? (un acceso por px de la reserva)
  if (usados >= reserva.num_invitados) {
    // Amarillo: pertenece a la reserva pero sin accesos restantes. No bloquea.
    return json({ semaforo: 'amarillo', ...info, motivo: 'Sin accesos restantes' }, 200);
  }

  // Verde: marca llegó, descuenta acceso, registra con hora.
  await svc
    .from('qr_codes')
    .update({ estado: 'usado_puerta', usado_en: new Date().toISOString() })
    .eq('id', qr.id);
  await svc.from('accesos_puerta').insert({
    qr_id: qr.id,
    reserva_id: reserva.id,
    antro_id: antroId,
    corporativo_id: reserva.corporativo_id,
    resultado: 'verde',
    responsable_id: usuario.id,
  });

  return json({ semaforo: 'verde', ...info, adentro: usados + 1, faltan: Math.max(0, distribuidos - usados - 1) }, 200);
});
