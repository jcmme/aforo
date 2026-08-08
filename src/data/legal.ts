import { supabase } from '@/lib/supabase';
import { DEMO_CONFIG_EDITABLE } from './mock';
import { AVISO_PRIVACIDAD_TEXTO, TERMINOS_USO_TEXTO } from './legalTextos';

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

/**
 * Texto completo del Aviso de Privacidad, para mostrarse DENTRO de la app
 * (Perfil → Políticas y privacidad), no solo como enlace externo. Editable
 * sin publicar actualización (config_parametros, migración 0013).
 */
export async function avisoPrivacidadTexto(): Promise<string> {
  if (supabase) {
    const { data } = await supabase
      .from('config_parametros')
      .select('valor')
      .eq('clave', 'aviso_privacidad_texto')
      .eq('scope', 'global')
      .maybeSingle();
    return typeof data?.valor === 'string' ? data.valor : AVISO_PRIVACIDAD_TEXTO;
  }
  return (
    DEMO_CONFIG_EDITABLE.find((c) => c.clave === 'aviso_privacidad_texto')?.valor ?? AVISO_PRIVACIDAD_TEXTO
  );
}

/** Texto completo de los Términos y Condiciones de Uso, mismo criterio. */
export async function terminosUsoTexto(): Promise<string> {
  if (supabase) {
    const { data } = await supabase
      .from('config_parametros')
      .select('valor')
      .eq('clave', 'terminos_uso_texto')
      .eq('scope', 'global')
      .maybeSingle();
    return typeof data?.valor === 'string' ? data.valor : TERMINOS_USO_TEXTO;
  }
  return DEMO_CONFIG_EDITABLE.find((c) => c.clave === 'terminos_uso_texto')?.valor ?? TERMINOS_USO_TEXTO;
}
