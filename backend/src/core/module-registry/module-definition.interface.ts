import { PermissionScope } from '../rbac/permission-scope.enum';
import { DataScope } from '../rbac/data-scope';

export interface PermissionDefinition {
  codigo: string;
  alcanceDefault: PermissionScope;
  descripcion?: string;
}

export enum ReportLayout {
  TABLA_HORIZONTAL = 'tabla_horizontal',
  DETALLE_TABULAR = 'detalle_tabular',
  RESUMEN_TARJETAS = 'resumen_tarjetas',
}

export interface ReportColumn {
  campo: string;
  etiqueta: string;
}

export interface ExportContext {
  dataScope: DataScope;
  filtros: Record<string, unknown>;
}

export interface ReportTemplateDefinition {
  codigo: string;
  titulo: string;
  layout: ReportLayout;
  columnas: ReportColumn[];
  /** Permiso que se evalúa (con su alcance) antes de generar este reporte. */
  permisoRequerido: string;
  /** Si se declara, el PDF agrega una última columna con un recuadro vacío por fila (para marcar a mano, ej. asistencia). */
  columnaChecklist?: string;
  dataProvider: (ctx: ExportContext) => Promise<Record<string, unknown>[]>;
}

/**
 * Contrato que cada módulo de negocio declara al arrancar. El core lee esto
 * para saber qué permisos existen y qué reportes puede generar — nunca al
 * revés, el core no importa nada de los módulos.
 */
export interface ModuleDefinition {
  codigo: string;
  permisos: PermissionDefinition[];
  reportTemplates?: ReportTemplateDefinition[];
}
