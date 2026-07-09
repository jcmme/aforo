// Edge Function: moderar-foto-antro
// El Súper Admin aprueba o rechaza una foto subida por un antro. Solo cuando se
// aprueba, la foto se muestra al cliente. Exclusiva del permiso `moderar_fotos`.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'moderar_fotos', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { fotoId, aprobar } = (await req.json().catch(() => ({}))) ?? {};
  if (!fotoId || typeof aprobar !== 'boolean') return json({ error: 'Datos inválidos' }, 400);

  const { data: foto } = await svc
    .from('fotos_antro')
    .select('corporativo_id')
    .eq('id', fotoId)
    .maybeSingle();
  if (!foto) return json({ error: 'Foto no encontrada' }, 404);

  await svc
    .from('fotos_antro')
    .update({
      estado: aprobar ? 'aprobada' : 'rechazada',
      aprobada_por: usuario.id,
      aprobada_en: new Date().toISOString(),
    })
    .eq('id', fotoId);

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: foto.corporativo_id,
    accion: aprobar ? 'aprobar_foto' : 'rechazar_foto',
    entidad: 'fotos_antro',
    entidad_id: fotoId,
    detalle: { aprobar },
  });

  return json({ ok: true }, 200);
});
