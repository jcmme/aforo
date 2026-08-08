import type { Antro, Corporativo, Evento, QRInvitado, Reserva, Usuario } from '@/types';
import { AVISO_PRIVACIDAD_TEXTO, TERMINOS_USO_TEXTO } from './legalTextos';

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
  'cap-edgar': 'Edgar Nava',
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
    invitadoNombre: null,
    invitadoTelefono: null,
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
    invitadoNombre: null,
    invitadoTelefono: null,
  },
  // Walk-in metido por el capitán Edgar (sin cuenta en la app): solo nombre +
  // teléfono. Su único QR queda "pendiente" para poder probar el link de
  // reclamo (que debe mostrar el QR real, no solo confirmar).
  {
    id: 'res-seed-3',
    eventoId: 'evt-1',
    antroId: 'antro-1',
    corporativoId: 'corp-1',
    clienteId: null,
    rpId: 'cap-edgar',
    modalidad: 'acceso',
    numInvitados: 1,
    mesaTexto: null,
    consumoMinimo: null,
    estado: 'confirmada',
    creadaEn: '2026-07-03T21:00:00Z',
    canceladaEn: null,
    qrs: [qrSeed('qr-s3a', 'res-seed-3', 'pendiente')],
    invitadoNombre: 'Verónica Escobar',
    invitadoTelefono: '+522213955697',
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

/**
 * Capitanes: se miden EXACTAMENTE igual que los RP (mismas métricas, ranking
 * e insignias), pero con metas diferenciadas por rol (ver
 * `hito_*_capitan` en DEMO_PARAMS) — CLAUDE.md: "al capitán se le exige mucho
 * menos [volumen] que al RP".
 */
export const DEMO_CAPITANES: RpDemo[] = [
  { id: 'cap-edgar', nombre: 'Edgar Nava', personasHistoricas: 140 },
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
  // Edgar (capitán) — también mete reservas de mesa; mismas métricas que un RP.
  { id: 'h11', rpId: 'cap-edgar', clienteId: 'cli-maria', fecha: '2026-06-25', distribuidos: 2, llegaron: 2, consumoReal: 22000, consumoMinimo: 5000, mesaTexto: 'Mesa 3' },
  { id: 'h12', rpId: 'cap-edgar', clienteId: 'cli-carlos', fecha: '2026-06-26', distribuidos: 3, llegaron: 3, consumoReal: 18000, consumoMinimo: 5000, mesaTexto: 'Mesa 5' },
];

/** Insignias base (clave → nombre/descr) espejo de la migración. */
export const DEMO_INSIGNIAS = [
  { clave: 'constancia', nombre: 'Constancia', descripcion: '15 reservas completas en una noche' },
  { clave: 'maquina_ventas', nombre: 'Máquina de ventas', descripcion: '250 mil en consumo en una noche' },
  { clave: 'confiabilidad', nombre: 'Confiabilidad', descripcion: 'Show rate ≥ 85% sostenido en el mes' },
  { clave: 'cero_fantasmas', nombre: 'Cero fantasmas', descripcion: 'Un mes sin no-shows' },
  { clave: 'volumen_historico', nombre: 'Volumen histórico', descripcion: '1,000 personas traídas en total' },
];

/**
 * Umbrales (en real viven en config_parametros; aquí se reflejan para demo).
 * Metas de hitos diferenciadas por rol: al RP se le exige volumen alto, al
 * capitán mucho menos (CLAUDE.md §6). Editable desde Súper Admin → Parámetros.
 */
export const DEMO_PARAMS = {
  hitoConstanciaReservas: 15,
  hitoConstanciaReservasCapitan: 6,
  hitoMaquinaVentas: 250000,
  hitoMaquinaVentasCapitan: 100000,
  hitoConfiabilidad: 0.85,
  hitoVolumenHistorico: 1000,
  hitoVolumenHistoricoCapitan: 400,
  scoreUmbralFantasma: 60,
  scorePorNoShow: 20,
};

// ---------------------------------------------------------------------------
// Sección 4 — datos para los paneles de gestión (gerente y Súper Admin).
// Todo consolida datos ya registrados (bitácora, consumo, alertas, contador).
// ---------------------------------------------------------------------------

export interface MetricasAntroSeed {
  antroId: string;
  corporativoId: string;
  reservas: number;
  llegadas: number;
  noShows: number;
  canceladas: number;
  conReserva: number; // entradas con QR
  sinReserva: number; // contador del cadenero
  cupo: number;
  diaMayorAfluencia: string;
}

/** Agregados por antro (lo que la bitácora consolida). antro-1 alineado al hist. */
export const DEMO_METRICAS_ANTRO: MetricasAntroSeed[] = [
  { antroId: 'antro-1', corporativoId: 'corp-1', reservas: 10, llegadas: 22, noShows: 4, canceladas: 2, conReserva: 22, sinReserva: 140, cupo: 300, diaMayorAfluencia: 'Sábado' },
  { antroId: 'antro-2', corporativoId: 'corp-1', reservas: 8, llegadas: 30, noShows: 2, canceladas: 1, conReserva: 30, sinReserva: 90, cupo: 150, diaMayorAfluencia: 'Viernes' },
  { antroId: 'antro-3', corporativoId: 'corp-2', reservas: 15, llegadas: 60, noShows: 5, canceladas: 3, conReserva: 60, sinReserva: 200, cupo: 400, diaMayorAfluencia: 'Sábado' },
];

export interface IncidenciaSeed {
  id: string;
  antroId: string;
  corporativoId: string;
  tipo: string;
  resumen: string;
  responsable: string;
  cuando: string;
}

/** Panel Cadena: anomalías registradas en la bitácora. */
export const DEMO_INCIDENCIAS: IncidenciaSeed[] = [
  { id: 'inc-1', antroId: 'antro-1', corporativoId: 'corp-1', tipo: 'override_amarillo', resumen: 'Override de amarillo — reserva Los Martínez', responsable: 'Hostess Vale', cuando: '2026-06-26T23:40:00Z' },
  { id: 'inc-2', antroId: 'antro-1', corporativoId: 'corp-1', tipo: 'acceso_manual_otro', resumen: 'Acceso manual "Otro": invitado de la casa', responsable: 'Cadenero Beto', cuando: '2026-06-26T23:05:00Z' },
  { id: 'inc-3', antroId: 'antro-1', corporativoId: 'corp-1', tipo: 'alerta_fantasma', resumen: 'Alerta de fantasma — Juan/J. Pérez (score 40)', responsable: 'Sistema', cuando: '2026-06-27T03:00:00Z' },
  { id: 'inc-4', antroId: 'antro-2', corporativoId: 'corp-1', tipo: 'consumo_minimo_no_cumplido', resumen: 'Mesa no cumplió consumo mínimo: se invitó a retirarse', responsable: 'Capitán Edgar', cuando: '2026-06-26T01:20:00Z' },
];

export interface AuditoriaSeed {
  id: string;
  accion: string;
  entidad: string | null;
  actor: string;
  corporativoId: string;
  cuando: string;
}

/** Bitácora global (Súper Admin). */
export const DEMO_AUDITORIA: AuditoriaSeed[] = [
  { id: 'a1', accion: 'crear_reserva', entidad: 'reservas', actor: 'Ana Torres', corporativoId: 'corp-1', cuando: '2026-06-26T22:10:00Z' },
  { id: 'a2', accion: 'capturar_consumo', entidad: 'reservas', actor: 'Cajero Sol', corporativoId: 'corp-1', cuando: '2026-06-27T02:30:00Z' },
  { id: 'a3', accion: 'override_amarillo', entidad: 'accesos_puerta', actor: 'Hostess Vale', corporativoId: 'corp-1', cuando: '2026-06-26T23:40:00Z' },
  { id: 'a4', accion: 'generar_invitacion', entidad: 'invitaciones', actor: 'Gerente Hugo', corporativoId: 'corp-2', cuando: '2026-06-25T18:00:00Z' },
];

/** Promociones (exclusivas del Súper Admin). */
export interface PromocionSeed {
  id: string;
  nombre: string;
  antroId: string;
  foto: string | null;
  inicio: string | null;
  fin: string | null;
  pausada: boolean;
  pagada: boolean;
  monto: number | null;
}
export const DEMO_PROMOCIONES: PromocionSeed[] = [
  { id: 'promo-1', nombre: 'Botella de cortesía al llegar', antroId: 'antro-1', foto: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800', inicio: '2026-06-01', fin: '2026-07-31', pausada: false, pagada: true, monto: 12000 },
  { id: 'promo-2', nombre: '2x1 en barra hasta la 1 AM', antroId: 'antro-3', foto: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=800', inicio: '2026-06-15', fin: null, pausada: false, pagada: false, monto: null },
  { id: 'promo-3', nombre: 'Mesa VIP sin consumo mínimo los miércoles', antroId: 'antro-2', foto: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=800', inicio: '2026-06-01', fin: null, pausada: false, pagada: false, monto: null },
  { id: 'promo-4', nombre: 'Welcome shot de la casa al reservar', antroId: 'antro-1', foto: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=800', inicio: '2026-06-01', fin: null, pausada: false, pagada: false, monto: null },
  { id: 'promo-5', nombre: 'Acceso preferente antes de medianoche', antroId: 'antro-3', foto: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800', inicio: '2026-06-01', fin: null, pausada: false, pagada: false, monto: null },
];

/**
 * Fotos por antro (las suben los antros, las aprueba el Súper Admin). Varias
 * aprobadas por antro para la galería con swipe + una pendiente para probar la
 * cola de moderación. Formato estándar 3:2 horizontal (ver antros.ts).
 */
export interface FotoAntroSeed {
  id: string;
  antroId: string;
  url: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada';
  orden: number;
}
export const DEMO_FOTOS_ANTRO: FotoAntroSeed[] = [
  // Lumen (antro-1): 4 aprobadas.
  { id: 'f-1a', antroId: 'antro-1', url: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=1200', estado: 'aprobada', orden: 0 },
  { id: 'f-1b', antroId: 'antro-1', url: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200', estado: 'aprobada', orden: 1 },
  { id: 'f-1c', antroId: 'antro-1', url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=1200', estado: 'aprobada', orden: 2 },
  { id: 'f-1d', antroId: 'antro-1', url: 'https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1200', estado: 'aprobada', orden: 3 },
  // Terraza Cholula (antro-2): 3 aprobadas.
  { id: 'f-2a', antroId: 'antro-2', url: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1200', estado: 'aprobada', orden: 0 },
  { id: 'f-2b', antroId: 'antro-2', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=1200', estado: 'aprobada', orden: 1 },
  { id: 'f-2c', antroId: 'antro-2', url: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200', estado: 'aprobada', orden: 2 },
  // Distrito 23 (antro-3): 3 aprobadas.
  { id: 'f-3a', antroId: 'antro-3', url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1200', estado: 'aprobada', orden: 0 },
  { id: 'f-3b', antroId: 'antro-3', url: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=1200', estado: 'aprobada', orden: 1 },
  { id: 'f-3c', antroId: 'antro-3', url: 'https://images.unsplash.com/photo-1536935338788-846bb9981813?w=1200', estado: 'aprobada', orden: 2 },
  // Pendientes de aprobación (cola del Súper Admin).
  { id: 'f-1e', antroId: 'antro-1', url: 'https://images.unsplash.com/photo-1493676304819-0d7a8d026dcf?w=1200', estado: 'pendiente', orden: 4 },
  { id: 'f-2d', antroId: 'antro-2', url: 'https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=1200', estado: 'pendiente', orden: 3 },
];

export const DEMO_PLANES = ['Básico', 'Pro', 'Premium'];

/** Feature flags por corporativo (editable por Súper Admin). */
export const DEMO_FEATURE_FLAGS: Record<string, { clave: string; habilitado: boolean }[]> = {
  'corp-1': [
    { clave: 'modulo_operacion', habilitado: true },
    { clave: 'modulo_inteligencia', habilitado: true },
    { clave: 'modulo_gestion', habilitado: true },
  ],
  'corp-2': [
    { clave: 'modulo_operacion', habilitado: true },
    { clave: 'modulo_inteligencia', habilitado: false },
    { clave: 'modulo_gestion', habilitado: true },
  ],
};

/** Estado activo/suspendido por corporativo (impago). */
export const DEMO_CORP_ESTADO: Record<string, { activo: boolean; plan: string }> = {
  'corp-1': { activo: true, plan: 'Pro' },
  'corp-2': { activo: true, plan: 'Básico' },
};

/** Interruptores de notificaciones configurables (apagados por defecto). */
export const DEMO_NOTIF_SWITCHES = {
  posible_fantasma: false,
  cupo_alcanzado: false,
};

/**
 * Parámetros editables sin código (panel de Súper Admin). Espejo en memoria de
 * config_parametros; al editarlos aquí cambia el comportamiento (demo).
 */
export const DEMO_CONFIG_EDITABLE: { clave: string; valor: string; descripcion: string }[] = [
  { clave: 'motivos_acceso_manual', valor: '6 motivos', descripcion: 'Motivos de acceso manual en puerta' },
  { clave: 'score_umbral_fantasma', valor: '60', descripcion: 'Umbral del score para marcar fantasma' },
  { clave: 'ranking_periodo', valor: 'semanal', descripcion: 'Periodo del ranking de consumo' },
  { clave: 'invitacion_caducidad_horas', valor: '72', descripcion: 'Caducidad de invitaciones (horas)' },
  { clave: 'invitacion_intentos_max', valor: '3', descripcion: 'Intentos de código antes de bloquear' },
  { clave: 'cupo_maximo_default', valor: '300', descripcion: 'Cupo máximo por evento (por defecto)' },
  { clave: 'al_llenar', valor: 'lista_espera', descripcion: 'Al llenarse: cerrar o lista de espera' },
  { clave: 'ventana_cancelacion_default', valor: '18:00', descripcion: 'Hora límite de cancelación' },
  { clave: 'consumo_minimo_mesa_default', valor: '5000', descripcion: 'Consumo mínimo por mesa (MXN)' },
  { clave: 'consumo_minimo_masivo', valor: 'false', descripcion: 'Flexibilizar mínimo en eventos masivos' },
  { clave: 'hito_constancia_reservas', valor: '15', descripcion: 'Insignia Constancia — RP (reservas/noche)' },
  { clave: 'hito_constancia_reservas_capitan', valor: '6', descripcion: 'Insignia Constancia — Capitán (reservas/noche)' },
  { clave: 'hito_maquina_ventas', valor: '250000', descripcion: 'Insignia Máquina de ventas — RP (MXN/noche)' },
  { clave: 'hito_maquina_ventas_capitan', valor: '100000', descripcion: 'Insignia Máquina de ventas — Capitán (MXN/noche)' },
  { clave: 'tyc_corte_semanal', valor: 'martes 12:00', descripcion: 'Corte semanal para que un cambio de T&C aplique esa semana' },
  { clave: 'aviso_privacidad_url', valor: 'https://jcmme.github.io/aforo/aviso-privacidad.html', descripcion: 'URL pública del aviso de privacidad (sustituir por la del dominio propio)' },
  { clave: 'aviso_privacidad_texto', valor: AVISO_PRIVACIDAD_TEXTO, descripcion: 'Texto completo del aviso de privacidad, mostrado dentro de la app' },
  { clave: 'terminos_uso_texto', valor: TERMINOS_USO_TEXTO, descripcion: 'Texto completo de los Términos y Condiciones de Uso, mostrado dentro de la app' },
];

/** Invitaciones generadas en la sesión (en memoria). */
export interface InvitacionSeed {
  id: string;
  codigo: string;
  rol: string;
  antroId: string | null;
  corporativoId: string;
  usosMax: number;
  usos: number;
  caducaEn: string;
  revocada: boolean;
  creadaEn: string;
}
export const DEMO_INVITACIONES: InvitacionSeed[] = [];

// ---------------------------------------------------------------------------
// Ronda 5 — reservas de invitados sin cuenta, reseñas, T&C y feed social
// ---------------------------------------------------------------------------

/** Reseñas de clientes hacia un antro (estrellas + foto; comentario sin UI aún). */
export interface ResenaSeed {
  id: string;
  antroId: string;
  clienteNombre: string;
  estrellas: number;
  fotoUrl: string | null;
  comentario: string | null;
  creadoEn: string;
}
export const DEMO_RESENAS: ResenaSeed[] = [
  { id: 'res-1', antroId: 'antro-1', clienteNombre: 'Carlos Ruiz', estrellas: 5, fotoUrl: 'https://images.unsplash.com/photo-1566417713940-fe7c737a9ef2?w=800', comentario: null, creadoEn: '2026-06-25T05:00:00Z' },
  { id: 'res-2', antroId: 'antro-1', clienteNombre: 'María López', estrellas: 4, fotoUrl: null, comentario: null, creadoEn: '2026-06-26T05:00:00Z' },
  { id: 'res-3', antroId: 'antro-3', clienteNombre: 'Invitado', estrellas: 5, fotoUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=800', comentario: null, creadoEn: '2026-06-27T05:00:00Z' },
];

/** T&C por antro, con workflow de aprobación del Súper Admin. */
export interface TycAntroSeed {
  antroId: string;
  textoVigente: string;
  textoPendiente: string | null;
  estado: 'sin_cambios' | 'esperando_aprobacion';
  responsableId: string | null;
  responsableNombre: string | null;
  propuestoEn: string | null;
  aprobadoEn: string | null;
  aplicaDesde: string | null;
}
export const DEMO_TYC_GENERAL =
  'Uso de AFORO sujeto a mayoría de edad y a las políticas de privacidad de la plataforma.';
export const DEMO_TYC_CORPORATIVO: Record<string, string> = {
  'corp-1': 'Grupo Nocturno Puebla: acceso sujeto a disponibilidad y políticas del grupo.',
  'corp-2': 'Distrito Angelópolis: acceso sujeto a disponibilidad y políticas del grupo.',
};
export const DEMO_TYC_ANTRO: Record<string, TycAntroSeed> = {
  'antro-1': {
    antroId: 'antro-1',
    textoVigente: 'Lumen: cover no reembolsable. Acceso solo con identificación vigente.',
    textoPendiente: null,
    estado: 'sin_cambios',
    responsableId: 'cap-edgar',
    responsableNombre: 'Edgar Nava',
    propuestoEn: null,
    aprobadoEn: null,
    aplicaDesde: null,
  },
  'antro-2': {
    antroId: 'antro-2',
    textoVigente: 'Terraza Cholula: evento al aire libre, sujeto a condiciones climáticas.',
    textoPendiente: null,
    estado: 'sin_cambios',
    responsableId: null,
    responsableNombre: null,
    propuestoEn: null,
    aprobadoEn: null,
    aplicaDesde: null,
  },
  'antro-3': {
    antroId: 'antro-3',
    textoVigente: 'Distrito 23: código de vestimenta estricto. Reservado el derecho de admisión.',
    textoPendiente: null,
    estado: 'sin_cambios',
    responsableId: null,
    responsableNombre: null,
    propuestoEn: null,
    aprobadoEn: null,
    aplicaDesde: null,
  },
};

/** Feed persistido (comentarios/reacciones necesitan un id estable, no calculado al vuelo). */
export interface FeedComentarioSeed {
  id: string;
  autorNombre: string;
  texto: string;
  creadoEn: string;
}
export interface FeedEventoSeed {
  id: string;
  tipo: 'insignia' | 'ranking' | 'racha';
  autorId: string;
  autorNombre: string;
  texto: string;
  creadoEn: string;
  reaccionesDe: string[]; // ids de usuario demo que reaccionaron
  comentarios: FeedComentarioSeed[];
}
export const DEMO_FEED_EVENTOS: FeedEventoSeed[] = [
  {
    id: 'feed-1',
    tipo: 'racha',
    autorId: 'rp-ana',
    autorNombre: 'Ana Torres',
    texto: 'entró al top 3 del ranking semanal — medalla de oro (racha de 3 semanas)',
    creadoEn: '2026-06-27T04:00:00Z',
    reaccionesDe: ['rp-luis', 'cap-edgar'],
    comentarios: [
      { id: 'c1', autorNombre: 'Luis Mejía', texto: '¡Vamos Ana!', creadoEn: '2026-06-27T04:10:00Z' },
    ],
  },
  {
    id: 'feed-2',
    tipo: 'ranking',
    autorId: 'rp-luis',
    autorNombre: 'Luis Mejía',
    texto: 'entró al top 3 del ranking semanal — medalla de plata',
    creadoEn: '2026-06-27T04:05:00Z',
    reaccionesDe: [],
    comentarios: [],
  },
  {
    id: 'feed-3',
    tipo: 'insignia',
    autorId: 'rp-ana',
    autorNombre: 'Ana Torres',
    texto: 'desbloqueó la insignia "Volumen histórico"',
    creadoEn: '2026-06-26T22:00:00Z',
    reaccionesDe: ['rp-mile'],
    comentarios: [],
  },
];
