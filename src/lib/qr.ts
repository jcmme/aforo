import * as Crypto from 'expo-crypto';

import { appScheme } from './config';

/**
 * Formato del token de QR de AFORO.
 *
 * El QR es un identificador PERSISTENTE y FIRMADO, no un boleto de un solo uso
 * (CLAUDE.md §6). El token lleva el id del QR y una firma; el servidor valida la
 * firma y resuelve el resto contra la base de datos. La validación siempre es
 * del lado del servidor.
 *
 * Token: `AFORO1.<qrId>.<firma>`
 *
 * En producción la firma es HMAC con un secreto que vive SOLO en el servidor
 * (Edge Function). En MODO DEMO se firma localmente con el secreto de desarrollo
 * de abajo para poder navegar el flujo sin backend. Esa firma NO es segura y
 * jamás debe usarse en producción.
 */
const PREFIX = 'AFORO1';

/** Secreto de desarrollo. Solo para modo demo. NO usar en producción. */
const DEMO_SECRET = 'aforo-demo-secret-no-produccion';

/** Firma de desarrollo (SHA-256 del secreto + cuerpo). Solo demo. */
export async function firmaDemo(qrId: string): Promise<string> {
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${DEMO_SECRET}:${qrId}`,
  );
  return hash.slice(0, 16);
}

/** Construye el token de QR (demo) a partir del id del QR. */
export async function construirTokenDemo(qrId: string): Promise<string> {
  const firma = await firmaDemo(qrId);
  return `${PREFIX}.${qrId}.${firma}`;
}

/** Extrae el id del QR de un token, o `null` si el formato no es válido. */
export function leerQrIdDeToken(token: string): string | null {
  const partes = token.split('.');
  if (partes.length !== 3 || partes[0] !== PREFIX) return null;
  return partes[1];
}

/** Enlace de reclamo que el RP/cliente comparte; al abrirlo el QR se distribuye. */
export function enlaceReclamo(token: string): string {
  return `${appScheme}://reclamar/${encodeURIComponent(token)}`;
}
