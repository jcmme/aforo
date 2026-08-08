import { supabase } from '@/lib/supabase';
import { DEMO_RESENAS, DEMO_RESERVAS, DEMO_RESERVAS_SEED, type ResenaSeed } from './mock';
import type { Resena } from '@/types';

/** Motivos por defecto si no hay config (modo demo). El último exige nota. */
const MOTIVOS_REPORTE_DEMO = [
  'Contenido falso o engañoso',
  'Discurso de odio o discriminación',
  'Acoso o amenazas',
  'Contenido sexual o inapropiado',
  'Suplantación de identidad',
  'Otro',
];

// Reseñas del cliente hacia el antro (CLAUDE.md §6, ronda 5). Solo estrellas +
// foto por ahora; el comentario de texto queda listo en el modelo, sin UI
// ("veremos"). Solo puede reseñar quien tuvo una reserva `completada` en ese
// antro — evita reseñas de quien nunca llegó.

function aResena(r: ResenaSeed): Resena {
  return {
    id: r.id,
    antroId: r.antroId,
    clienteNombre: r.clienteNombre,
    estrellas: r.estrellas,
    fotoUrl: r.fotoUrl,
    comentario: r.comentario,
    creadoEn: r.creadoEn,
  };
}

/** Reseñas de un antro (lectura pública, para la ficha del lugar). */
export async function listarResenasDeAntro(antroId: string): Promise<Resena[]> {
  if (supabase) {
    const { data } = await supabase
      .from('resenas_antro')
      .select('*, usuarios(nombre)')
      .eq('antro_id', antroId)
      .order('creado_en', { ascending: false });
    return (data ?? []).map((r: Record<string, any>) => ({
      id: r.id,
      antroId: r.antro_id,
      clienteNombre: r.usuarios?.nombre ?? 'Cliente',
      estrellas: r.estrellas,
      fotoUrl: r.foto_url,
      comentario: r.comentario,
      creadoEn: r.creado_en,
    }));
  }
  return DEMO_RESENAS.filter((r) => r.antroId === antroId).map(aResena);
}

/** Promedio de estrellas de un antro (0 si no tiene reseñas). */
export function promedioEstrellas(resenas: Resena[]): number {
  if (resenas.length === 0) return 0;
  return resenas.reduce((s, r) => s + r.estrellas, 0) / resenas.length;
}

/** ¿El cliente tuvo alguna reserva completada (llegó) en este antro? */
export async function puedeResenar(antroId: string): Promise<boolean> {
  if (supabase) {
    const { data } = await supabase
      .from('reservas')
      .select('id')
      .eq('antro_id', antroId)
      .eq('estado', 'completada')
      .limit(1);
    return Boolean(data && data.length > 0);
  }
  // Demo: cualquier reserva sembrada/creada con al menos un QR usado en puerta.
  return [...DEMO_RESERVAS_SEED, ...DEMO_RESERVAS].some(
    (r) => r.antroId === antroId && r.qrs.some((q) => q.estado === 'usado_puerta'),
  );
}

/** Registra una reseña (estrellas + foto opcional). */
export async function crearResena(
  antroId: string,
  estrellas: number,
  fotoUrl: string | null,
): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('crear-resena', {
      body: { antroId, estrellas, fotoUrl },
    });
    if (error) throw new Error(error.message);
    return;
  }
  DEMO_RESENAS.unshift({
    id: `res-${Date.now()}`,
    antroId,
    clienteNombre: 'Tú',
    estrellas,
    fotoUrl,
    comentario: null,
    creadoEn: new Date().toISOString(),
  });
}

/** Motivos configurables para reportar una reseña (el último exige nota). */
export async function motivosReporteContenido(): Promise<string[]> {
  if (supabase) {
    const { data } = await supabase
      .from('config_parametros')
      .select('valor')
      .eq('clave', 'motivos_reporte_contenido')
      .eq('scope', 'global')
      .maybeSingle();
    return Array.isArray(data?.valor) ? data.valor : MOTIVOS_REPORTE_DEMO;
  }
  return MOTIVOS_REPORTE_DEMO;
}

/** Reporta una reseña (o su foto) que incumple las Normas de la Comunidad. */
export async function reportarResena(resenaId: string, motivo: string, nota: string | null): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('reportar-resena', {
      body: { resenaId, motivo, nota },
    });
    if (error) throw new Error(error.message);
    return;
  }
  // Demo: no hay panel Cadena dinámico; solo se confirma la acción.
}
