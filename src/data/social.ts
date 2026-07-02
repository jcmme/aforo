import {
  DEMO_CAPITANES,
  DEMO_FEED_EVENTOS,
  DEMO_INSIGNIAS,
  DEMO_PARAMS,
  DEMO_RESERVAS_HIST,
  DEMO_RPS,
  type ReservaHist,
} from './mock';
import type { EntradaRanking, FeedComentario, FeedEvento, InsigniaEstado, MetricasRP, Rol } from '@/types';

// Toda métrica se computa de datos REALES ya registrados: QR llegados a puerta
// (verificados), no-shows (QR distribuido sin usar) y consumo capturado por el
// cajero. Nunca se inventa una fuente paralela (CLAUDE.md §6).
//
// Capitanes se miden EXACTAMENTE igual que los RP (mismas métricas, ranking e
// insignias); solo cambian las metas de hitos por rol (más bajas para
// capitán). Comparten el mismo feed (CLAUDE.md §6).

/** Racha (semanas consecutivas en top 3) — en real saldría del histórico. */
const RACHA: Record<string, number> = { 'rp-ana': 3, 'rp-luis': 1, 'rp-mile': 0, 'cap-edgar': 0 };

/** Identidad demo "actual" por rol, para perfil propio y reacciones del feed. */
export const DEMO_IDENTIDAD_POR_ROL: Partial<Record<Rol, string>> = {
  rp: 'rp-ana',
  capitan: 'cap-edgar',
};

function todosLosCreadores() {
  return [
    ...DEMO_RPS.map((r) => ({ ...r, rol: 'rp' as const })),
    ...DEMO_CAPITANES.map((c) => ({ ...c, rol: 'capitan' as const })),
  ];
}

function reservasDe(creadorId: string): ReservaHist[] {
  return DEMO_RESERVAS_HIST.filter((r) => r.rpId === creadorId);
}

/** Métricas de un RP o capitán a partir de sus reservas (mismo cálculo). */
export function metricasRP(creadorId: string): MetricasRP {
  const creador = todosLosCreadores().find((c) => c.id === creadorId);
  const rs = reservasDe(creadorId);
  const completas = rs.filter((r) => r.llegaron > 0).length;
  const noShows = rs.filter((r) => r.distribuidos > 0 && r.llegaron === 0).length;
  const distribuidos = rs.reduce((s, r) => s + r.distribuidos, 0);
  const llegaron = rs.reduce((s, r) => s + r.llegaron, 0);
  const consumoSemana = rs.reduce((s, r) => s + (r.consumoReal ?? 0), 0);
  return {
    rpId: creadorId,
    nombre: creador?.nombre ?? 'Staff',
    creadas: rs.length,
    completas,
    noShows,
    showRate: distribuidos > 0 ? llegaron / distribuidos : 1,
    personas: (creador?.personasHistoricas ?? 0) + llegaron,
    consumoSemana,
  };
}

/** Ranking semanal por consumo de mesas (se reinicia cada semana). RP + capitán. */
export function listarRanking(): EntradaRanking[] {
  return todosLosCreadores()
    .map((c) => ({
      rpId: c.id,
      nombre: c.nombre,
      consumo: metricasRP(c.id).consumoSemana,
      racha: RACHA[c.id] ?? 0,
      posicion: 0,
    }))
    .sort((a, b) => b.consumo - a.consumo)
    .map((e, i) => ({ ...e, posicion: i + 1 }));
}

/**
 * Evalúa las insignias permanentes contra datos reales. Las metas de hitos
 * están diferenciadas por rol: al RP se le exige volumen alto, al capitán
 * mucho menos (CLAUDE.md §6) — cifras editables desde Súper Admin.
 */
