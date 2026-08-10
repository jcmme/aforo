import { ModuleDefinition, ReportLayout } from '../../core/module-registry/module-definition.interface';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { MetricasService } from './metricas.service';

export function crearDefinicionModuloMetricas(metricasService: MetricasService): ModuleDefinition {
  return {
    codigo: 'metricas',
    permisos: [
      { codigo: 'metricas.ver', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Ver métricas del/los establecimientos' },
    ],
    reportTemplates: [
      {
        codigo: 'metricas.resumen_por_antro',
        titulo: 'Resumen por antro',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'metricas.ver',
        columnas: [
          { campo: 'antro', etiqueta: 'Antro' },
          { campo: 'totalReservas', etiqueta: 'Reservas' },
          { campo: 'confirmadas', etiqueta: 'Confirmadas' },
          { campo: 'noShows', etiqueta: 'No-shows' },
          { campo: 'gastosAprobados', etiqueta: 'Gastos aprobados' },
        ],
        dataProvider: (ctx) =>
          metricasService.resumenPorAntro(ctx.dataScope, {
            desde: ctx.filtros.desde as string | undefined,
            hasta: ctx.filtros.hasta as string | undefined,
          }),
      },
    ],
  };
}
