import type { OccupancyLevel } from './types';

/** Paleta y tokens visuales de AFORO (tema nocturno). */
export const colors = {
  bg: '#0B0B12',
  surface: '#15151F',
  surfaceAlt: '#1E1E2B',
  border: '#2A2A3A',
  text: '#F5F5FA',
  textMuted: '#9A9AB0',
  primary: '#7C3AED',
  primaryDark: '#5B21B6',
  // Semáforo de aforo
  vacio: '#22C55E',
  moderado: '#F59E0B',
  lleno: '#EF4444',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

/** Etiqueta y color para cada nivel de ocupación. */
export const occupancy: Record<
  OccupancyLevel,
  { label: string; color: string }
> = {
  vacio: { label: 'Vacío', color: colors.vacio },
  moderado: { label: 'Moderado', color: colors.moderado },
  lleno: { label: 'Lleno', color: colors.lleno },
};
