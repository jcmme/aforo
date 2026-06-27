import type { Antro, Corporativo, Evento, QRInvitado, Reserva, Usuario } from '@/types';

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

// ---------------------------------------------------------------------------
// Sección 2 — datos para probar la operación en piso (cadenero/hostess/capitán)
// ---------------------------------------------------------------------------

/** Nombres de RP de demostración (en real saldrían de `usuarios`). */
export const DEMO_RP_NOMBRES: Record<string, string> = {
  'rp-ana': 'Ana Torres',
  'rp-luis': 'Luis Mejía',
};

/** Token demo para un QR (en real lo firma el servidor con HMAC). */
function tokenDemo(qrId: string): string {
  return `AFORO1.${qrId}.demo`;
}

function qrSeed(id: string, reservaId: string, estado: QRInvitado['estado']): QRInvitado {
  return {
    id,
    reservaId,
    token: tokenDemo(id),
    estado,
    distribuidoEn: estado === 'pendiente' ? null : '2026-07-03T22:30:00Z',
    usadoEn: estado === 'usado_puerta' ? '2026-07-03T23:10:00Z' : null,
  };
}

/**
 * Reservas pre-sembradas para la puerta. Mezcla de estados para ver el semáforo:
 * - "Los Martínez": 3 px; un QR distribuido (verde), uno ya adentro (rojo si se
 *   re-escanea), otro distribuido (verde).
 * - "Cumple Sofía": 1 px ya adentro + un QR distribuido extra → AMARILLO
 *   (pertenece a la reserva pero sin accesos restantes).
 */
export const DEMO_RESERVAS_SEED: Reserva[] = [
  {
    id: 'res-seed-1',
    eventoId: 'evt-1',
    antroId: 'antro-1',
    corporativoId: 'corp-1',
    clienteId: 'cli-martinez',
    rpId: 'rp-ana',
    modalidad: 'mesa',
    numInvitados: 3,
    mesaTexto: null,
    consumoMinimo: DEMO_CONSUMO_MINIMO_MESA,
    estado: 'confirmada',
    creadaEn: '2026-07-01T10:00:00Z',
    canceladaEn: null,
    qrs: [
      qrSeed('qr-s1a', 'res-seed-1', 'distribuido'),
      qrSeed('qr-s1b', 'res-seed-1', 'usado_puerta'),
      qrSeed('qr-s1c', 'res-seed-1', 'distribuido'),
    ],
  },
  {
    id: 'res-seed-2',
    eventoId: 'evt-1',
    antroId: 'antro-1',
    corporativoId: 'corp-1',
    clienteId: 'cli-sofia',
    rpId: 'rp-luis',
    modalidad: 'acceso',
    numInvitados: 1,
    mesaTexto: null,
    consumoMinimo: null,
    estado: 'confirmada',
    creadaEn: '2026-07-01T11:00:00Z',
    canceladaEn: null,
    qrs: [
      qrSeed('qr-s2a', 'res-seed-2', 'usado_puerta'),
      qrSeed('qr-s2b', 'res-seed-2', 'distribuido'),
    ],
  },
];

/** Contador de penetración en memoria (clicker del cadenero). */
export const DEMO_CONTADOR = { sinReserva: 0 };

// ---------------------------------------------------------------------------
// Sección 3 — datos para inteligencia, red social y motor de fantasmas
// Todo se computa de estos datos REALES (llegadas, no-shows, consumo capturado).
// ---------------------------------------------------------------------------

export interface ClienteDemo {
  id: string;
  nombre: string;
  telefono: string;
  email: string;
}

/** Identidades de clientes (algunos comparten teléfono con otro nombre = fantasma). */
export const DEMO_CLIENTES: ClienteDemo[] = [
  { id: 'cli-carlos', nombre: 'Carlos Ruiz', telefono: '+522221110001', email: 'carlos@mail.com' },
  { id: 'cli-maria', nombre: 'María López', telefono: '+522221110002', email: 'maria@mail.com' },
  { id: 'cli-juan', nombre: 'Juan Pérez', telefono: '+522223330003', email: 'juan@mail.com' },
  { id: 'cli-j', nombre: 'J. Pérez', telefono: '+52 222 333 0003', email: 'jp@mail.com' }, // mismo tel que Juan
  { id: 'cli-inv', nombre: 'Invitado', telefono: '+522224440005', email: 'inv1@mail.com' },
  { id: 'cli-inv2', nombre: 'Invitado', telefono: '+522225550006', email: 'inv2@mail.com' }, // nombre genérico repetido
];

export interface RpDemo {
  id: string;
  nombre: string;
  /** Personas traídas en su historia previa (base para "Volumen histórico"). */
  personasHistoricas: number;
}

