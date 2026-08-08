import { supabase } from '@/lib/supabase';
import { DEMO_CLIENTES, DEMO_RESERVAS_HIST } from './mock';
import type { ConsumoMinimoItem } from '@/types';

// Vista del cajero (CLAUDE.md §6): captura el consumo real al cierre y consulta
// "C. Mínimos" (solo lectura). No valida ni hace cumplir el mínimo (eso es del
// capitán). La captura es exclusiva del cajero y, como soporte, del súper admin.

function etiqueta(reservaId: string): string {
  const r = DEMO_RESERVAS_HIST.find((x) => x.id === reservaId);
  if (!r) return 'Reserva';
  const cli = DEMO_CLIENTES.find((c) => c.id === r.clienteId);
  return `${cli?.nombre ?? 'Cliente'} · ${r.mesaTexto ?? 'sin mesa'}`;
}

/** Mesas con reserva por app que asistieron (para capturar su consumo). */
export async function listarMesasParaCobro(): Promise<ConsumoMinimoItem[]> {
  // Demo: reservas de mesa que llegaron (tienen consumo mínimo).
  return DEMO_RESERVAS_HIST.filter((r) => r.consumoMinimo != null && r.llegaron > 0).map((r) => ({
    reservaId: r.id,
    reservaNombre: etiqueta(r.id),
    mesaTexto: r.mesaTexto,
    consumoMinimo: r.consumoMinimo ?? 0,
    consumoReal: r.consumoReal,
  }));
}

/** Captura el consumo real de una mesa (alimenta el ranking). */
export async function capturarConsumo(reservaId: string, monto: number): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('capturar-consumo', {
      body: { reservaId, monto },
    });
    if (error) throw new Error(error.message);
    return;
  }
  const r = DEMO_RESERVAS_HIST.find((x) => x.id === reservaId);
  if (r) r.consumoReal = monto;
}

/** Ventana "C. Mínimos": todas las reservas de mesa por app y su monto (lectura). */
export async function listarConsumoMinimos(): Promise<ConsumoMinimoItem[]> {
  return DEMO_RESERVAS_HIST.filter((r) => r.consumoMinimo != null).map((r) => ({
    reservaId: r.id,
    reservaNombre: etiqueta(r.id),
    mesaTexto: r.mesaTexto,
    consumoMinimo: r.consumoMinimo ?? 0,
    consumoReal: r.consumoReal,
  }));
}
