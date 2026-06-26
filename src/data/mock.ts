import type { Antro, Corporativo, Evento, Reserva, Usuario } from '@/types';

// Datos de demostración (CLAUDE.md §11). Espejo del seed de Supabase, para
// navegar el flujo del cliente sin backend. Dos corporativos en Puebla.

export const DEMO_CORPORATIVOS: Corporativo[] = [
  { id: 'corp-1', nombre: 'Grupo Nocturno Puebla', plan: 'pro', creadoEn: '2026-01-01T00:00:00Z' },
  { id: 'corp-2', nombre: 'Distrito Angelópolis', plan: 'pro', creadoEn: '2026-01-01T00:00:00Z' },
];

export const DEMO_ANTROS: Antro[] = [
  {
    id: 'antro-1',
    corporativoId: 'corp-1',
    nombre: 'Lumen',
    descripcion: 'Club de electrónica y house en el corazón de la Juárez.',
    zona: 'La Paz',
    direccion: 'Av. Juárez 2104, La Paz, Puebla',
    lat: 19.0444,
    lng: -98.2,
    horario: 'Jue-Sáb 22:00 - 04:00',
    fotos: ['https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800'],
    modalidades: ['acceso', 'mesa'],
    ventanaCancelacion: '18:00',
    alLlenar: 'lista_espera',
  },
  {
    id: 'antro-2',
    corporativoId: 'corp-1',
    nombre: 'Terraza Cholula',
    descripcion: 'Rooftop con reggaetón y vista a los volcanes.',
    zona: 'Cholula',
    direccion: 'Calle 14 Ote 611, San Pedro Cholula',
    lat: 19.0634,
    lng: -98.3072,
    horario: 'Mié-Sáb 21:00 - 03:00',
    fotos: ['https://images.unsplash.com/photo-1545128485-c400e7702796?w=800'],
    modalidades: ['acceso', 'mesa'],
    ventanaCancelacion: '20:00',
    alLlenar: 'cerrar',
  },
  {
    id: 'antro-3',
    corporativoId: 'corp-2',
    nombre: 'Distrito 23',
    descripcion: 'Antro multinivel en Angelópolis, hip-hop y comercial.',
    zona: 'Angelópolis',
    direccion: 'Blvd. del Niño Poblano 2510, Angelópolis',
    lat: 19.0185,
    lng: -98.2401,
    horario: 'Vie-Sáb 23:00 - 05:00',
    fotos: ['https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800'],
    modalidades: ['acceso', 'mesa'],
    ventanaCancelacion: '21:00',
    alLlenar: 'lista_espera',
  },
];

const proximoViernes = '2026-07-03T22:00:00Z';
const proximoSabado = '2026-07-04T22:00:00Z';

export const DEMO_EVENTOS: Evento[] = [
  {
    id: 'evt-1',
    antroId: 'antro-1',
    corporativoId: 'corp-1',
    nombre: 'Lumen presenta: ANNA',
    descripcion: 'Noche de techno melódico con invitada internacional.',
    fecha: proximoViernes,
    fotos: ['https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800'],
    cupoMaximo: 300,
    modalidades: ['acceso', 'mesa'],
    alLlenar: 'lista_espera',
    lugaresOcupados: 180,
  },
  {
    id: 'evt-2',
    antroId: 'antro-1',
    corporativoId: 'corp-1',
    nombre: 'House Sessions',
    descripcion: 'Residentes de la casa, entrada general.',
    fecha: proximoSabado,
    fotos: ['https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=800'],
    cupoMaximo: 250,
    modalidades: ['acceso', 'mesa'],
    alLlenar: 'cerrar',
    lugaresOcupados: 90,
  },
  {
    id: 'evt-3',
    antroId: 'antro-2',
    corporativoId: 'corp-1',
    nombre: 'Terraza Sunset',
    descripcion: 'Reggaetón y mezcal al atardecer.',
    fecha: proximoViernes,
    fotos: ['https://images.unsplash.com/photo-1556035511-3168381ea4d4?w=800'],
    cupoMaximo: 150,
    modalidades: ['acceso', 'mesa'],
    alLlenar: 'cerrar',
    lugaresOcupados: 60,
  },
  {
    id: 'evt-4',
    antroId: 'antro-3',
    corporativoId: 'corp-2',
    nombre: 'Distrito Saturday',
    descripcion: 'Hip-hop en planta baja, comercial arriba.',
    fecha: proximoSabado,
    fotos: ['https://images.unsplash.com/photo-1605723517503-3cadb5818a0c?w=800'],
    cupoMaximo: 400,
    modalidades: ['acceso', 'mesa'],
    alLlenar: 'lista_espera',
    lugaresOcupados: 320,
  },
];

/** Consumo mínimo por mesa (demo). En producción vive en config por antro. */
export const DEMO_CONSUMO_MINIMO_MESA = 5000;

/** Cliente de demostración (sesión simulada al entrar sin backend). */
export const DEMO_USUARIO: Usuario = {
  id: 'user-demo',
  nombre: 'Invitado Demo',
  username: 'invitado',
  email: 'demo@aforo.app',
  telefono: '+522221234567',
  emailVerificado: true,
  telefonoVerificado: false,
  creadoEn: '2026-06-01T00:00:00Z',
};

/** Store en memoria de reservas creadas durante la sesión demo. */
export const DEMO_RESERVAS: Reserva[] = [];
