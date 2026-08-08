import AsyncStorage from '@react-native-async-storage/async-storage';

import type { EscaneoEnCola } from '@/types';

/**
 * Cola local de escaneos de puerta (CLAUDE.md §3).
 *
 * La conectividad de madrugada es mala, así que los escaneos se guardan en el
 * dispositivo y se sincronizan al recuperar señal. Aquí queda la ARQUITECTURA:
 * encolar, leer pendientes y vaciar la cola enviando cada uno. La detección de
 * red robusta y los reintentos con backoff son trabajo de producción.
 */
const CLAVE = 'aforo.cola_escaneos';

async function leer(): Promise<EscaneoEnCola[]> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE);
    return raw ? (JSON.parse(raw) as EscaneoEnCola[]) : [];
  } catch {
    return [];
  }
}

async function guardar(items: EscaneoEnCola[]): Promise<void> {
  await AsyncStorage.setItem(CLAVE, JSON.stringify(items));
}

/** Agrega un escaneo a la cola (cuando no hubo conexión). */
export async function encolar(escaneo: EscaneoEnCola): Promise<void> {
  const items = await leer();
  items.push(escaneo);
  await guardar(items);
}

/** Número de escaneos pendientes de sincronizar. */
export async function pendientes(): Promise<number> {
  return (await leer()).length;
}

/**
 * Vacía la cola enviando cada escaneo con `enviar`. Si uno falla, se conserva
 * para el siguiente intento.
 */
export async function sincronizar(
  enviar: (escaneo: EscaneoEnCola) => Promise<void>,
): Promise<{ enviados: number; restantes: number }> {
  const items = await leer();
  const restantes: EscaneoEnCola[] = [];
  let enviados = 0;
  for (const item of items) {
    try {
      await enviar(item);
      enviados++;
    } catch {
      restantes.push(item);
    }
  }
  await guardar(restantes);
  return { enviados, restantes: restantes.length };
}
