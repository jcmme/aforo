// Edge Function: eliminar-cuenta
// Borra la cuenta del usuario autenticado. Es requisito duro de App Store
// (guideline 5.1.1(v): toda app con registro debe permitir borrar la cuenta
// desde la propia app) y derecho de cancelación bajo la LFPDPPP.
//
// Las reservas históricas se conservan ANONIMIZADAS: alimentan métricas y
// aforo del negocio pero dejan de estar ligadas a una persona. Todo lo demás
// (perfil, membresías, huella de dispositivo, reputación, insignias,
// notificaciones) se elimina en cascada al borrar el usuario de Auth.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio, usuarioDeRequest } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const usuario = await usuarioDeRequest(req);
  if (!usuario) return json({ error: 'No autenticado' }, 401);

  const svc = clienteServicio();

  // 1) Anonimizar reservas: se desligan del titular y quedan como registro
  //    operativo sin datos personales (la restricción de la tabla exige un
  //    nombre cuando no hay cliente, por eso el marcador).
  await svc
    .from('reservas')
    .update({ cliente_id: null, invitado_nombre: 'Cuenta eliminada', invitado_telefono: null })
    .eq('cliente_id', usuario.id);

  // 2) Bitácora ANTES del borrado (el actor queda null después, por diseño:
  //    no debe sobrevivir referencia al titular, solo constancia del hecho).
  await svc.from('auditoria').insert({
    actor_id: null,
    corporativo_id: null,
    accion: 'eliminar_cuenta',
    entidad: 'usuarios',
    entidad_id: usuario.id,
    detalle: { motivo: 'solicitud del titular' },
  });

  // 3) Borrado real en Auth: la cascada elimina perfil, membresías, huella,
  //    reputación, insignias y notificaciones (FK on delete cascade).
  const { error } = await svc.auth.admin.deleteUser(usuario.id);
  if (error) return json({ error: 'No se pudo eliminar la cuenta' }, 500);

  return json({ ok: true });
});
