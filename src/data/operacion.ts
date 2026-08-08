import { supabase } from '@/lib/supabase';
import type {
  EscaneoMesa,
  MovimientoMesa,
  ResultadoPuerta,
} from '@/types';

import {
  DEMO_CONTADOR,
  DEMO_EVENTOS,
  DEMO_RESERVAS,
  DEMO_RESERVAS_SEED,
  DEMO_RP_NOMBRES,
} from './mock';

// Los 6 motivos viven en config (config_parametros). En demo se reflejan aquí
// el mismo arreglo sembrado en 0004_operacion.sql.
const MOTIVOS_DEMO = [
  'QR no escanea',
  'Cliente sin celular / sin batería',
  'Invitado extra autorizado',
  'La app no abre / error de la app',
  'Reserva no aparece / error de sincronización',
  'Otro',
];

// Promo de demostración (en real la precarga el Súper Admin, módulo 4).
const PROMO_DEMO = 'Botella de cortesía al llegar';

// Bitácoras en memoria (en real son tablas; alimentan el panel Cadena/reportes).
const DEMO_MOVIMIENTOS: MovimientoMesa[] = [];

/** Todas las reservas visibles en piso (sembradas + creadas en la sesión). */
function reservasDemo() {
  return [...DEMO_RESERVAS_SEED, ...DEMO_RESERVAS];
}

function nombreEvento(eventoId: string): string {
  return DEMO_EVENTOS.find((e) => e.id === eventoId)?.nombre ?? 'Reserva';
}

/** Lista de motivos de acceso manual (editable como parámetro). */
export async function listarMotivosAcceso(): Promise<string[]> {
  if (supabase) {
    const { data } = await supabase
      .from('config_parametros')
      .select('valor')
      .eq('clave', 'motivos_acceso_manual')
      .maybeSingle();
    if (data?.valor) return data.valor as string[];
  }
  return MOTIVOS_DEMO;
}

/**
 * Valida un QR en la puerta y devuelve el semáforo. En real pasa por la Edge
 * Function `validar-puerta` (firma + pertenencia + cupo). En demo se replica.
 */
export async function validarPuerta(token: string, antroId: string): Promise<ResultadoPuerta> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('validar-puerta', {
      body: { token, antroId },
    });
    if (error) return { semaforo: 'rojo', motivo: error.message };
    return data as ResultadoPuerta;
  }

  // --- Modo demo ---
  for (const reserva of reservasDemo()) {
    const qr = reserva.qrs.find((q) => q.token === token);
    if (!qr) continue;
    if (reserva.antroId !== antroId) {
      return { semaforo: 'rojo', motivo: 'QR de otro antro' };
    }
    if (qr.estado === 'usado_puerta') {
      return { semaforo: 'rojo', motivo: 'Este QR ya fue usado para entrar' };
    }
    if (!['confirmada', 'lista_espera', 'completada'].includes(reserva.estado)) {
      return { semaforo: 'rojo', motivo: 'La reserva no está activa' };
    }
    const usados = reserva.qrs.filter((q) => q.estado === 'usado_puerta').length;
    const distribuidos = reserva.qrs.filter(
      (q) => q.estado === 'distribuido' || q.estado === 'usado_puerta',
    ).length;
    const info = {
      reservaId: reserva.id,
      qrId: qr.id,
      reservaNombre: nombreEvento(reserva.eventoId),
      rpNombre: reserva.rpId ? (DEMO_RP_NOMBRES[reserva.rpId] ?? null) : null,
      pxEsperados: reserva.numInvitados,
      distribuidos,
    };
    if (usados >= reserva.numInvitados) {
      return { semaforo: 'amarillo', motivo: 'Sin accesos restantes', adentro: usados, faltan: Math.max(0, distribuidos - usados), ...info };
    }
    // Verde: marca llegó.
    qr.estado = 'usado_puerta';
    qr.usadoEn = new Date().toISOString();
    return { semaforo: 'verde', adentro: usados + 1, faltan: Math.max(0, distribuidos - usados - 1), ...info };
  }
  return { semaforo: 'rojo', motivo: 'QR no corresponde a ninguna reserva activa' };
}

export interface DatosAccesoManual {
  antroId: string;
  reservaId?: string;
  qrId?: string;
  motivo: string;
  nota?: string;
  override?: boolean;
}

/** Registra un acceso manual (6 motivos) o un override de amarillo. */
export async function registrarAccesoManual(datos: DatosAccesoManual): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('acceso-manual', { body: datos });
    if (error) throw new Error(error.message);
    return;
  }
  // Demo: en override, el invitado entra (marca el QR).
  if (datos.override && datos.qrId) {
    for (const r of reservasDemo()) {
      const qr = r.qrs.find((q) => q.id === datos.qrId);
      if (qr) {
        qr.estado = 'usado_puerta';
        qr.usadoEn = new Date().toISOString();
      }
    }
  }
}

