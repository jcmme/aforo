// Firma y verificación de tokens de QR (CLAUDE.md §3 y §6).
//
// El QR es un identificador persistente y FIRMADO. La firma es HMAC-SHA256 con
// un secreto que vive SOLO en el servidor (variable AFORO_QR_SECRET). La
// validación es siempre del lado del servidor.
//
// Token: `AFORO1.<qrId>.<firmaHex>`

const PREFIX = 'AFORO1';

function secreto(): string {
  const s = Deno.env.get('AFORO_QR_SECRET');
  if (!s) throw new Error('Falta AFORO_QR_SECRET');
  return s;
}

async function hmacHex(mensaje: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secreto()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(mensaje));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Construye el token firmado para un id de QR. */
export async function firmarToken(qrId: string): Promise<string> {
  const firma = (await hmacHex(qrId)).slice(0, 32);
  return `${PREFIX}.${qrId}.${firma}`;
}

/** Verifica un token y devuelve el qrId si la firma es válida, o null. */
export async function verificarToken(token: string): Promise<string | null> {
  const partes = token.split('.');
  if (partes.length !== 3 || partes[0] !== PREFIX) return null;
  const [, qrId, firma] = partes;
  const esperado = (await hmacHex(qrId)).slice(0, 32);
  // Comparación de tiempo constante.
  if (firma.length !== esperado.length) return null;
  let diff = 0;
  for (let i = 0; i < firma.length; i++) diff |= firma.charCodeAt(i) ^ esperado.charCodeAt(i);
  return diff === 0 ? qrId : null;
}
