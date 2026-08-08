import { supabase } from '@/lib/supabase';
import type { Antro, FotoAntro } from '@/types';

import { DEMO_ANTROS, DEMO_FOTOS_ANTRO } from './mock';

/**
 * Formato estándar de las fotos de antro (uniforme para que la galería nunca
 * "salte"). Se comunica a los antros al subir. La app recorta al mismo encuadre
 * (aspectRatio) aunque la foto original difiera un poco.
 */
export const FORMATO_FOTO_ANTRO = {
  proporcion: '3:2 horizontal (apaisado)',
  aspectRatio: 3 / 2,
  recomendado: '1620 × 1080 px',
  minimo: '1200 × 800 px',
  tipo: 'JPG o PNG, sRGB',
  pesoMax: '2 MB',
  maxFotos: 8,
} as const;

/** Mapea una fila de la tabla `antros` al modelo de dominio. */
function filaAAntro(r: Record<string, any>): Antro {
  return {
    id: r.id,
    corporativoId: r.corporativo_id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    zona: r.zona,
    direccion: r.direccion,
    lat: r.lat,
    lng: r.lng,
    horario: r.horario,
    fotos: r.fotos ?? [],
    modalidades: r.modalidades ?? ['acceso'],
    ventanaCancelacion: r.ventana_cancelacion ?? '18:00',
    alLlenar: r.al_llenar ?? 'cerrar',
  };
}

/** Lista de antros visibles para el cliente (lectura pública vía RLS). */
export async function listarAntros(): Promise<Antro[]> {
  if (supabase) {
    const { data, error } = await supabase.from('antros').select('*').order('nombre');
    if (error) throw error;
    return (data ?? []).map(filaAAntro);
  }
  return DEMO_ANTROS;
}

/** Obtiene un antro por id. */
export async function obtenerAntro(id: string): Promise<Antro | null> {
  if (supabase) {
    const { data, error } = await supabase.from('antros').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? filaAAntro(data) : null;
  }
  return DEMO_ANTROS.find((a) => a.id === id) ?? null;
}

/**
 * Fotos APROBADAS de un antro, en orden, para la galería del cliente. Si no
 * hay ninguna aprobada, cae a la foto principal del antro (nunca queda hueco).
 */
export async function fotosAprobadasDeAntro(antroId: string): Promise<string[]> {
  if (supabase) {
    const { data } = await supabase
      .from('fotos_antro')
      .select('url')
      .eq('antro_id', antroId)
      .eq('estado', 'aprobada')
      .order('orden');
    const urls = (data ?? []).map((f: { url: string }) => f.url);
    if (urls.length > 0) return urls;
    const a = await obtenerAntro(antroId);
    return a?.fotos ?? [];
  }
  const urls = DEMO_FOTOS_ANTRO.filter((f) => f.antroId === antroId && f.estado === 'aprobada')
    .sort((a, b) => a.orden - b.orden)
    .map((f) => f.url);
  if (urls.length > 0) return urls;
  return DEMO_ANTROS.find((a) => a.id === antroId)?.fotos ?? [];
}

/** Fotos PENDIENTES de aprobación (cola del Súper Admin). */
export async function listarFotosPendientes(): Promise<FotoAntro[]> {
  if (supabase) {
    const { data } = await supabase
      .from('fotos_antro')
      .select('id, antro_id, url, estado, orden, antros(nombre)')
      .eq('estado', 'pendiente')
      .order('orden');
    return (data ?? []).map((f: Record<string, any>) => ({
      id: f.id,
      antroId: f.antro_id,
      antroNombre: f.antros?.nombre ?? '',
      url: f.url,
      estado: f.estado,
      orden: f.orden,
    }));
  }
  return DEMO_FOTOS_ANTRO.filter((f) => f.estado === 'pendiente').map((f) => ({
    id: f.id,
    antroId: f.antroId,
    antroNombre: DEMO_ANTROS.find((a) => a.id === f.antroId)?.nombre ?? '',
    url: f.url,
    estado: f.estado,
    orden: f.orden,
  }));
}

/** Modera una foto (Súper Admin): aprobar o rechazar. Demo: muta la semilla. */
export async function moderarFoto(id: string, aprobar: boolean): Promise<void> {
  if (supabase) {
    await supabase.functions.invoke('moderar-foto-antro', { body: { fotoId: id, aprobar } });
    return;
  }
  const f = DEMO_FOTOS_ANTRO.find((x) => x.id === id);
  if (f) f.estado = aprobar ? 'aprobada' : 'rechazada';
}
