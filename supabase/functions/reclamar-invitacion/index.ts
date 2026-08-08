// Edge Function: reclamar-invitacion
// El usuario canjea un código desde el campo discreto de su perfil. Crea la
// membresía (rol/antro/corporativo amarrados). N intentos fallidos bloquean
// temporalmente el ingreso de códigos (editable, CLAUDE.md §6): defensa contra
// fuerza bruta de códigos, que de otro modo permitiría escalar privilegios.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, usuarioDeRequest } from '../_shared/auth.ts';
import { obtenerParametro } from '../_shared/config.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const { codigo } = (await req.json().catch(() => ({}))) ?? {};
  if (!codigo) return json({ ok: false, error: 'Falta código' }, 400);

  const svc = clienteServicio();

  // 1. ¿El usuario está bloqueado por intentos fallidos?
  const { data: intento } = await svc
    .from('intentos_codigo').select('*').eq('usuario_id', usuario.id).maybeSingle();
  const ahora = new Date();
  if (intento?.bloqueado_hasta && new Date(intento.bloqueado_hasta) > ahora) {
    return json({ ok: false, error: 'Demasiados intentos. Intenta más tarde.' }, 429);
  }

  const maxIntentos = (await obtenerParametro<number>(svc, 'invitacion_intentos_max')) ?? 3;
  const bloqueoMin = (await obtenerParametro<number>(svc, 'invitacion_bloqueo_minutos')) ?? 15;

  // Registra un intento fallido y bloquea al agotar el límite.
  async function registrarFallo() {
    const previos = intento?.bloqueado_hasta && new Date(intento.bloqueado_hasta) <= ahora
      ? 0 // el bloqueo anterior expiró: reinicia el conteo
      : (intento?.intentos ?? 0);
    const nuevos = previos + 1;
    const bloqueado = nuevos >= maxIntentos
      ? new Date(ahora.getTime() + bloqueoMin * 60 * 1000).toISOString()
      : null;
    await svc.from('intentos_codigo').upsert({
      usuario_id: usuario.id,
      intentos: bloqueado ? 0 : nuevos, // al bloquear, se reinicia el conteo
      ultimo_intento: ahora.toISOString(),
      bloqueado_hasta: bloqueado,
    }, { onConflict: 'usuario_id' });
  }

  // 2. Buscar el código (comparación normalizada).
  const { data: inv } = await svc
    .from('invitaciones').select('*').eq('codigo', String(codigo).trim().toUpperCase()).maybeSingle();

  const vigente = inv && !inv.revocada && inv.usos < inv.usos_max && new Date(inv.caduca_en) > ahora;
  if (!inv || !vigente) {
    await registrarFallo();
    return json({ ok: false, error: 'Código inválido o caducado' }, 200);
  }

  // 3. Alta de membresía (rol/antro/corporativo amarrados a la invitación).
  //    Si ya era miembro con ese rol, el índice único evita duplicados; se
  //    trata como éxito idempotente sin consumir un uso extra.
  const { error: errMembresia } = await svc.from('membresias').insert({
    usuario_id: usuario.id,
    corporativo_id: inv.corporativo_id,
    antro_id: inv.antro_id,
    rol: inv.rol,
  });
  const duplicado = errMembresia?.code === '23505'; // unique_violation
  if (errMembresia && !duplicado) {
    // Fallo real de escritura: no se consume el uso ni se cuenta como intento
    // (no es culpa del usuario). Se reporta error genérico.
    return json({ ok: false, error: 'No se pudo aplicar el código' }, 500);
  }

  // 4. Éxito: consumir un uso, limpiar intentos y auditar.
  if (!duplicado) {
    await svc.from('invitaciones').update({ usos: inv.usos + 1 }).eq('id', inv.id);
  }
  await svc.from('intentos_codigo')
    .upsert({ usuario_id: usuario.id, intentos: 0, ultimo_intento: ahora.toISOString(), bloqueado_hasta: null }, { onConflict: 'usuario_id' });
  await svc.from('auditoria').insert({
    actor_id: usuario.id, corporativo_id: inv.corporativo_id, accion: 'reclamar_invitacion',
    entidad: 'invitaciones', entidad_id: inv.id, detalle: { rol: inv.rol, duplicado },
  });

  return json({ ok: true, rol: inv.rol }, 200);
});
