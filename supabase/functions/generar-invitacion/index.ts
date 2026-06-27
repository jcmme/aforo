// Edge Function: generar-invitacion
// Genera (= aprueba) una invitación de personal. Valida la ESCALERA: nadie
// invita a un rango igual o superior. Código no adivinable, caducidad editable.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, puedeAccion, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

const ESCALERA: Record<string, string[]> = {
  capitan: ['rp'],
  gerente: ['capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
  gerente_general: ['capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
  super_admin: ['dueno', 'socio', 'gerente_general', 'gerente', 'capitan', 'hostess', 'cajero', 'cadenero', 'rp'],
};

function codigo(): string {
  const a = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AF-${a()}-${a()}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();
  if (!(await puedeAccion(svc, usuario.id, 'gestionar_invitaciones', []))) {
    return json({ error: 'No autorizado' }, 403);
  }

  const { rol, antroId, corporativoId, usosMax } = (await req.json().catch(() => ({}))) ?? {};
  if (!rol || !corporativoId) return json({ error: 'Datos inválidos' }, 400);

  // Escalera: el rol pedido debe ser invitable por alguno de los roles del invitador.
  const { data: membresias } = await svc
    .from('membresias').select('rol').eq('usuario_id', usuario.id).eq('activo', true);
  const puedeInvitar = (membresias ?? []).some((m) => (ESCALERA[m.rol as string] ?? []).includes(rol));
  if (!puedeInvitar) return json({ error: 'No puedes invitar a ese rango' }, 403);

  const horas = (await obtenerParametro<number>(svc, 'invitacion_caducidad_horas')) ?? 72;
  const { data: inv, error } = await svc
    .from('invitaciones')
    .insert({
      codigo: codigo(),
      corporativo_id: corporativoId,
      antro_id: antroId ?? null,
      rol,
      usos_max: usosMax ?? 1,
      caduca_en: new Date(Date.now() + horas * 3600 * 1000).toISOString(),
      creada_por: usuario.id,
    })
    .select()
    .single();
  if (error) return json({ error: 'No se pudo crear' }, 500);

  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: corporativoId, accion: 'generar_invitacion',
    entidad: 'invitaciones', entidad_id: inv.id, detalle: { rol, usosMax },
  });
  return json({ invitacion: { ...inv, antroId: inv.antro_id, corporativoId: inv.corporativo_id, usosMax: inv.usos_max, caducaEn: inv.caduca_en, creadaEn: inv.creada_en } }, 201);
});
