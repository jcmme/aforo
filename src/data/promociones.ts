import { supabase } from '@/lib/supabase';
import { DEMO_ANTROS, DEMO_PROMOCIONES } from './mock';
import type { PromoDisponible } from '@/types';

/**
 * Espacio de promociones del CLIENTE (escaparate neutral, no pertenece a
 * ningún corporativo). Devuelve las promociones DISPONIBLES de todos los
 * antros: vigentes (dentro de fechas) y no pausadas. Las "destacadas"
 * (difusión pagada) van primero y se muestran en grande, sin letrero de
 * "pagada". Cada promoción lleva a su antro dueño.
 *
 * A futuro caben aquí las promociones globales exclusivas de miembros
 * (antro_id nulo): el modelo ya lo permite; se añadirán como una sección
 * propia sin rehacer esta función.
 */
export async function promocionesDisponibles(): Promise<PromoDisponible[]> {
  const ahora = new Date();
  const vigente = (inicio: string | null, fin: string | null) =>
    (!inicio || new Date(inicio) <= ahora) && (!fin || new Date(fin) >= ahora);

  if (supabase) {
    const { data } = await supabase
      .from('promociones')
      .select('id, nombre, detalle, antros(id, nombre, zona, fotos)')
      .not('antro_id', 'is', null);
    const lista = (data ?? [])
      .filter((p: Record<string, any>) => {
        const d = p.detalle ?? {};
        return !d.pausada && vigente(d.inicio ?? null, d.fin ?? null);
      })
      .map((p: Record<string, any>) => ({
        id: p.id,
        nombre: p.nombre,
        antroId: p.antros?.id ?? '',
        antroNombre: p.antros?.nombre ?? '',
        zona: p.antros?.zona ?? null,
        foto: p.antros?.fotos?.[0] ?? null,
        destacada: Boolean(p.detalle?.pagada),
      }));
    return ordenar(lista);
  }

  // Demo.
  const lista: PromoDisponible[] = DEMO_PROMOCIONES.filter(
    (p) => !p.pausada && vigente(p.inicio, p.fin),
  ).map((p) => {
    const antro = DEMO_ANTROS.find((a) => a.id === p.antroId);
    return {
      id: p.id,
      nombre: p.nombre,
      antroId: p.antroId,
      antroNombre: antro?.nombre ?? '',
      zona: antro?.zona ?? null,
      foto: p.foto ?? antro?.fotos?.[0] ?? null,
      destacada: p.pagada,
    };
  });
  return ordenar(lista);
}

/** Destacadas primero (difusión pagada), luego el resto. */
function ordenar(lista: PromoDisponible[]): PromoDisponible[] {
  return [...lista].sort((a, b) => Number(b.destacada) - Number(a.destacada));
}
