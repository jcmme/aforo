import {
  DEMO_ANTROS,
  DEMO_AUDITORIA,
  DEMO_CONFIG_EDITABLE,
  DEMO_CORPORATIVOS,
  DEMO_CORP_ESTADO,
  DEMO_FEATURE_FLAGS,
  DEMO_NOTIF_SWITCHES,
  DEMO_PLANES,
  DEMO_PROMOCIONES,
} from './mock';
import { metricasConsolidadas } from './gestion';
import type { AuditoriaItem, CorporativoAdmin, ParametroConfig, PromocionItem, SaludCorporativo } from '@/types';

// Panel de Súper Admin (MABI, transversal). Principio rector: todo lo que hoy
// requeriría tocar código debe ser un botón o un parámetro editable.

const nombreCorp = (id: string) => DEMO_CORPORATIVOS.find((c) => c.id === id)?.nombre ?? id;
const nombreAntro = (id: string) => DEMO_ANTROS.find((a) => a.id === id)?.nombre ?? id;

export const PLANES = DEMO_PLANES;

/** Todos los antros (para asignar promociones, etc.). */
export function antrosTodos() {
  return DEMO_ANTROS.map((a) => ({ id: a.id, nombre: a.nombre }));
}

/** Corporativos con su estado, plan y feature flags. */
export function listarCorporativos(): CorporativoAdmin[] {
  return DEMO_CORPORATIVOS.map((c) => ({
    id: c.id,
    nombre: c.nombre,
    plan: DEMO_CORP_ESTADO[c.id]?.plan ?? c.plan,
    activo: DEMO_CORP_ESTADO[c.id]?.activo ?? true,
    antros: DEMO_ANTROS.filter((a) => a.corporativoId === c.id).length,
    featureFlags: DEMO_FEATURE_FLAGS[c.id] ?? [],
  }));
}

export function toggleFeatureFlag(corpId: string, clave: string) {
  const ff = DEMO_FEATURE_FLAGS[corpId]?.find((f) => f.clave === clave);
  if (ff) ff.habilitado = !ff.habilitado;
}

export function suspenderCorporativo(corpId: string, activo: boolean) {
  if (DEMO_CORP_ESTADO[corpId]) DEMO_CORP_ESTADO[corpId].activo = activo;
}

export function asignarPlan(corpId: string, plan: string) {
  if (DEMO_CORP_ESTADO[corpId]) DEMO_CORP_ESTADO[corpId].plan = plan;
}

/** Promociones (creación exclusiva del Súper Admin). */
export function listarPromociones(): PromocionItem[] {
  return DEMO_PROMOCIONES.map((p) => ({
    id: p.id,
    nombre: p.nombre,
    antroNombre: nombreAntro(p.antroId),
    inicio: p.inicio,
    fin: p.fin,
    pausada: p.pausada,
    pagada: p.pagada,
    monto: p.monto,
  }));
}

export function crearPromocion(nombre: string, antroId: string, pagada: boolean, monto: number | null) {
  DEMO_PROMOCIONES.unshift({ id: `promo-${Date.now()}`, nombre, antroId, inicio: new Date().toISOString().slice(0, 10), fin: null, pausada: false, pagada, monto });
}

export function togglePausaPromo(id: string) {
  const p = DEMO_PROMOCIONES.find((x) => x.id === id);
  if (p) p.pausada = !p.pausada;
}

/** Parámetros editables sin código. */
export function listarParametros(): ParametroConfig[] {
  return DEMO_CONFIG_EDITABLE.map((p) => ({ clave: p.clave, valor: p.valor, descripcion: p.descripcion }));
}

export function editarParametro(clave: string, valor: string) {
  const p = DEMO_CONFIG_EDITABLE.find((x) => x.clave === clave);
  if (p) p.valor = valor;
}

/** Bitácora global de auditoría (todos los corporativos). */
export function listarAuditoria(): AuditoriaItem[] {
  return DEMO_AUDITORIA.map((a) => ({
    id: a.id,
    accion: a.accion,
    entidad: a.entidad,
    actor: a.actor,
    corporativo: nombreCorp(a.corporativoId),
    cuando: a.cuando,
  }));
}

/** Salud del producto: adopción y actividad por corporativo. */
export function saludProducto(): SaludCorporativo[] {
  return DEMO_CORPORATIVOS.map((c) => {
    const m = metricasConsolidadas(c.id);
    return {
      corporativoId: c.id,
      nombre: c.nombre,
      reservas: m.reservas,
      adopcionPct: m.adopcionPct,
      activo: DEMO_CORP_ESTADO[c.id]?.activo ?? true,
    };
  });
}

/** Interruptores de notificaciones configurables del gerente (apagados por defecto). */
export function obtenerNotifSwitches() {
  return { ...DEMO_NOTIF_SWITCHES };
}
export function toggleNotifSwitch(clave: keyof typeof DEMO_NOTIF_SWITCHES) {
  DEMO_NOTIF_SWITCHES[clave] = !DEMO_NOTIF_SWITCHES[clave];
}