export function insigniasDeRP(creadorId: string, rol: 'rp' | 'capitan' = 'rp'): InsigniaEstado[] {
  const rs = reservasDe(creadorId);
  const m = metricasRP(creadorId);

  const porNoche = new Map<string, { completas: number; consumo: number }>();
  for (const r of rs) {
    const n = porNoche.get(r.fecha) ?? { completas: 0, consumo: 0 };
    if (r.llegaron > 0) n.completas += 1;
    n.consumo += r.consumoReal ?? 0;
    porNoche.set(r.fecha, n);
  }
  const maxCompletasNoche = Math.max(0, ...[...porNoche.values()].map((n) => n.completas));
  const maxConsumoNoche = Math.max(0, ...[...porNoche.values()].map((n) => n.consumo));

  const metaConstancia = rol === 'capitan' ? DEMO_PARAMS.hitoConstanciaReservasCapitan : DEMO_PARAMS.hitoConstanciaReservas;
  const metaVentas = rol === 'capitan' ? DEMO_PARAMS.hitoMaquinaVentasCapitan : DEMO_PARAMS.hitoMaquinaVentas;
  const metaVolumen = rol === 'capitan' ? DEMO_PARAMS.hitoVolumenHistoricoCapitan : DEMO_PARAMS.hitoVolumenHistorico;

  const cumple: Record<string, boolean> = {
    constancia: maxCompletasNoche >= metaConstancia,
    maquina_ventas: maxConsumoNoche >= metaVentas,
    confiabilidad: m.showRate >= DEMO_PARAMS.hitoConfiabilidad,
    cero_fantasmas: m.noShows === 0,
    volumen_historico: m.personas >= metaVolumen,
  };

  return DEMO_INSIGNIAS.map((i) => ({
    clave: i.clave,
    nombre: i.nombre,
    descripcion: i.descripcion,
    desbloqueada: Boolean(cumple[i.clave]),
  }));
}

/** Lista de RPs + capitanes con sus métricas ("desempeño de RPs"). */
export function desempenoRPs(): MetricasRP[] {
  return todosLosCreadores()
    .map((c) => metricasRP(c.id))
    .sort((a, b) => b.consumoSemana - a.consumoSemana);
}

// ---------------------------------------------------------------------------
// Feed social persistido: comentarios + reacciones (formato tipo X — solo
// estética; sin funciones sociales nuevas como "seguir").
// ---------------------------------------------------------------------------

function aFeedEvento(mi: string | null) {
  return (e: (typeof DEMO_FEED_EVENTOS)[number]): FeedEvento => ({
    id: e.id,
    tipo: e.tipo,
    autorId: e.autorId,
    autorNombre: e.autorNombre,
    texto: e.texto,
    creadoEn: e.creadoEn,
    reacciones: e.reaccionesDe.length,
    reaccionadoPorMi: mi != null && e.reaccionesDe.includes(mi),
    comentarios: e.comentarios.map(
      (c): FeedComentario => ({ id: c.id, autorNombre: c.autorNombre, texto: c.texto, creadoEn: c.creadoEn }),
    ),
  });
}

/** Feed de logros: medallas y posiciones, NUNCA montos crudos. */
export function construirFeed(miId: string | null = null): FeedEvento[] {
  return [...DEMO_FEED_EVENTOS]
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))
    .map(aFeedEvento(miId));
}

/** Una publicación del feed por id (para la pantalla de detalle/comentarios). */
export function obtenerFeedEvento(id: string, miId: string | null = null): FeedEvento | null {
  const e = DEMO_FEED_EVENTOS.find((x) => x.id === id);
  return e ? aFeedEvento(miId)(e) : null;
}

/** Toggle de reacción (una por persona, sin escribir nada). */
export function reaccionar(feedEventoId: string, miId: string): void {
  const e = DEMO_FEED_EVENTOS.find((x) => x.id === feedEventoId);
  if (!e) return;
  const i = e.reaccionesDe.indexOf(miId);
  if (i >= 0) e.reaccionesDe.splice(i, 1);
  else e.reaccionesDe.push(miId);
}

/** Comentario de texto simple en una publicación del feed. */
export function comentar(feedEventoId: string, autorNombre: string, texto: string): void {
  const e = DEMO_FEED_EVENTOS.find((x) => x.id === feedEventoId);
  if (!e || !texto.trim()) return;
  e.comentarios.push({
    id: `c-${Date.now()}`,
    autorNombre,
    texto: texto.trim(),
    creadoEn: new Date().toISOString(),
  });
}
