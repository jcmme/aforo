import { DEMO_CLIENTES, DEMO_PARAMS, DEMO_RESERVAS_HIST } from './mock';
import type { AccionFantasma, ClienteFantasma } from '@/types';

// Motor de detección de fantasmas (el diferenciador, CLAUDE.md §6).
// No-show = QR DISTRIBUIDO que nunca fue escaneado en puerta. Los nunca
// distribuidos NO penalizan. La huella de identidad vincula reservas por
// teléfono normalizado aunque cambie el nombre.

const GENERICOS = ['invitado', 'cliente', 'sin nombre', 'amigo'];

/** Normaliza un teléfono a solo dígitos (huella de identidad). */
export function normalizarTelefono(t: string): string {
  return t.replace(/\D/g, '');
}

/** Decide la acción graduada según score y alertas (umbral editable en config). */
function accionGraduada(score: number, alertas: number): AccionFantasma | null {
  if (score <= 40) return 'bloqueo';
  if (score <= DEMO_PARAMS.scoreUmbralFantasma) return 'limite';
  if (alertas > 0) return 'alerta';
  return null;
}

/**
 * Recalcula el panel de fantasmas a partir del historial real. Devuelve solo los
 * clientes marcados (con acción). Alimenta el panel Cadena (Sección 4).
 */
export function listarFantasmas(): ClienteFantasma[] {
  // Agrupar por huella (teléfono normalizado).
  const porTelefono = new Map<string, { clientes: typeof DEMO_CLIENTES; reservas: typeof DEMO_RESERVAS_HIST }>();
  for (const cli of DEMO_CLIENTES) {
    const tel = normalizarTelefono(cli.telefono);
    const g = porTelefono.get(tel) ?? { clientes: [], reservas: [] };
    g.clientes.push(cli);
    porTelefono.set(tel, g);
  }
  for (const r of DEMO_RESERVAS_HIST) {
    const cli = DEMO_CLIENTES.find((c) => c.id === r.clienteId);
    if (!cli) continue;
    porTelefono.get(normalizarTelefono(cli.telefono))!.reservas.push(r);
  }

  // ¿Qué nombres genéricos aparecen en más de una identidad? (repetidos)
  const conteoGenericos = new Map<string, number>();
  for (const cli of DEMO_CLIENTES) {
    const n = cli.nombre.trim().toLowerCase();
    if (GENERICOS.includes(n)) conteoGenericos.set(n, (conteoGenericos.get(n) ?? 0) + 1);
  }

  const resultado: ClienteFantasma[] = [];

  porTelefono.forEach((g, tel) => {
    const nombres = Array.from(new Set(g.clientes.map((c) => c.nombre)));
    const reservas = g.reservas.length;
    const noShows = g.reservas.filter((r) => r.distribuidos > 0 && r.llegaron === 0).length;
    const distribuidos = g.reservas.reduce((s, r) => s + r.distribuidos, 0);
    const llegaron = g.reservas.reduce((s, r) => s + r.llegaron, 0);
    const showRate = distribuidos > 0 ? llegaron / distribuidos : 1;

    const alertas: string[] = [];
    if (nombres.length > 1) alertas.push('Mismo teléfono, distintos nombres');
    // Múltiples reservas el mismo día.
    const porDia = new Map<string, number>();
    g.reservas.forEach((r) => porDia.set(r.fecha, (porDia.get(r.fecha) ?? 0) + 1));
    if ([...porDia.values()].some((n) => n > 1)) alertas.push('Múltiples reservas el mismo día');
    // Nombre genérico repetido entre identidades.
    if (g.clientes.some((c) => (conteoGenericos.get(c.nombre.trim().toLowerCase()) ?? 0) > 1)) {
      alertas.push('Nombre genérico repetido');
    }

    const score = Math.max(0, 100 - noShows * DEMO_PARAMS.scorePorNoShow);
    const accion = accionGraduada(score, alertas.length);
    if (!accion) return; // no marcado

    resultado.push({
      identidad: tel,
      nombres,
      telefono: g.clientes[0]?.telefono ?? tel,
      reservas,
      noShows,
      showRate,
      score,
      alertas,
      accion,
    });
  });

  // Peores primero.
  return resultado.sort((a, b) => a.score - b.score);
}
