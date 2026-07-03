import { supabase } from '@/lib/supabase';
import { DEMO_CONFIG_EDITABLE } from './mock';

/**
 * Textos y enlaces legales. Google Play exige un enlace al aviso de
 * privacidad DENTRO de la app (no solo en la ficha de la tienda), y Apple lo
 * revisa también. La URL es un parámetro editable (CLAUDE.md: configuración
 * sin código) para poder sustituir el borrador por la versión del abogado
 * sin publicar una actualización.
 */
export async function avisoPrivacidadUrl(): Promise<string> {
  if (supabase) {
    const { data } = await supabase
      .from('config_parametros')
      .select('valor')
      .eq('clave', 'aviso_privacidad_url')
      .eq('scope', 'global')
      .maybeSingle();
    return typeof data?.valor === 'string' ? data.valor : '';
  }
  return DEMO_CONFIG_EDITABLE.find((c) => c.clave === 'aviso_privacidad_url')?.valor ?? '';
}
