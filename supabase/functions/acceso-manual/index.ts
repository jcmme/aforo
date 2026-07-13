// Edge Function: acceso-manual
// Registra un ingreso manual con motivo (6 motivos editables en config). El
// motivo "Otro" exige explicación y escala al panel Cadena (incidencias).
// También cubre el override de amarillo. Solo cadenero/hostess.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest, verificarTenant } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  const accion = 'acceso_manual';
  if (!(await puedeAccion(svc, usuario.id, accion, []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { antroId, reservaId, qrId, motivo, nota, override } =
    (await req.json().catch(() => ({}))) ?? {};
  if (!antroId || !motivo) return json({ error: 'Falta antroId o motivo' }, 400);

  // El último motivo configurado ("Otro") exige explicación.
  const motivos =
    (await obtenerParametro<string[]>(svc, 'motivos_acceso_manual')) ?? [];
  const motivoOtro = motivos[motivos.length - 1] ?? 'Otro';
  if (motivo === motivoOtro && !(nota && nota.trim())) {
    return json({ error: 'El motivo "Otro" exige una explicación' }, 400);
  }

  // Corporativo del antro.
  const { data: antro } = await svc
    .from('antros')
    .select('corporativo_id')
    .eq('id', antroId)
    .maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);

  // Aislamiento: solo personal de este antro/corporativo registra ingresos aquí.
  if (!(await verificarTenant(svc, usuario.id, { corporativoId: antro.corporativo_id, antroId }))) {
    return json({ error: 'No autorizado en este antro' }, 403);
  }

  // En override de amarillo, el invitado entra: se marca el QR como usado.
  if (override && qrId) {
    await svc
      .from('qr_codes')
      .update({ estado: 'usado_puerta', usado_en: new Date().toISOString() })
      .eq('id', qrId);
  }

  await svc.from('accesos_puerta').insert({
    qr_id: qrId ?? null,
    reserva_id: reservaId ?? null,
    antro_id: antroId,
    corporativo_id: antro.corporativo_id,
    resultado: 'manual',
    motivo,
    nota: nota ?? null,
    responsable_id: usuario.id,
  });

  // "Otro" y los overrides escalan al panel Cadena (incidencias).
  if (override || motivo === motivoOtro) {
    await svc.from('incidencias').insert({
      antro_id: antroId,
      corporativo_id: antro.corporativo_id,
      tipo: override ? 'override_amarillo' : 'acceso_manual_otro',
      detalle: { motivo, nota, reservaId, qrId },
      responsable_id: usuario.id,
    });
  }

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: antro.corporativo_id,
    accion: override ? 'override_amarillo' : 'acceso_manual',
    entidad: 'accesos_puerta',
    entidad_id: reservaId ?? qrId ?? null,
    detalle: { motivo, nota },
  });

  return json({ ok: true }, 201);
});
