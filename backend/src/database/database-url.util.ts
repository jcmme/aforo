/**
 * Neon agrega "channel_binding=require" a sus connection strings por
 * default, pero el driver de Postgres para Node (pg, el que usa TypeORM)
 * no lo soporta — en vez de fallar rápido, se queda colgado negociándolo
 * hasta que la función de Vercel se mata por timeout. Se quita siempre,
 * sin importar de dónde venga la URL (env var administrada por una
 * integración, copiada a mano, etc.).
 */
export function limpiarUrlConexion(url: string | undefined): string | undefined {
  if (!url) return url;
  const [base, query] = url.split('?');
  if (!query) return url;

  const params = query.split('&').filter((param) => !param.startsWith('channel_binding='));
  return params.length ? `${base}?${params.join('&')}` : base;
}
