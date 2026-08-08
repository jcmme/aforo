// Edge Function: reportar-resena
// El cliente reporta una reseña (o su foto) que incumple las Normas de la
// Comunidad. El último motivo configurado ("Otro") exige explicación. Escala
// al panel Cadena (incidencias) para que el gerente del antro y Súper Admin
// lo revisen — mismo patrón que el acceso manual en puerta (CLAUDE.md §6).

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'reportar_contenido', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { resenaId, motivo, nota } = (await req.json().catch(() => ({}))) ?? {};
  if (!resenaId || !motivo) return json({ error: 'Falta resenaId o motivo' }, 400);

  const motivos = (await obtenerParametro<string[]>(svc, 'motivos_reporte_contenido')) ?? [];
  const motivoOtro = motivos[motivos.length - 1] ?? 'Otro';
  if (motivo === motivoOtro && !(nota && nota.trim())) {
    return json({ error: 'El motivo "Otro" exige una explicación' }, 400);
  }

  const { data: resena } = await svc
    .from('resenas_antro')
    .select('antro_id, cliente_id')
    .eq('id', resenaId)
    .maybeSingle();
  if (!resena) return json({ error: 'Reseña no encontrada' }, 404);
  if (resena.cliente_id === usuario.id) {
    return json({ error: 'No puedes reportar tu propia reseña' }, 400);
  }

  const { data: antro } = await svc
    .from('antros')
    .select('corporativo_id')
    .eq('id', resena.antro_id)
    .maybeSingle();
  if (!antro) return json({ error: 'Antro no encontrado' }, 404);

  await svc.from('incidencias').insert({
    antro_id: resena.antro_id,
    corporativo_id: antro.corporativo_id,
    tipo: 'resena_reportada',
    detalle: { resenaId, motivo, nota: nota ?? null, reportadoPor: usuario.id, autorResenaId: resena.cliente_id },
    responsable_id: null,
  });

  return json({ ok: true }, 201);
});
