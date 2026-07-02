// Edge Function: recalcular-fantasmas (job de inteligencia)
// Recalcula no-shows, score de reputación y alertas a partir de datos REALES:
// un QR DISTRIBUIDO que nunca fue usado en puerta, tras pasar el evento, es un
// no-show. Vincula identidades por teléfono normalizado — incluye reservas de
// INVITADOS SIN CUENTA (cliente_id null, invitado_telefono), que se detectan
// igual pero no tienen fila en `reputacion` (requiere un usuario real; el
// vínculo automático al crear cuenta queda para una fase posterior). Pensado
// para correr en segundo plano (cron) o tras la noche. Solo súper admin.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

const GENERICOS = ['invitado', 'cliente', 'sin nombre', 'amigo'];
const normTel = (t: string | null) => (t ?? '').replace(/\D/g, '');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'feature_flags_planes', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const scorePorNoShow = (await obtenerParametro<number>(svc, 'score_por_noshow')) ?? 20;
  const ahora = new Date();

  // Reservas con sus QR, fecha del evento, cliente (o invitado sin cuenta).
  const { data: reservas } = await svc
    .from('reservas')
    .select('id, cliente_id, invitado_telefono, corporativo_id, eventos(fecha), qr_codes(estado)');

  // Agregado por cliente CON cuenta (alimenta `reputacion`).
  const porCliente = new Map<string, { noShows: number; total: number; corp: string }>();
  // Agregado por teléfono de INVITADO sin cuenta (solo alertas; sin reputacion).
  const porTelInvitado = new Map<string, { noShows: number; total: number; corp: string }>();

  for (const r of reservas ?? []) {
    const fecha = new Date((r as Record<string, any>).eventos?.fecha ?? 0);
    const qrs = (r as Record<string, any>).qr_codes ?? [];
    const distribuidos = qrs.filter((q: any) => q.estado === 'distribuido' || q.estado === 'usado_puerta').length;
    const usados = qrs.filter((q: any) => q.estado === 'usado_puerta').length;
    const noShow = fecha < ahora && distribuidos > 0 && usados === 0;

    if (r.cliente_id) {
      const g = porCliente.get(r.cliente_id) ?? { noShows: 0, total: 0, corp: r.corporativo_id };
      g.total += 1;
      if (noShow) g.noShows += 1;
      porCliente.set(r.cliente_id, g);
    } else if (r.invitado_telefono) {
      const tel = normTel(r.invitado_telefono);
      const g = porTelInvitado.get(tel) ?? { noShows: 0, total: 0, corp: r.corporativo_id };
      g.total += 1;
      if (noShow) g.noShows += 1;
      porTelInvitado.set(tel, g);
    }
  }

  // Upsert reputación (solo clientes con cuenta real).
  for (const [usuarioId, g] of porCliente) {
    const score = Math.max(0, 100 - g.noShows * scorePorNoShow);
    const showRate = g.total > 0 ? (g.total - g.noShows) / g.total : 1;
    await svc.from('reputacion').upsert(
      { usuario_id: usuarioId, score, show_rate: showRate, actualizado: ahora.toISOString() },
      { onConflict: 'usuario_id' },
    );
  }

  // Alertas de invitados sin cuenta con score bajo (sin fila de reputación).
  for (const [tel, g] of porTelInvitado) {
    const score = Math.max(0, 100 - g.noShows * scorePorNoShow);
    if (g.noShows > 0) {
      await svc.from('alertas_fantasma').insert({
        usuario_id: null,
        corporativo_id: g.corp,
        tipo: 'invitado_sin_cuenta_no_show',
        detalle: { telefono: tel, noShows: g.noShows, total: g.total, score },
      });
    }
  }

  // Alertas por identidad (teléfono normalizado) — usuarios con cuenta.
  const { data: usuarios } = await svc.from('usuarios').select('id, nombre, telefono');
  const porTel = new Map<string, { nombres: Set<string>; ids: string[] }>();
  for (const u of usuarios ?? []) {
    const tel = normTel(u.telefono);
    if (!tel) continue;
    const g = porTel.get(tel) ?? { nombres: new Set(), ids: [] };
    g.nombres.add(u.nombre);
    g.ids.push(u.id);
    porTel.set(tel, g);
  }
  for (const [, g] of porTel) {
    if (g.nombres.size > 1) {
      const corp = porCliente.get(g.ids[0])?.corp ?? null;
      await svc.from('alertas_fantasma').insert({
        usuario_id: g.ids[0],
        corporativo_id: corp,
        tipo: 'mismo_telefono_distintos_nombres',
        detalle: { nombres: [...g.nombres] },
      });
    }
    if ([...g.nombres].some((n) => GENERICOS.includes(n.trim().toLowerCase()))) {
      const corp = porCliente.get(g.ids[0])?.corp ?? null;
      await svc.from('alertas_fantasma').insert({
        usuario_id: g.ids[0],
        corporativo_id: corp,
        tipo: 'nombre_generico',
        detalle: { nombres: [...g.nombres] },
      });
    }
  }

  return json({ ok: true, clientes: porCliente.size, invitados: porTelInvitado.size }, 200);
});