/** Lee el contador de penetración del día (sin reserva). */
export async function obtenerContador(antroId: string, fecha: string): Promise<number> {
  if (supabase) {
    const { data } = await supabase
      .from('contador_penetracion')
      .select('sin_reserva')
      .eq('antro_id', antroId)
      .eq('fecha_operativa', fecha)
      .maybeSingle();
    return data?.sin_reserva ?? 0;
  }
  return DEMO_CONTADOR.sinReserva;
}

/** Guarda el total del contador del día (upsert idempotente). */
export async function guardarContador(antroId: string, fecha: string, sinReserva: number): Promise<void> {
  if (supabase) {
    await supabase.functions.invoke('contador-penetracion', {
      body: { antroId, fechaOperativa: fecha, sinReserva },
    });
    return;
  }
  DEMO_CONTADOR.sinReserva = Math.max(0, sinReserva);
}

/** Reservas activas del antro (para asignar/mover mesa). */
export async function listarReservasPiso(antroId: string) {
  if (supabase) {
    const { data } = await supabase
      .from('reservas')
      .select('*, eventos(nombre)')
      .eq('antro_id', antroId)
      .in('estado', ['confirmada', 'lista_espera']);
    return (data ?? []).map((r: Record<string, any>) => ({
      id: r.id,
      nombre: r.eventos?.nombre ?? 'Reserva',
      modalidad: r.modalidad,
      numInvitados: r.num_invitados,
      mesaTexto: r.mesa_texto as string | null,
    }));
  }
  return reservasDemo()
    .filter((r) => r.antroId === antroId && ['confirmada', 'lista_espera'].includes(r.estado))
    .map((r) => ({
      id: r.id,
      nombre: nombreEvento(r.eventoId),
      modalidad: r.modalidad,
      numInvitados: r.numInvitados,
      mesaTexto: r.mesaTexto,
    }));
}

/** Asigna o mueve la mesa de una reserva (historial encadenado). */
export async function moverMesa(reservaId: string, mesaNueva: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('mover-mesa', {
      body: { reservaId, mesaNueva },
    });
    if (error) throw new Error(error.message);
    return;
  }
  const reserva = reservasDemo().find((r) => r.id === reservaId);
  if (!reserva) return;
  DEMO_MOVIMIENTOS.push({
    id: `mov-${Date.now()}`,
    reservaId,
    mesaAnterior: reserva.mesaTexto,
    mesaNueva,
    responsableId: 'demo',
    creadoEn: new Date().toISOString(),
  });
  reserva.mesaTexto = mesaNueva;
}

/** Historial encadenado de mesa de una reserva. */
export async function historialMesa(reservaId: string): Promise<MovimientoMesa[]> {
  if (supabase) {
    const { data } = await supabase
      .from('movimientos_mesa')
      .select('*')
      .eq('reserva_id', reservaId)
      .order('creado_en');
    return (data ?? []).map((m: Record<string, any>) => ({
      id: m.id,
      reservaId: m.reserva_id,
      mesaAnterior: m.mesa_anterior,
      mesaNueva: m.mesa_nueva,
      responsableId: m.responsable_id,
      creadoEn: m.creado_en,
    }));
  }
  return DEMO_MOVIMIENTOS.filter((m) => m.reservaId === reservaId);
}

/** Escaneo de mesa del capitán: trae reserva, RP, mesa, consumo y promo. */
export async function escanearMesa(token: string, antroId: string): Promise<EscaneoMesa | null> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('escanear-mesa', {
      body: { token, antroId },
    });
    if (error) throw new Error(error.message);
    return data as EscaneoMesa;
  }
  for (const reserva of reservasDemo()) {
    const qr = reserva.qrs.find((q) => q.token === token);
    if (qr) {
      return {
        reservaId: reserva.id,
        reservaNombre: nombreEvento(reserva.eventoId),
        rpNombre: reserva.rpId ? (DEMO_RP_NOMBRES[reserva.rpId] ?? null) : null,
        mesaActual: reserva.mesaTexto,
        consumoMinimo: reserva.consumoMinimo,
        promo: reserva.modalidad === 'mesa' ? PROMO_DEMO : null,
      };
    }
  }
  return null;
}

/** Acuse de "promo aplicada" (registro de entrega). */
export async function acusarPromo(reservaId: string, promoDescripcion: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('acuse-promo', {
      body: { reservaId, promoDescripcion },
    });
    if (error) throw new Error(error.message);
  }
  // Demo: el acuse queda registrado conceptualmente (sin persistencia local).
}

/** Gestión de consumo mínimo: invitar a retirarse (queda en incidencias). */
export async function invitarARetirarse(reservaId: string, nota: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('gestion-minimo', {
      body: { reservaId, accion: 'invitar_retirar', nota },
    });
    if (error) throw new Error(error.message);
  }
}

/** Tokens de los QR sembrados (para el simulador de escaneo en web/sin cámara). */
export function qrsDemoParaSimulador(antroId: string) {
  const lista: { token: string; etiqueta: string }[] = [];
  for (const r of reservasDemo()) {
    if (r.antroId !== antroId) continue;
    r.qrs.forEach((q, i) => {
      lista.push({
        token: q.token,
        etiqueta: `${nombreEvento(r.eventoId)} · QR ${i + 1} (${q.estado})`,
      });
    });
  }
  return lista;
}
