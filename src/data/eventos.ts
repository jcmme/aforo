import { supabase } from '@/lib/supabase';
import type { Evento } from '@/types';

import { DEMO_EVENTOS } from './mock';

/** Mapea una fila de la tabla `eventos` al modelo de dominio. */
function filaAEvento(r: Record<string, any>): Evento {
  return {
    id: r.id,
    antroId: r.antro_id,
    corporativoId: r.corporativo_id,
    nombre: r.nombre,
    descripcion: r.descripcion,
    fecha: r.fecha,
    fotos: r.fotos ?? [],
    cupoMaximo: r.cupo_maximo,
    modalidades: r.modalidades ?? ['acceso'],
    alLlenar: r.al_llenar ?? 'cerrar',
    lugaresOcupados: r.lugares_ocupados ?? undefined,
  };
}

/** Eventos próximos de un antro. */
export async function listarEventosDeAntro(antroId: string): Promise<Evento[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('eventos')
      .select('*')
      .eq('antro_id', antroId)
      .order('fecha');
    if (error) throw error;
    return (data ?? []).map(filaAEvento);
  }
  return DEMO_EVENTOS.filter((e) => e.antroId === antroId);
}

/** Obtiene un evento por id. */
export async function obtenerEvento(id: string): Promise<Evento | null> {
  if (supabase) {
    const { data, error } = await supabase.from('eventos').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? filaAEvento(data) : null;
  }
  return DEMO_EVENTOS.find((e) => e.id === id) ?? null;
}
