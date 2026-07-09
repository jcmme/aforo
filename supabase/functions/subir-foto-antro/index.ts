// Edge Function: subir-foto-antro
// Un antro (gerente) registra una foto para su antro. Nace 'pendiente' hasta
// que el Súper Admin la apruebe. Valida permiso Y pertenencia al corporativo
// del antro (aislamiento multi-tenant estricto). El máximo de fotos y el
// formato se validan aquí y en la app.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';

const MAX_FOTOS = 8;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'subir_foto_antro', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { antroId, url } = (await req.json().catch(() => ({}))) ?? {};
  if (!antroId || !url) return json({ error: 'Falta antroId o url' }, 400);

  const { data: antro } = await svc
    .from('antros')
    .select('corporativo_id')
    .eq('id', antroId)
    .maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);

  // Pertenencia al tenant: el que sube debe ser del corporativo del antro
  // (salvo súper admin). Cierra el hueco de "rol sin validar tenant".
  if (!(await puedeAccion(svc, usuario.id, 'moderar_fotos', []))) {
    const { data: mem } = await svc
      .from('membresias')
      .select('id')
      .eq('usuario_id', usuario.id)
      .eq('corporativo_id', antro.corporativo_id)
      .eq('activo', true)
      .maybeSingle();
    if (!mem) return json({ error: 'No perteneces a este antro' }, 403);
  }

  const { count } = await svc
    .from('fotos_antro')
    .select('id', { count: 'exact', head: true })
    .eq('antro_id', antroId)
    .neq('estado', 'rechazada');
  if ((count ?? 0) >= MAX_FOTOS) {
    return json({ error: `Máximo ${MAX_FOTOS} fotos por antro` }, 409);
  }

  const { data: foto, error } = await svc
    .from('fotos_antro')
    .insert({
      antro_id: antroId,
      corporativo_id: antro.corporativo_id,
      url,
      estado: 'pendiente',
      orden: count ?? 0,
      subida_por: usuario.id,
    })
    .select()
    .single();
  if (error) return json({ error: 'No se pudo subir la foto' }, 500);

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: antro.corporativo_id,
    accion: 'subir_foto_antro',
    entidad: 'fotos_antro',
    entidad_id: foto.id,
    detalle: { antroId },
  });

  return json({ foto }, 201);
});
