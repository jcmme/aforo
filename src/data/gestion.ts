import {
  DEMO_ANTROS,
  DEMO_INCIDENCIAS,
  DEMO_METRICAS_ANTRO,
  DEMO_PROMOCIONES,
  DEMO_RESERVAS_HIST,
} from './mock';
import { desempenoRPs } from './social';
import { listarFantasmas } from './fantasmas';
import type { IncidenciaItem, MetricasAntro, ReporteDef } from '@/types';

// Los paneles LEEN y CONSOLIDAN datos ya registrados (bitácora, consumo,
// alertas, contador del cadenero). No se inventa ninguna métrica.

function nombreAntro(antroId: string): string {
  return DEMO_ANTROS.find((a) => a.id === antroId)?.nombre ?? antroId;
}

/** Métricas de un antro. */
export function metricasAntro(antroId: string): MetricasAntro {
  const s = DEMO_METRICAS_ANTRO.find((m) => m.antroId === antroId);
  if (!s) {
    return { antroId, nombre: nombreAntro(antroId), reservas: 0, llegadas: 0, noShows: 0, canceladas: 0, ocupacionPct: 0, diaMayorAfluencia: null, porRP: [], conReserva: 0, sinReserva: 0, adopcionPct: 0 };
  }
  const total = s.conReserva + s.sinReserva;
  return {
    antroId,
    nombre: nombreAntro(antroId),
    reservas: s.reservas,
    llegadas: s.llegadas,
    noShows: s.noShows,
    canceladas: s.canceladas,
    ocupacionPct: s.cupo > 0 ? Math.round((s.llegadas / s.cupo) * 100) : 0,
    diaMayorAfluencia: s.diaMayorAfluencia,
    // El desglose por RP solo se tiene para el antro con datos granulares (demo).
    porRP: antroId === 'antro-1' ? desempenoRPs().map((r) => ({ nombre: r.nombre, reservas: r.creadas, completas: r.completas })) : [],
    conReserva: s.conReserva,
    sinReserva: s.sinReserva,
    adopcionPct: total > 0 ? Math.round((s.conReserva / total) * 100) : 0,
  };
}

/** Consolidado de todos los antros de un corporativo (gerente general). */
export function metricasConsolidadas(corporativoId: string): MetricasAntro {
  const antros = DEMO_METRICAS_ANTRO.filter((m) => m.corporativoId === corporativoId);
  const sum = (f: (m: (typeof antros)[number]) => number) => antros.reduce((s, m) => s + f(m), 0);
  const conReserva = sum((m) => m.conReserva);
  const sinReserva = sum((m) => m.sinReserva);
  const total = conReserva + sinReserva;
  const llegadas = sum((m) => m.llegadas);
  const cupo = sum((m) => m.cupo);
  return {
    antroId: 'consolidado',
    nombre: `Consolidado (${antros.length} antros)`,
    reservas: sum((m) => m.reservas),
    llegadas,
    noShows: sum((m) => m.noShows),
    canceladas: sum((m) => m.canceladas),
    ocupacionPct: cupo > 0 ? Math.round((llegadas / cupo) * 100) : 0,
    diaMayorAfluencia: null,
    porRP: [],
    conReserva,
    sinReserva,
    adopcionPct: total > 0 ? Math.round((conReserva / total) * 100) : 0,
  };
}

/** Antros de un corporativo (para elegir en el panel del gerente). */
export function antrosDeCorporativo(corporativoId: string) {
  return DEMO_ANTROS.filter((a) => a.corporativoId === corporativoId);
}

/** Panel Cadena: anomalías del corporativo (opcional por antro). */
export function listarIncidencias(corporativoId: string, antroId?: string): IncidenciaItem[] {
  return DEMO_INCIDENCIAS.filter((i) => i.corporativoId === corporativoId && (!antroId || i.antroId === antroId)).map((i) => ({
    id: i.id,
    tipo: i.tipo,
    resumen: i.resumen,
    responsable: i.responsable,
    antro: nombreAntro(i.antroId),
    cuando: i.cuando,
  }));
}

// ---------------------------------------------------------------------------
// DATOS EXTRAÍBLES — catálogo de 7 reportes (ampliable)
// ---------------------------------------------------------------------------

