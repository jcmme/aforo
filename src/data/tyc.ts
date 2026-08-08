import { supabase } from '@/lib/supabase';
import { DEMO_TYC_ANTRO, DEMO_TYC_CORPORATIVO, DEMO_TYC_GENERAL } from './mock';
import type { TycAntro } from '@/types';

/**
 * T&C en 3 niveles (CLAUDE.md, ronda 5):
 *  1. General de la app (fijo, editable solo por Súper Admin).
 *  2. Del corporativo.
 *  3. Del antro — el que el cliente ve al reservar. Cada antro tiene un
 *     responsable designado; el cambio requiere aprobación del Súper Admin.
 *     Corte semanal: si se aprueba antes del corte (martes 12:00, editable),
 *     aplica esa semana; si no, se pospone a la siguiente. Se calcula al leer
 *     (sin cron).
 */

export function tycGeneral(): string {
  return DEMO_TYC_GENERAL;
}

export function tycCorporativo(corporativoId: string): string {
  return DEMO_TYC_CORPORATIVO[corporativoId] ?? '';
}

/** Texto EFECTIVO del T&C de un antro: vigente, o pendiente si ya aplicó. */
export async function tycEfectivoDeAntro(antroId: string): Promise<string> {
  if (supabase) {
    const { data } = await supabase.from('tyc_antro').select('*').eq('antro_id', antroId).maybeSingle();
    if (!data) return '';
    const aplicaDesde = data.aplica_desde ? new Date(data.aplica_desde) : null;
    if (aplicaDesde && new Date() >= aplicaDesde && data.texto_pendiente) {
      return data.texto_pendiente;
    }
    return data.texto_vigente ?? '';
  }
  const t = DEMO_TYC_ANTRO[antroId];
  if (!t) return '';
  if (t.aplicaDesde && new Date() >= new Date(t.aplicaDesde) && t.textoPendiente) {
    return t.textoPendiente;
  }
  return t.textoVigente;
}

/** Registro completo de T&C de un antro (para la pantalla del responsable). */
export async function obtenerTycAntro(antroId: string): Promise<TycAntro | null> {
  if (supabase) {
    const { data } = await supabase.from('tyc_antro').select('*, usuarios(nombre)').eq('antro_id', antroId).maybeSingle();
    if (!data) return null;
    return {
      antroId: data.antro_id,
      textoVigente: data.texto_vigente,
      textoPendiente: data.texto_pendiente,
      estado: data.estado,
      responsableId: data.responsable_id,
      responsableNombre: data.usuarios?.nombre ?? null,
      propuestoEn: data.propuesto_en,
      aprobadoEn: data.aprobado_en,
      aplicaDesde: data.aplica_desde,
    };
  }
  const t = DEMO_TYC_ANTRO[antroId];
  if (!t) return null;
  return { ...t };
}

/** El responsable propone un nuevo texto (queda esperando aprobación). */
export async function proponerTyc(antroId: string, texto: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('editar-tyc-antro', { body: { antroId, texto } });
    if (error) throw new Error(error.message);
    return;
  }
  const t = DEMO_TYC_ANTRO[antroId];
  if (!t) return;
  t.textoPendiente = texto;
  t.estado = 'esperando_aprobacion';
  t.propuestoEn = new Date().toISOString();
  t.aprobadoEn = null;
  t.aplicaDesde = null;
}

/** Calcula cuándo aplica un cambio aprobado ahora, según el corte semanal. */
function calcularAplicaDesde(ahora: Date): Date {
  // Corte: martes 12:00 (editable vía config_parametros en real).
  const CORTE_DIA = 2; // martes (0=domingo)
  const CORTE_HORA = 12;
  const corteEstaSemana = new Date(ahora);
  const delta = (CORTE_DIA - ahora.getDay() + 7) % 7;
  corteEstaSemana.setDate(ahora.getDate() + delta);
  corteEstaSemana.setHours(CORTE_HORA, 0, 0, 0);
  if (ahora <= corteEstaSemana) return ahora; // antes del corte: aplica ya
  const siguienteCorte = new Date(corteEstaSemana);
  siguienteCorte.setDate(corteEstaSemana.getDate() + 7);
  return siguienteCorte;
}

/** El Súper Admin aprueba el cambio pendiente de un antro. */
export async function aprobarTyc(antroId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('aprobar-tyc', { body: { antroId } });
    if (error) throw new Error(error.message);
    return;
  }
  const t = DEMO_TYC_ANTRO[antroId];
  if (!t || !t.textoPendiente) return;
  const ahora = new Date();
  t.aprobadoEn = ahora.toISOString();
  t.aplicaDesde = calcularAplicaDesde(ahora).toISOString();
  t.estado = 'sin_cambios';
}

/** Antros con T&C pendiente de aprobación (cola del Súper Admin). */
export function listarPendientesTyc(): TycAntro[] {
  return Object.values(DEMO_TYC_ANTRO)
    .filter((t) => t.estado === 'esperando_aprobacion')
    .map((t) => ({ ...t }));
}
