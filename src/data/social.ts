import {
  DEMO_INSIGNIAS,
  DEMO_PARAMS,
  DEMO_RESERVAS_HIST,
  DEMO_RPS,
  type ReservaHist,
} from './mock';
import type { EntradaRanking, FeedItem, InsigniaEstado, MetricasRP } from '@/types';

// Toda métrica se computa de datos REALES ya registrados: QR llegados a puerta
// (verificados), no-shows (QR distribuido sin usar) y consumo capturado por el
// cajero. Nunca se inventa una fuente paralela (CLAUDE.md §6).

/** Racha (semanas consecutivas en top 3) — en real saldría del histórico. */
const RACHA: Record<string, number> = { 'rp-ana': 3, 'rp-luis': 1, 'rp-mile': 0 };

function reservasDe(rpId: string): ReservaHist[] {
  return DEMO_RESERVAS_HIST.filter((r) => r.rpId === rpId);
}

/** Métricas de un RP a partir de sus reservas. */
export function metricasRP(rpId: string): MetricasRP {
  const rp = DEMO_RPS.find((r) => r.id === rpId);
  const rs = reservasDe(rpId);
  const completas = rs.filter((r) => r.llegaron > 0).length;
  const noShows = rs.filter((r) => r.distribuidos > 0 && r.llegaron === 0).length;
  const distribuidos = rs.reduce((s, r) => s + r.distribuidos, 0);
  const llegaron = rs.reduce((s, r) => s + r.llegaron, 0);
  const consumoSemana = rs.reduce((s, r) => s + (r.consumoReal ?? 0), 0);
  return {
    rpId,
    nombre: rp?.nombre ?? 'RP',
    creadas: rs.length,
    completas,
    noShows,
    showRate: distribuidos > 0 ? llegaron / distribuidos : 1,
    personas: (rp?.personasHistoricas ?? 0) + llegaron,
    consumoSemana,
  };
}

/** Ranking semanal de RPs por consumo de sus mesas (se reinicia cada semana). */
export function listarRanking(): EntradaRanking[] {
  return DEMO_RPS.map((rp) => ({
    rpId: rp.id,
    nombre: rp.nombre,
    consumo: metricasRP(rp.id).consumoSemana,
    racha: RACHA[rp.id] ?? 0,
    posicion: 0,
  }))
    .sort((a, b) => b.consumo - a.consumo)
    .map((e, i) => ({ ...e, posicion: i + 1 }));
}

/** Evalúa las insignias permanentes de un RP contra los datos reales. */
export function insigniasDeRP(rpId: string): InsigniaEstado[] {
  const rs = reservasDe(rpId);
  const m = metricasRP(rpId);

  // Máximos por noche (un solo día).
  const porNoche = new Map<string, { completas: number; consumo: number }>();
  for (const r of rs) {
    const n = porNoche.get(r.fecha) ?? { completas: 0, consumo: 0 };
    if (r.llegaron > 0) n.completas += 1;
    n.consumo += r.consumoReal ?? 0;
    porNoche.set(r.fecha, n);
  }
  const maxCompletasNoche = Math.max(0, ...[...porNoche.values()].map((n) => n.completas));
  const maxConsumoNoche = Math.max(0, ...[...porNoche.values()].map((n) => n.consumo));

  const cumple: Record<string, boolean> = {
    constancia: maxCompletasNoche >= DEMO_PARAMS.hitoConstanciaReservas,
    maquina_ventas: maxConsumoNoche >= DEMO_PARAMS.hitoMaquinaVentas,
    confiabilidad: m.showRate >= DEMO_PARAMS.hitoConfiabilidad,
    cero_fantasmas: m.noShows === 0,
    volumen_historico: m.personas >= DEMO_PARAMS.hitoVolumenHistorico,
  };

  return DEMO_INSIGNIAS.map((i) => ({
    clave: i.clave,
    nombre: i.nombre,
    descripcion: i.descripcion,
    desbloqueada: Boolean(cumple[i.clave]),
  }));
}

/**
 * Feed de la red social: medallas y posiciones, NUNCA montos crudos. Se arma de
 * los logros reales (top 3 + insignias desbloqueadas + rachas).
 */
export function construirFeed(): FeedItem[] {
  const feed: FeedItem[] = [];
  const ranking = listarRanking();

  ranking.slice(0, 3).forEach((e) => {
    const medalla = e.posicion === 1 ? 'oro' : e.posicion === 2 ? 'plata' : 'bronce';
    feed.push({
      id: `rank-${e.rpId}`,
      tipo: e.racha >= 2 ? 'racha' : 'ranking',
      rpNombre: e.nombre,
      texto:
        `entró al top 3 del ranking semanal — medalla de ${medalla}` +
        (e.racha >= 2 ? ` (racha de ${e.racha} semanas)` : ''),
      cuando: 'Esta semana',
    });
  });

  for (const rp of DEMO_RPS) {
    for (const ins of insigniasDeRP(rp.id)) {
      if (ins.desbloqueada) {
        feed.push({
          id: `ins-${rp.id}-${ins.clave}`,
          tipo: 'insignia',
          rpNombre: rp.nombre,
          texto: `desbloqueó la insignia "${ins.nombre}"`,
          cuando: 'Reciente',
        });
      }
    }
  }
  return feed;
}

/** Lista de RPs con sus métricas (para "desempeño de RPs" del capitán/gerente). */
export function desempenoRPs(): MetricasRP[] {
  return DEMO_RPS.map((rp) => metricasRP(rp.id)).sort((a, b) => b.consumoSemana - a.consumoSemana);
}
