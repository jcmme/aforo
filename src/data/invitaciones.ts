import { supabase } from '@/lib/supabase';
import { DEMO_INVITACIONES, type InvitacionSeed } from './mock';
import type { Invitacion, Rol } from '@/types';

// Gestión de invitaciones (CLAUDE.md §6). El acceso de personal se recibe por
// invitación; no hay alta pública. Escalera: nadie invita a un rango igual o
// superior. Generar la invitación ES la aprobación; se puede revocar al instante.

/** Roles que un rol puede invitar (escalera de invitación). */
export function rolesInvitables(rolInvitador: Rol): Rol[] {
  switch (rolInvitador) {
    case 'capitan':
      return ['rp'];
    case 'gerente':
    case 'gerente_general':
      return ['capitan', 'hostess', 'cajero', 'cadenero', 'rp'];
    case 'super_admin':
      return ['dueno', 'socio', 'gerente_general', 'gerente', 'capitan', 'hostess', 'cajero', 'cadenero', 'rp'];
    default:
      return [];
  }
}

/** Código no adivinable (demo: aleatorio; en real lo firma el servidor). */
function generarCodigo(): string {
  const azar = () => Math.random().toString(36).slice(2, 6).toUpperCase();
  return `AF-${azar()}-${azar()}`;
}

function aInvitacion(i: InvitacionSeed): Invitacion {
  return {
    id: i.id,
    codigo: i.codigo,
    rol: i.rol as Rol,
    antroId: i.antroId,
    corporativoId: i.corporativoId,
    usosMax: i.usosMax,
    usos: i.usos,
    caducaEn: i.caducaEn,
    revocada: i.revocada,
    creadaEn: i.creadaEn,
  };
}

export interface NuevaInvitacion {
  rol: Rol;
  antroId: string | null;
  corporativoId: string;
  usosMax: number;
  caducidadHoras?: number;
}

/** Genera (= aprueba) una invitación. */
export async function generarInvitacion(datos: NuevaInvitacion): Promise<Invitacion> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('generar-invitacion', { body: datos });
    if (error) throw new Error(error.message);
    return data.invitacion as Invitacion;
  }
  const horas = datos.caducidadHoras ?? 72;
  const inv: InvitacionSeed = {
    id: `inv-${Date.now()}`,
    codigo: generarCodigo(),
    rol: datos.rol,
    antroId: datos.antroId,
    corporativoId: datos.corporativoId,
    usosMax: datos.usosMax,
    usos: 0,
    caducaEn: new Date(Date.now() + horas * 3600 * 1000).toISOString(),
    revocada: false,
    creadaEn: new Date().toISOString(),
  };
  DEMO_INVITACIONES.unshift(inv);
  return aInvitacion(inv);
}

/** Invitaciones de un corporativo. */
export async function listarInvitaciones(corporativoId: string): Promise<Invitacion[]> {
  if (supabase) {
    const { data } = await supabase.from('invitaciones').select('*').eq('corporativo_id', corporativoId).order('creada_en', { ascending: false });
    return (data ?? []).map((r: Record<string, any>) => aInvitacion({
      id: r.id, codigo: r.codigo, rol: r.rol, antroId: r.antro_id, corporativoId: r.corporativo_id,
      usosMax: r.usos_max, usos: r.usos, caducaEn: r.caduca_en, revocada: r.revocada, creadaEn: r.creada_en,
    }));
  }
  return DEMO_INVITACIONES.filter((i) => i.corporativoId === corporativoId).map(aInvitacion);
}

/** Revoca una invitación al instante. */
export async function revocarInvitacion(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.functions.invoke('revocar-invitacion', { body: { id } });
    if (error) throw new Error(error.message);
    return;
  }
  const inv = DEMO_INVITACIONES.find((i) => i.id === id);
  if (inv) inv.revocada = true;
}

// Intentos fallidos de código (bloqueo temporal tras 3, editable).
let intentosFallidos = 0;
const MAX_INTENTOS = 3;

export interface ResultadoReclamo {
  ok: boolean;
  rol?: Rol;
  error?: string;
  bloqueado?: boolean;
}

/** Reclama una invitación con su código (conecta el campo del perfil). */
export async function reclamarInvitacion(codigo: string): Promise<ResultadoReclamo> {
  if (supabase) {
    const { data, error } = await supabase.functions.invoke('reclamar-invitacion', { body: { codigo } });
    if (error) return { ok: false, error: error.message };
    return data as ResultadoReclamo;
  }
  if (intentosFallidos >= MAX_INTENTOS) {
    return { ok: false, bloqueado: true, error: 'Demasiados intentos. Intenta más tarde.' };
  }
  const inv = DEMO_INVITACIONES.find((i) => i.codigo === codigo.trim().toUpperCase());
  const vigente = inv && !inv.revocada && inv.usos < inv.usosMax && new Date(inv.caducaEn) > new Date();
  if (!inv || !vigente) {
    intentosFallidos++;
    return { ok: false, error: 'Código inválido o caducado.', bloqueado: intentosFallidos >= MAX_INTENTOS };
  }
  inv.usos++;
  intentosFallidos = 0;
  return { ok: true, rol: inv.rol as Rol };
}
