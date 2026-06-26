import { supabase } from '@/lib/supabase';
import type { Antro } from '@/types';

import { DEMO_ANTROS } from './mock';

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
