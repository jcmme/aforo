// Edge Function: crear-promocion
// La creación/carga de promociones es EXCLUSIVA del Súper Admin (CLAUDE.md §6).
// AFORO registra la promo y si fue pagada (liga a facturación); no la aplica en
// el POS del antro.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'cargar_promociones', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { nombre, antroId, pagada, monto, inicio, fin } = (await req.json().catch(() => ({}))) ?? {};
  if (!nombre || !antroId) return json({ error: 'Datos inválidos' }, 400);

  const { data: antro } = await svc.from('antros').select('corporativo_id').eq('id', antroId).maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);

  const { data: promo, error } = await svc
    .from('promociones')
    .insert({
      corporativo_id: antro.corporativo_id,
      antro_id: antroId,
      nombre,
      detalle: { pagada: Boolean(pagada), monto: monto ?? null, inicio: inicio ?? null, fin: fin ?? null, pausada: false },
      creada_por: usuario.id,
    })
    .select()
    .single();
  if (error) return json({ error: 'No se pudo crear' }, 500);

  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: antro.corporativo_id, accion: 'cargar_promocion',
    entidad: 'promociones', entidad_id: promo.id, detalle: { nombre, pagada },
  });
  return json({ promocion: promo }, 201);
});
