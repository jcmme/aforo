// Edge Function: reclamar-qr
// Marca un QR como "distribuido" a partir de su token firmado. Base del enlace
// de reclamo del RP/cliente (CLAUDE.md §6). Un QR nunca distribuido no penaliza.
// Es público (no requiere sesión): lo abre quien recibe el enlace.

import { cors, json } from '../_shared/cors.ts';
import { clienteServicio } from '../_shared/auth.ts';
import { verificarToken } from '../_shared/qr.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const body = await req.json().catch(() => null);
  const token = body?.token;
  if (!token) return json({ error: 'Falta token' }, 400);

  // La firma se valida en el servidor (nunca solo en el dispositivo).
  const qrId = await verificarToken(token);
  if (!qrId) return json({ error: 'Token inválido' }, 400);

  const svc = clienteServicio();
  const { data: qr } = await svc.from('qr_codes').select('*').eq('id', qrId).maybeSingle();
  if (!qr || qr.token !== token) return json({ error: 'QR no encontrado' }, 404);

  // Idempotente: si ya estaba distribuido o usado, no se altera.
  if (qr.estado === 'pendiente') {
    await svc
      .from('qr_codes')
      .update({ estado: 'distribuido', distribuido_en: new Date().toISOString() })
      .eq('id', qrId);
    await svc
      .from('enlaces_reclamo')
      .update({ reclamado: true, reclamado_en: new Date().toISOString() })
      .eq('qr_id', qrId);
  }

  return json({ ok: true, estado: qr.estado === 'pendiente' ? 'distribuido' : qr.estado });
});
