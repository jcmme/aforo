import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from './config';

/**
 * Cliente de Supabase. Es `null` en modo demo (sin credenciales).
 *
 * La sesión se persiste en AsyncStorage y se refresca sola. Toda lectura/
 * escritura viaja con el JWT del usuario; el aislamiento multi-tenant y la
 * denegación por defecto se aplican con RLS del lado del servidor.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
