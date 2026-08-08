// Edge Function: editar-parametro
// Edición de parámetros sin código (panel de Súper Admin). Solo super admin.
// Permite editar config global o por corporativo/antro.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'feature_flags_planes', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { clave, valor, scope, corporativoId, antroId } = (await req.json().catch(() => ({}))) ?? {};
  if (!clave || valor === undefined) return json({ error: 'Datos inválidos' }, 400);

  await svc.from('config_parametros').upsert(
    {
      scope: scope ?? 'global',
      corporativo_id: corporativoId ?? null,
      antro_id: antroId ?? null,
      clave,
      valor,
    },
    { onConflict: 'scope,corporativo_id,antro_id,clave' },
  );
  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: corporativoId ?? null, accion: 'editar_parametro',
    entidad: 'config_parametros', entidad_id: clave, detalle: { valor },
  });
  return json({ ok: true }, 200);
});