export const DEMO_RPS: RpDemo[] = [
  { id: 'rp-ana', nombre: 'Ana Torres', personasHistoricas: 990 },
  { id: 'rp-luis', nombre: 'Luis Mejía', personasHistoricas: 320 },
  { id: 'rp-mile', nombre: 'Mile López', personasHistoricas: 120 },
];

export interface ReservaHist {
  id: string;
  rpId: string;
  clienteId: string;
  fecha: string; // día del evento
  distribuidos: number; // QR distribuidos
  llegaron: number; // QR usados en puerta (verificados)
  consumoReal: number | null; // capturado por el cajero
  consumoMinimo: number | null;
  mesaTexto: string | null;
}

/**
 * Historial de reservas para analítica (semana en curso). No-show de la reserva
 * = QR distribuido que nunca llegó a puerta. El consumo lo capturó el cajero.
 */
export const DEMO_RESERVAS_HIST: ReservaHist[] = [
  // Ana — top performer, sin no-shows
  { id: 'h1', rpId: 'rp-ana', clienteId: 'cli-carlos', fecha: '2026-06-24', distribuidos: 5, llegaron: 5, consumoReal: 80000, consumoMinimo: 5000, mesaTexto: 'VIP 1' },
  { id: 'h2', rpId: 'rp-ana', clienteId: 'cli-maria', fecha: '2026-06-25', distribuidos: 4, llegaron: 4, consumoReal: 260000, consumoMinimo: 8000, mesaTexto: 'Terraza 2' },
  { id: 'h3', rpId: 'rp-ana', clienteId: 'cli-carlos', fecha: '2026-06-26', distribuidos: 6, llegaron: 6, consumoReal: 40000, consumoMinimo: 5000, mesaTexto: 'Booth 4' },
  // Luis — medio, un no-show
  { id: 'h4', rpId: 'rp-luis', clienteId: 'cli-maria', fecha: '2026-06-24', distribuidos: 3, llegaron: 3, consumoReal: 45000, consumoMinimo: 5000, mesaTexto: 'Mesa 7' },
  { id: 'h5', rpId: 'rp-luis', clienteId: 'cli-carlos', fecha: '2026-06-25', distribuidos: 2, llegaron: 2, consumoReal: 30000, consumoMinimo: 5000, mesaTexto: 'Barra 2' },
  { id: 'h6', rpId: 'rp-luis', clienteId: 'cli-juan', fecha: '2026-06-26', distribuidos: 2, llegaron: 0, consumoReal: null, consumoMinimo: 5000, mesaTexto: 'Mesa 9' },
  // Mile — varios no-shows, arrastra un cliente fantasma
  { id: 'h7', rpId: 'rp-mile', clienteId: 'cli-juan', fecha: '2026-06-26', distribuidos: 3, llegaron: 0, consumoReal: null, consumoMinimo: 5000, mesaTexto: null },
  { id: 'h8', rpId: 'rp-mile', clienteId: 'cli-inv', fecha: '2026-06-25', distribuidos: 2, llegaron: 0, consumoReal: null, consumoMinimo: null, mesaTexto: null },
  { id: 'h9', rpId: 'rp-mile', clienteId: 'cli-j', fecha: '2026-06-26', distribuidos: 1, llegaron: 0, consumoReal: null, consumoMinimo: null, mesaTexto: null },
  { id: 'h10', rpId: 'rp-mile', clienteId: 'cli-inv2', fecha: '2026-06-24', distribuidos: 2, llegaron: 2, consumoReal: 15000, consumoMinimo: 5000, mesaTexto: 'Mesa 12' },
];

/** Insignias base (clave → nombre/descr) espejo de la migración. */
export const DEMO_INSIGNIAS = [
  { clave: 'constancia', nombre: 'Constancia', descripcion: '15 reservas completas en una noche' },
  { clave: 'maquina_ventas', nombre: 'Máquina de ventas', descripcion: '250 mil en consumo en una noche' },
  { clave: 'confiabilidad', nombre: 'Confiabilidad', descripcion: 'Show rate ≥ 85% sostenido en el mes' },
  { clave: 'cero_fantasmas', nombre: 'Cero fantasmas', descripcion: 'Un mes sin no-shows' },
  { clave: 'volumen_historico', nombre: 'Volumen histórico', descripcion: '1,000 personas traídas en total' },
];

/** Umbrales (en real viven en config_parametros; aquí se reflejan para demo). */
export const DEMO_PARAMS = {
  hitoConstanciaReservas: 15,
  hitoMaquinaVentas: 250000,
  hitoConfiabilidad: 0.85,
  hitoVolumenHistorico: 1000,
  scoreUmbralFantasma: 60,
  scorePorNoShow: 20,
};