export const REPORTES: ReporteDef[] = [
  { clave: 'reservas', titulo: 'Reservas del periodo', descripcion: 'Folio, fecha, creador, px, QRs, llegadas, estado, mesa, consumo' },
  { clave: 'personal', titulo: 'Desempeño de personal', descripcion: 'Creadas, completas, show rate, personas, consumo' },
  { clave: 'afluencia', titulo: 'Afluencia y penetración', descripcion: 'Con reserva vs contador, % de adopción, picos' },
  { clave: 'consumo', titulo: 'Consumo', descripcion: 'Por mesa y RP, ticket promedio, ranking' },
  { clave: 'fantasmas', titulo: 'Reservas fantasma', descripcion: 'Clientes con alerta, no-shows, score, acción' },
  { clave: 'incidencias', titulo: 'Incidencias', descripcion: 'Desglose por motivo, responsable y hora' },
  { clave: 'promociones', titulo: 'Promociones', descripcion: 'Acuses de entrega por evento' },
];

export interface Reporte {
  columnas: string[];
  filas: string[][];
  csv: string;
}

function aCSV(columnas: string[], filas: string[][]): string {
  const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return [columnas, ...filas].map((f) => f.map(esc).join(',')).join('\n');
}

/** Genera un reporte a partir de los datos reales ya registrados. */
export function generarReporte(clave: string): Reporte {
  let columnas: string[] = [];
  let filas: string[][] = [];

  if (clave === 'reservas') {
    columnas = ['Folio', 'Fecha', 'RP', 'px', 'Distribuidos', 'Llegaron', 'Mesa', 'Consumo'];
    filas = DEMO_RESERVAS_HIST.map((r) => [r.id, r.fecha, r.rpId, String(r.distribuidos), String(r.distribuidos), String(r.llegaron), r.mesaTexto ?? '—', r.consumoReal != null ? String(r.consumoReal) : '—']);
  } else if (clave === 'personal') {
    columnas = ['Persona', 'Creadas', 'Completas', 'Show rate', 'Personas', 'Consumo'];
    filas = desempenoRPs().map((r) => [r.nombre, String(r.creadas), String(r.completas), `${Math.round(r.showRate * 100)}%`, String(r.personas), String(r.consumoSemana)]);
  } else if (clave === 'afluencia') {
    columnas = ['Antro', 'Con reserva', 'Sin reserva', 'Adopción', 'Día pico'];
    filas = DEMO_METRICAS_ANTRO.map((m) => [nombreAntro(m.antroId), String(m.conReserva), String(m.sinReserva), `${Math.round((m.conReserva / (m.conReserva + m.sinReserva)) * 100)}%`, m.diaMayorAfluencia]);
  } else if (clave === 'consumo') {
    columnas = ['Folio', 'RP', 'Mesa', 'Mínimo', 'Real'];
    filas = DEMO_RESERVAS_HIST.filter((r) => r.consumoMinimo != null).map((r) => [r.id, r.rpId, r.mesaTexto ?? '—', String(r.consumoMinimo), r.consumoReal != null ? String(r.consumoReal) : 'pendiente']);
  } else if (clave === 'fantasmas') {
    columnas = ['Cliente', 'Teléfono', 'No-shows', 'Score', 'Acción'];
    filas = listarFantasmas().map((c) => [c.nombres.join(' / '), c.telefono, String(c.noShows), String(c.score), c.accion]);
  } else if (clave === 'incidencias') {
    columnas = ['Tipo', 'Resumen', 'Responsable', 'Cuándo'];
    filas = DEMO_INCIDENCIAS.map((i) => [i.tipo, i.resumen, i.responsable, i.cuando]);
  } else if (clave === 'promociones') {
    columnas = ['Promo', 'Antro', 'Pagada', 'Monto'];
    filas = DEMO_PROMOCIONES.map((p) => [p.nombre, nombreAntro(p.antroId), p.pagada ? 'Sí' : 'No', p.monto != null ? String(p.monto) : '—']);
  }

  return { columnas, filas, csv: aCSV(columnas, filas) };
}
