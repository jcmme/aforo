// Edge Function: crear-reserva
// Valida permiso (matriz) + cupo (config) + regla al_llenar, crea la reserva y
// firma N QR en el servidor. Denegación por defecto y aislamiento multi-tenant.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';
import { firmarToken } from '../_shared/qr.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'crear_reserva'))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const body = await req.json().catch(() => null);
  const { eventoId, modalidad, numInvitados, invitado, rpId } = body ?? {};
  if (!eventoId || !modalidad || !Number.isInteger(numInvitados) || numInvitados < 1) {
    return json({ error: 'Datos de reserva inválidos' }, 400);
  }

  // Reserva de invitado sin cuenta: solo la puede meter STAFF (no un cliente
  // reservando "para otro" con solo su propio permiso base). Se valida el rol
  // real (sin el atajo de "todo cliente puede crear_reserva").
  if (invitado) {
    if (!invitado.nombre?.trim() || !invitado.telefono?.trim()) {
      return json({ error: 'Falta nombre o teléfono del invitado' }, 400);
    }
    if (!(await puedeAccion(svc, usuario.id, 'crear_reserva', []))) {
      return json({ error: 'Solo el staff puede registrar invitados sin cuenta' }, 403);
    }
  }

  // Evento + antro (para validar modalidad, cupo y resolver config).
  const { data: evento } = await svc.from('eventos').select('*').eq('id', eventoId).maybeSingle();
  if (!evento) return json({ error: 'Evento no encontrado' }, 404);
  if (!evento.modalidades.includes(modalidad)) {
    return json({ error: 'Modalidad no disponible en este evento' }, 400);
  }

  // Cupo actual = suma de invitados en reservas vigentes.
  const { data: vigentes } = await svc
    .from('reservas')
    .select('num_invitados')
    .eq('evento_id', eventoId)
    .in('estado', ['confirmada', 'lista_espera', 'completada']);
  const ocupados = (vigentes ?? []).reduce((s, r) => s + (r.num_invitados as number), 0);

  let estado = 'confirmada';
  if (ocupados + numInvitados > evento.cupo_maximo) {
    if (evento.al_llenar === 'cerrar') return json({ error: 'Evento lleno' }, 409);
    estado = 'lista_espera';
  }

  // Consumo mínimo (mesa) desde configuración: antro > corporativo > global.
  let consumoMinimo: number | null = null;
  if (modalidad === 'mesa') {
    consumoMinimo =
      (await obtenerParametro<number>(svc, 'consumo_minimo_mesa_default', {
        corporativoId: evento.corporativo_id,
        antroId: evento.antro_id,
      })) ?? 0;
  }

  // Crear reserva.
  const { data: reserva, error: errRes } = await svc
    .from('reservas')
    .insert({
      evento_id: eventoId,
      antro_id: evento.antro_id,
      corporativo_id: evento.corporativo_id,
      // Invitado sin cuenta: sin cliente_id, con su nombre/teléfono. El rp_id
      // en ese caso es SIEMPRE quien llama (nunca se confía en un id del
      // body); si es un cliente normal, puede traer el rpId de un referido.
      cliente_id: invitado ? null : usuario.id,
      rp_id: invitado ? usuario.id : (rpId ?? null),
      invitado_nombre: invitado?.nombre?.trim() ?? null,
      invitado_telefono: invitado?.telefono?.trim() ?? null,
      modalidad,
      num_invitados: numInvitados,
      consumo_minimo: consumoMinimo,
      estado,
    })
    .select()
    .single();
  if (errRes || !reserva) return json({ error: 'No se pudo crear la reserva' }, 500);

  // Un QR firmado por invitado + su enlace de reclamo.
  const qrs = [];
  for (let i = 0; i < numInvitados; i++) {
    const { data: qr } = await svc
      .from('qr_codes')
      .insert({
        reserva_id: reserva.id,
        antro_id: evento.antro_id,
        corporativo_id: evento.corporativo_id,
        // Placeholder único; se reemplaza por el token firmado con el id real.
        token: `tmp-${crypto.randomUUID()}`,
      })
      .select()
      .single();
    if (!qr) continue;
    const token = await firmarToken(qr.id);
    await svc.from('qr_codes').update({ token }).eq('id', qr.id);
    await svc.from('enlaces_reclamo').insert({ qr_id: qr.id, token });
    qrs.push({ ...qr, token });
  }

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: evento.corporativo_id,
    accion: 'crear_reserva',
    entidad: 'reservas',
    entidad_id: reserva.id,
    detalle: { modalidad, numInvitados, estado },
  });

  return json({ reserva: { ...reserva, qr_codes: qrs } }, 201);
});
