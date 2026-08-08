// Resolución de parámetros de negocio (configuración sin código, CLAUDE.md §2).
// Precedencia: antro > corporativo > global.

import type { SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export async function obtenerParametro<T = unknown>(
  svc: SupabaseClient,
  clave: string,
  ctx: { corporativoId?: string; antroId?: string } = {},
): Promise<T | null> {
  const { data } = await svc
    .from('config_parametros')
    .select('scope, corporativo_id, antro_id, valor')
    .eq('clave', clave);
  if (!data || data.length === 0) return null;

  const peso = (r: { scope: string; corporativo_id: string | null; antro_id: string | null }) => {
    if (r.scope === 'antro' && r.antro_id === ctx.antroId) return 3;
    if (r.scope === 'corporativo' && r.corporativo_id === ctx.corporativoId) return 2;
    if (r.scope === 'global') return 1;
    return 0;
  };

  const elegido = data
    .map((r) => ({ r, p: peso(r as never) }))
    .filter((x) => x.p > 0)
    .sort((a, b) => b.p - a.p)[0];

  return elegido ? (elegido.r.valor as T) : null;
}
