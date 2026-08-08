import { supabase } from '@/lib/supabase';
import { construirTokenDemo } from '@/lib/qr';
import type { NuevaReserva, QRInvitado, Reserva } from '@/types';

import {
  DEMO_CONSUMO_MINIMO_MESA,
  DEMO_EVENTOS,
  DEMO_RESERVAS,
  DEMO_RESERVAS_SEED,
  DEMO_USUARIO,
} from './mock';

/** Todas las reservas visibles en el demo: sembradas + creadas en la sesión. */
function todasLasReservas(): Reserva[] {
  return [...DEMO_RESERVAS_SEED, ...DEMO_RESERVAS];
}

/** Error de negocio legible para mostrar en la UI. */
export class ErrorReserva extends Error {}

function generarId(prefijo: string): string {
  return `${prefijo}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/** Mapea una fila de `reservas` (con sus QR) al modelo de dominio. */
function filaAReserva(r: Record<string, any>): Reserva {
  return {
    id: r.id,
    eventoId: r.evento_id,
    antroId: r.antro_id,
    corporativoId: r.corporativo_id,
    clienteId: r.cliente_id,
    rpId: r.rp_id,
    modalidad: r.modalidad,
    numInvitados: r.num_invitados,
    mesaTexto: r.mesa_texto,
    consumoMinimo: r.consumo_minimo,
    estado: r.estado,
    creadaEn: r.creada_en,
    canceladaEn: r.cancelada_en,
    invitadoNombre: r.invitado_nombre ?? null,
    invitadoTelefono: r.invitado_telefono ?? null,
    qrs: (r.qr_codes ?? []).map(
      (q: Record<string, any>): QRInvitado => ({
        id: q.id,
        reservaId: q.reserva_id,
        token: q.token,
        estado: q.estado,
        distribuidoEn: q.distribuido_en,
        usadoEn: q.usado_en,
      }),
    ),
  };
}

/**
 * Crea una reserva. En Supabase pasa por la Edge Function `crear-reserva`, que
 * valida permiso + cupo (config) + regla al_llenar y firma los QR en el
 * servidor. En modo demo se replica el flujo localmente.
 */
export async function crearReserva(datos: NuevaReserva): Promise<Reserva> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('crear-reserva', {
      body: datos,
    });
    if (error) throw new ErrorReserva(error.message);
    return filaAReserva(data.reserva);
  }

  // --- Modo demo ---
  const evento = DEMO_EVENTOS.find((e) => e.id === datos.eventoId);
  if (!evento) throw new ErrorReserva('Evento no encontrado.');

  const ocupados = evento.lugaresOcupados ?? 0;
  if (ocupados + datos.numInvitados > evento.cupoMaximo) {
    if (evento.alLlenar === 'cerrar') {
      throw new ErrorReserva('El evento está lleno y no admite lista de espera.');
    }
    // lista_espera: se crea pero en estado de espera.
  }
  const enEspera = ocupados + datos.numInvitados > evento.cupoMaximo;

  const reservaId = generarId('res');
  const qrs: QRInvitado[] = [];
  for (let i = 0; i < datos.numInvitados; i++) {
    const qrId = generarId('qr');
    qrs.push({
      id: qrId,
      reservaId,
      token: await construirTokenDemo(qrId),
      estado: 'pendiente',
      distribuidoEn: null,
      usadoEn: null,
    });
  }

  const reserva: Reserva = {
    id: reservaId,
    eventoId: evento.id,
    antroId: evento.antroId,
    corporativoId: evento.corporativoId,
    // Reserva de invitado sin cuenta (la mete staff): sin cliente_id.
    clienteId: datos.invitado ? null : DEMO_USUARIO.id,
    rpId: datos.rpId ?? null,
    modalidad: datos.modalidad,
    numInvitados: datos.numInvitados,
    mesaTexto: null,
    consumoMinimo: datos.modalidad === 'mesa' ? DEMO_CONSUMO_MINIMO_MESA : null,
    estado: enEspera ? 'lista_espera' : 'confirmada',
    creadaEn: new Date().toISOString(),
    canceladaEn: null,
    qrs,
    invitadoNombre: datos.invitado?.nombre ?? null,
    invitadoTelefono: datos.invitado?.telefono ?? null,
  };

  DEMO_RESERVAS.unshift(reserva);
  if (!enEspera) evento.lugaresOcupados = ocupados + datos.numInvitados;
  return reserva;
}

/** Reservas del cliente autenticado. */
export async function listarMisReservas(): Promise<Reserva[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reservas')
      .select('*, qr_codes(*)')
      .order('creada_en', { ascending: false });
    if (error) throw error;
    return (data ?? []).map(filaAReserva);
  }
  return DEMO_RESERVAS;
}

/** Obtiene una reserva por id (con sus QR). */
export async function obtenerReserva(id: string): Promise<Reserva | null> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reservas')
      .select('*, qr_codes(*)')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data ? filaAReserva(data) : null;
  }
  return DEMO_RESERVAS.find((r) => r.id === id) ?? null;
}

/**
 * Cancela una reserva propia. La Edge Function aplica la ventana de cancelación
 * (config por antro): antes = limpio; después = cuenta como no-show.
 */
export async function cancelarReserva(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('cancelar-reserva', {
      body: { reservaId: id },
    });
    if (error) throw new ErrorReserva(error.message);
    return;
  }
  const reserva = DEMO_RESERVAS.find((r) => r.id === id);
  if (reserva) {
    reserva.estado = 'cancelada';
    reserva.canceladaEn = new Date().toISOString();
    const evento = DEMO_EVENTOS.find((e) => e.id === reserva.eventoId);
    if (evento && evento.lugaresOcupados) {
      evento.lugaresOcupados = Math.max(0, evento.lugaresOcupados - reserva.numInvitados);
    }
  }
}

/**
 * Reclama un QR a partir de su token: lo marca como "distribuido". Es la base
 * del enlace de reclamo del RP (CLAUDE.md §6). Un QR nunca distribuido no
 * penaliza a nadie.
 */
export async function reclamarQr(token: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('reclamar-qr', {
      body: { token },
    });
    if (error) throw new ErrorReserva(error.message);
    return;
  }
  for (const reserva of todasLasReservas()) {
    const qr = reserva.qrs.find((q) => q.token === token);
    if (qr && qr.estado === 'pendiente') {
      qr.estado = 'distribuido';
      qr.distribuidoEn = new Date().toISOString();
      return;
    }
  }
}

/**
 * Devuelve el QR de un token (con el nombre del evento), para pintarlo en la
 * pantalla de reclamo: el enlace ES el acceso de quien no tiene la app.
 */
export async function obtenerQrPorToken(
  token: string,
): Promise<{ qr: QRInvitado; eventoNombre: string } | null> {
  if (supabase) {
    const { data } = await supabase
      .from('qr_codes')
      .select('*, reservas(eventos(nombre))')
      .eq('token', token)
      .maybeSingle();
    if (!data) return null;
    return {
      qr: {
        id: data.id,
        reservaId: data.reserva_id,
        token: data.token,
        estado: data.estado,
        distribuidoEn: data.distribuido_en,
        usadoEn: data.usado_en,
      },
      eventoNombre: data.reservas?.eventos?.nombre ?? 'tu evento',
    };
  }
  for (const reserva of todasLasReservas()) {
    const qr = reserva.qrs.find((q) => q.token === token);
    if (qr) {
      const evento = DEMO_EVENTOS.find((e) => e.id === reserva.eventoId);
      return { qr, eventoNombre: evento?.nombre ?? 'tu evento' };
    }
  }
  return null;
}
