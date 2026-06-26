import type { Venue } from '@/types';

const now = new Date().toISOString();

/**
 * Datos demo para correr AFORO sin backend.
 * Antros ficticios en zonas reales de la CDMX.
 */
export const MOCK_VENUES: Venue[] = [
  {
    id: 'v1',
    corporativoId: 'c1',
    nombre: 'Neón Roma',
    descripcion: 'Antro de electrónica con terraza en el corazón de la Roma.',
    zona: 'Roma Norte',
    direccion: 'Álvaro Obregón 120, Roma Nte.',
    lat: 19.4181,
    lng: -99.1626,
    horario: 'Jue-Sáb 22:00 - 04:00',
    cover: 250,
    tiposMusica: ['electronica', 'pop'],
    fotos: [
      'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800',
    ],
    ocupacion: 'lleno',
    ocupacionActualizada: now,
  },
  {
    id: 'v2',
    corporativoId: 'c1',
    nombre: 'Cielo Condesa',
    descripcion: 'Rooftop con vista, reggaetón y mezcal.',
    zona: 'Condesa',
    direccion: 'Av. Tamaulipas 55, Hipódromo Condesa',
    lat: 19.411,
    lng: -99.1755,
    horario: 'Mié-Sáb 21:00 - 03:00',
    cover: 150,
    tiposMusica: ['reggaeton', 'variado'],
    fotos: [
      'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800',
    ],
    ocupacion: 'moderado',
    ocupacionActualizada: now,
  },
  {
    id: 'v3',
    corporativoId: 'c2',
    nombre: 'Bajo Polanco',
    descripcion: 'Club exclusivo, lista y reservados.',
    zona: 'Polanco',
    direccion: 'Presidente Masaryk 250, Polanco',
    lat: 19.4326,
    lng: -99.1962,
    horario: 'Vie-Sáb 23:00 - 05:00',
    cover: 500,
    tiposMusica: ['hiphop', 'reggaeton'],
    fotos: [
      'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800',
    ],
    ocupacion: 'vacio',
    ocupacionActualizada: now,
  },
  {
    id: 'v4',
    corporativoId: 'c2',
    nombre: 'Tropicana Centro',
    descripcion: 'Salón de baile con banda en vivo.',
    zona: 'Centro',
    direccion: 'República de Cuba 95, Centro Histórico',
    lat: 19.4385,
    lng: -99.1366,
    horario: 'Jue-Dom 20:00 - 02:00',
    cover: 100,
    tiposMusica: ['banda', 'variado'],
    fotos: [
      'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800',
    ],
    ocupacion: 'moderado',
    ocupacionActualizada: now,
  },
];
