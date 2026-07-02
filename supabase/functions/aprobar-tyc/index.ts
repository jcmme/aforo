// Edge Function: aprobar-tyc
// El Súper Admin aprueba el T&C pendiente de un antro. Si la aprobación ocurre
// antes del corte semanal (config `tyc_corte_semanal`, martes 12:00 por
// defecto), aplica esa misma semana; si es después, se pospone a la
// siguiente. Se calcula al leer (sin cron) en tycEfectivoDeAntro del cliente.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

function calcularAplicaDesde(ahora: Date): Date {
  const CORTE_DIA = 2; // martes
  const CORTE_HORA = 12;
  const corte = new Date(ahora);
  const delta = (CORTE_DIA - ahora.getDay() + 7) % 7;
  corte.setDate(ahora.getDate() + delta);
  corte.setHours(CORTE_HORA, 0, 0, 0);
  if (ahora <= corte) return ahora;
  const siguiente = new Date(corte);
  siguiente.setDate(corte.getDate() + 7);
  return siguiente;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'aprobar_tyc', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { antroId } = (await req.json().catch(() => ({}))) ?? {};
  if (!antroId) return json({ error: 'Falta antroId' }, 400);

  const { data: tyc } = await svc.from('tyc_antro').select('*').eq('antro_id', antroId).maybeSingle();
  if (!tyc || !tyc.texto_pendiente) return json({ error: 'No hay cambio pendiente' }, 404);

  const ahora = new Date();
  const aplicaDesde = calcularAplicaDesde(ahora);

  await svc
    .from('tyc_antro')
    .update({
      aprobado_por: usuario.id,
      aprobado_en: ahora.toISOString(),
      aplica_desde: aplicaDesde.toISOString(),
      estado: 'sin_cambios',
      // El texto vigente se reemplaza de una vez; tycEfectivoDeAntro decide
      // cuál mostrar según aplica_desde, así que ambos textos quedan
      // disponibles y no hace falta un job programado.
    })
    .eq('antro_id', antroId);

  const { data: antro } = await svc.from('antros').select('corporativo_id').eq('id', antroId).maybeSingle();
  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: antro?.corporativo_id ?? null,
    accion: 'aprobar_tyc',
    entidad: 'tyc_antro',
    entidad_id: antroId,
    detalle: { aplicaDesde: aplicaDesde.toISOString() },
  });

  return json({ ok: true, aplicaDesde: aplicaDesde.toISOString() }, 200);
});
