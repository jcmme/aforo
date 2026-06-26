// Modelo de dominio de AFORO.
// Contempla los cuatro módulos (CLAUDE.md §8); en la Sección 1 solo se usa
// el subconjunto de identidad/tenancy + reservas. El resto queda declarado
// para que la app y la base de datos no se rehagan después.

// ---------------------------------------------------------------------------
// Roles y permisos (CLAUDE.md §4 y §5)
// ---------------------------------------------------------------------------

/** Roles del sistema, de mayor a menor alcance de decisión. */
export type Rol =
  | 'dueno'
  | 'socio'
  | 'gerente_general'
  | 'gerente'
  | 'capitan'
  | 'hostess'
  | 'rp'
  | 'cadenero'
  | 'cajero'
  | 'super_admin'
  | 'cliente';

/** El capitán comparte permisos; el subtipo solo distingue perfil/función. */
export type SubtipoCapitan = 'operativo' | 'social';

/**
 * Acciones sensibles sujetas a la matriz de permisos (denegación por defecto).
 * El identificador es estable porque también vive en la tabla `permisos`.
 */
export type Accion =
  | 'crear_reserva'
  | 'compartir_qr'
  | 'cancelar_reserva_propia'
  | 'escanear_puerta'
  | 'marcar_llego'
  | 'acceso_manual'
  | 'override_amarillo'
  | 'contador_sin_reserva'
  | 'capturar_consumo'
  | 'consultar_consumo_minimo'
  | 'asignar_mover_mesa'
  | 'escanear_mesa'
  | 'hacer_cumplir_minimo'
  | 'acuse_promo'
  | 'ver_desempeno_rps'
  | 'ver_metricas_antro'
  | 'exportar_datos'
  | 'panel_cadena'
  | 'gestionar_personal'
  | 'gestionar_invitaciones'
  | 'cargar_promociones'
  | 'alta_corporativos'
  | 'feature_flags_planes';

// ---------------------------------------------------------------------------
// Identidad y tenancy (CLAUDE.md §2)
// ---------------------------------------------------------------------------

/** Corporativo = tenant. Dueño de antros, personal y métricas, todo aislado. */
export interface Corporativo {
  id: string;
  nombre: string;
  plan: string | null;
  creadoEn: string;
}

/** Antro = venue. Pertenece a un corporativo. */
export interface Antro {
  id: string;
  corporativoId: string;
  nombre: string;
  descripcion: string | null;
  zona: string;
  direccion: string;
  lat: number | null;
  lng: number | null;
  horario: string;
  fotos: string[];
  /** Modalidades de reserva habilitadas en este antro. */
  modalidades: ModalidadReserva[];
  /** Hora límite de cancelación del mismo día, formato "HH:mm". */
  ventanaCancelacion: string;
  /** Comportamiento al alcanzar el cupo. */
  alLlenar: 'cerrar' | 'lista_espera';
}

/** Usuario. Toda cuenta nace como cliente; el personal se suma por invitación. */
export interface Usuario {
  id: string;
  nombre: string;
  username: string;
  email: string;
  telefono: string | null;
  emailVerificado: boolean;
  telefonoVerificado: boolean;
  creadoEn: string;
}

/**
 * Membresía: vincula un usuario con un rol dentro de un corporativo (y opcional
 * antro). Separa la identidad del rol-en-tenant; es la base del aislamiento.
 */
export interface Membresia {
  id: string;
  usuarioId: string;
  corporativoId: string;
  antroId: string | null;
  rol: Rol;
  subtipoCapitan: SubtipoCapitan | null;
  activo: boolean;
}

// ---------------------------------------------------------------------------
// Reservas y QR (CLAUDE.md §6 — Sección 1)
// ---------------------------------------------------------------------------

export type ModalidadReserva = 'acceso' | 'mesa';

export type EstadoReserva =
  | 'confirmada'
  | 'lista_espera'
  | 'cancelada'
  | 'no_show'
  | 'completada';

/** Estado del QR en el modelo distribuido/reclamado. */
export type EstadoQR = 'pendiente' | 'distribuido' | 'usado_puerta';

/** Evento de un antro sobre el que se reserva. */
export interface Evento {
  id: string;
  antroId: string;
  corporativoId: string;
  nombre: string;
  descripcion: string | null;
  fecha: string;
  fotos: string[];
  cupoMaximo: number;
  modalidades: ModalidadReserva[];
  alLlenar: 'cerrar' | 'lista_espera';
  /** Lugares ya confirmados (derivado en servidor). */
  lugaresOcupados?: number;
}

/** QR de un invitado. Identificador persistente y firmado (no boleto). */
export interface QRInvitado {
  id: string;
  reservaId: string;
  /** Token firmado que se renderiza como QR. */
  token: string;
  estado: EstadoQR;
  distribuidoEn: string | null;
  usadoEn: string | null;
}

/** Reserva. Corazón del módulo 1. */
export interface Reserva {
  id: string;
  eventoId: string;
  antroId: string;
  corporativoId: string;
  clienteId: string;
  /** RP dueño de la reserva, si vino por un enlace de RP. */
  rpId: string | null;
  modalidad: ModalidadReserva;
  numInvitados: number;
  /** v1: texto libre; migrará a lista precargada por antro. */
  mesaTexto: string | null;
  /** Snapshot del consumo mínimo al reservar (mesa). */
  consumoMinimo: number | null;
  estado: EstadoReserva;
  creadaEn: string;
  canceladaEn: string | null;
  qrs: QRInvitado[];
}

/** Datos para crear una reserva desde el cliente. */
export interface NuevaReserva {
  eventoId: string;
  modalidad: ModalidadReserva;
  numInvitados: number;
  rpId?: string | null;
}
