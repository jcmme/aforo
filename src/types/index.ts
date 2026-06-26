// Modelo de dominio de AFORO (MVP)

/** Nivel de ocupación de un lugar. */
export type OccupancyLevel = 'vacio' | 'moderado' | 'lleno';

/** Tipo de música / ambiente del lugar. */
export type MusicType =
  | 'reggaeton'
  | 'electronica'
  | 'banda'
  | 'pop'
  | 'rock'
  | 'hiphop'
  | 'variado';

/** Rol del usuario autenticado. */
export type UserRole = 'cliente' | 'venue_staff';

/** Antro / lugar. Pertenece a un corporativo (tenant). */
export interface Venue {
  id: string;
  corporativoId: string;
  nombre: string;
  descripcion: string | null;
  zona: string;
  direccion: string;
  lat: number;
  lng: number;
  /** Horario legible, p. ej. "Jue-Sáb 22:00 - 04:00". */
  horario: string;
  /** Cover en MXN. 0 = sin cover. */
  cover: number;
  tiposMusica: MusicType[];
  fotos: string[];
  ocupacion: OccupancyLevel;
  /** ISO timestamp de la última actualización de aforo. */
  ocupacionActualizada: string;
  /** Distancia en km respecto al usuario (sólo si se calcula). */
  distanciaKm?: number;
}

/** Perfil del usuario (extiende auth.users en Supabase). */
export interface Profile {
  id: string;
  email: string;
  nombre: string | null;
  rol: UserRole;
  /** Sólo para venue_staff: corporativo al que pertenece. */
  corporativoId: string | null;
}

/** Filtros de búsqueda del listado. */
export interface VenueFilters {
  texto?: string;
  zona?: string | null;
  musica?: MusicType | null;
  ocupacion?: OccupancyLevel | null;
}
