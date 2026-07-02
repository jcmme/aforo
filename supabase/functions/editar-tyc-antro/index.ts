// Edge Function: editar-tyc-antro
// El responsable DESIGNADO de un antro propone un nuevo T&C corto. Se puede
// editar siempre; el corte semanal solo decide cuándo aplica (ver
// aprobar-tyc). Requiere aprobación del Súper Admin. Queda en bitácora.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const { antroId, texto } = (await req.json().catch(() => ({}))) ?? {};
  if (!antroId || !texto?.trim()) return json({ error: 'Datos inválidos' }, 400);

  const svc = clienteServicio();
  const { data: antro } = await svc
    .from('antros')
    .select('id, corporativo_id, responsable_tyc_id')
    .eq('id', antroId)
    .maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);

  // Solo el responsable DESIGNADO de ESTE antro puede proponer su T&C
  // (no es un rol fijo: es la persona asignada en antros.responsable_tyc_id).
  if (antro.responsable_tyc_id !== usuario.id) {
    return json({ error: 'No eres el responsable de T&C de este antro' }, 403);
  }

  await svc.from('tyc_antro').upsert(
    {
      antro_id: antroId,
      texto_pendiente: texto.trim(),
      estado: 'esperando_aprobacion',
      propuesto_en: new Date().toISOString(),
      aprobado_en: null,
      aplica_desde: null,
    },
    { onConflict: 'antro_id' },
  );

  await svc.from('auditoria').insert({
    actor_id: usuario.id,
    corporativo_id: antro.corporativo_id,
    accion: 'proponer_tyc',
    entidad: 'tyc_antro',
    entidad_id: antroId,
  });

  return json({ ok: true }, 200);
});
