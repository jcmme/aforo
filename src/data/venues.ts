import { supabase } from '@/lib/supabase';
import type { OccupancyLevel, Venue, VenueFilters } from '@/types';

import { MOCK_VENUES } from './mock';

/** Distancia Haversine en km entre dos puntos. */
function distanciaKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Aplica los filtros de búsqueda en memoria (modo demo). */
function aplicarFiltros(venues: Venue[], filtros?: VenueFilters): Venue[] {
  if (!filtros) return venues;
  return venues.filter((v) => {
    if (filtros.zona && v.zona !== filtros.zona) return false;
    if (filtros.ocupacion && v.ocupacion !== filtros.ocupacion) return false;
    if (filtros.musica && !v.tiposMusica.includes(filtros.musica)) return false;
    if (filtros.texto) {
      const t = filtros.texto.toLowerCase();
      if (
        !v.nombre.toLowerCase().includes(t) &&
        !v.zona.toLowerCase().includes(t)
      ) {
        return false;
      }
    }
    return true;
  });
}

/** Mapea una fila de Supabase al modelo de dominio. */
function rowToVenue(r: Record<string, any>): Venue {
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
    cover: r.cover,
    tiposMusica: r.tipos_musica ?? [],
    fotos: r.fotos ?? [],
    ocupacion: r.ocupacion,
    ocupacionActualizada: r.ocupacion_actualizada,
  };
}

export interface ListarVenuesParams {
  filtros?: VenueFilters;
  origen?: { lat: number; lng: number };
}

/** Lista lugares aplicando filtros y, si hay ubicación, ordena por cercanía. */
export async function listarVenues({
  filtros,
  origen,
}: ListarVenuesParams = {}): Promise<Venue[]> {
  let venues: Venue[];

  if (supabase) {
    let query = supabase.from('venues').select('*');
    if (filtros?.zona) query = query.eq('zona', filtros.zona);
    if (filtros?.ocupacion) query = query.eq('ocupacion', filtros.ocupacion);
    const { data, error } = await query;
    if (error) throw error;
    venues = (data ?? []).map(rowToVenue);
    // El filtro de música (array) y texto se resuelven en cliente para el MVP.
    venues = aplicarFiltros(venues, {
      musica: filtros?.musica,
      texto: filtros?.texto,
    });
  } else {
    venues = aplicarFiltros(MOCK_VENUES, filtros);
  }

  if (origen) {
    venues = venues
      .map((v) => ({
        ...v,
        distanciaKm: distanciaKm(origen.lat, origen.lng, v.lat, v.lng),
      }))
      .sort((a, b) => (a.distanciaKm ?? 0) - (b.distanciaKm ?? 0));
  }

  return venues;
}

/** Obtiene un lugar por id. */
export async function obtenerVenue(id: string): Promise<Venue | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? rowToVenue(data) : null;
  }
  return MOCK_VENUES.find((v) => v.id === id) ?? null;
}

/** Lista de venues que administra el staff autenticado (su corporativo). */
export async function listarVenuesDeStaff(
  corporativoId: string,
): Promise<Venue[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('venues')
      .select('*')
      .eq('corporativo_id', corporativoId);
    if (error) throw error;
    return (data ?? []).map(rowToVenue);
  }
  return MOCK_VENUES.filter((v) => v.corporativoId === corporativoId);
}

/** Actualiza el nivel de aforo de un lugar (acción del venue). */
export async function actualizarOcupacion(
  venueId: string,
  ocupacion: OccupancyLevel,
): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('venues')
      .update({
        ocupacion,
        ocupacion_actualizada: new Date().toISOString(),
      })
      .eq('id', venueId);
    if (error) throw error;
    return;
  }
  // Modo demo: muta en memoria para reflejar el cambio durante la sesión.
  const v = MOCK_VENUES.find((x) => x.id === venueId);
  if (v) {
    v.ocupacion = ocupacion;
    v.ocupacionActualizada = new Date().toISOString();
  }
}

/** Zonas disponibles para el filtro (derivadas de los datos demo). */
export const ZONAS = Array.from(new Set(MOCK_VENUES.map((v) => v.zona)));
