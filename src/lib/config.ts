/**
 * Configuración de entorno.
 *
 * Las credenciales de Supabase se leen de variables `EXPO_PUBLIC_*` (ver
 * `.env.example`). Si no están definidas, la app arranca en MODO DEMO con datos
 * locales (seed), para poder navegar lo construido sin backend.
 *
 * Nota de seguridad: la `anon key` es pública por diseño y solo sirve con RLS
 * activado. Ninguna clave de servicio (`service_role`) debe vivir en el cliente.
 */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;

/** URL base para construir enlaces de reclamo de QR (deep links). */
export const appScheme = 'aforo';
