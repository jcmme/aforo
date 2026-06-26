/**
 * Configuración de entorno.
 *
 * Las credenciales de Supabase se leen de variables `EXPO_PUBLIC_*`
 * (ver `.env.example`). Si no están definidas, la app arranca en
 * MODO DEMO con datos locales, para poder verla correr sin backend.
 */
export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** `true` cuando hay credenciales de Supabase configuradas. */
export const isSupabaseConfigured =
  supabaseUrl.length > 0 && supabaseAnonKey.length > 0;
