import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Consentimiento de privacidad del usuario (LFPDPPP + Apple §5.1.1(ii)).
 * Se registra al aceptar la pantalla de bienvenida y se puede consultar/revocar
 * desde Ajustes de privacidad. En esta etapa se guarda localmente
 * (AsyncStorage); al conectar el backend se persistirá también en el perfil.
 */
export interface Consentimiento {
  aceptado: boolean;
  /** Finalidad secundaria: comunicaciones promocionales (puede negarse). */
  promociones: boolean;
  fecha: string | null;
}

const CLAVE = 'aforo.consentimiento.v1';

const POR_DEFECTO: Consentimiento = { aceptado: false, promociones: true, fecha: null };

export async function obtenerConsentimiento(): Promise<Consentimiento> {
  try {
    const raw = await AsyncStorage.getItem(CLAVE);
    return raw ? { ...POR_DEFECTO, ...JSON.parse(raw) } : POR_DEFECTO;
  } catch {
    return POR_DEFECTO;
  }
}

export async function guardarConsentimiento(c: Partial<Consentimiento>): Promise<void> {
  const actual = await obtenerConsentimiento();
  const nuevo: Consentimiento = { ...actual, ...c };
  try {
    await AsyncStorage.setItem(CLAVE, JSON.stringify(nuevo));
  } catch {
    /* almacenamiento no disponible: se ignora en demo */
  }
}

/** Acepta el aviso (finalidades primarias + huella de fraude) y guarda la fecha. */
export async function aceptarAviso(promociones: boolean): Promise<void> {
  await guardarConsentimiento({ aceptado: true, promociones, fecha: new Date().toISOString() });
}

/** Revoca el consentimiento (el usuario podrá seguir usando lo mínimo o cerrar). */
export async function revocarConsentimiento(): Promise<void> {
  await guardarConsentimiento({ aceptado: false, fecha: new Date().toISOString() });
}
