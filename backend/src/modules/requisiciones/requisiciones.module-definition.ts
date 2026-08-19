import { ModuleDefinition, ReportLayout } from '../../core/module-registry/module-definition.interface';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { RequisicionesService } from './requisiciones.service';

export function crearDefinicionModuloRequisiciones(requisicionesService: RequisicionesService): ModuleDefinition {
  return {
    codigo: 'requisiciones',
    permisos: [
      { codigo: 'requisiciones.crear', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Levantar una requisición de gasto' },
      { codigo: 'requisiciones.ver', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Ver requisiciones' },
      {
        codigo: 'requisiciones.resolver',
        alcanceDefault: PermissionScope.CORPORATIVO,
        descripcion: 'Aprobar, rechazar o ajustar una requisición',
      },
    ],
    reportTemplates: [
      {
        codigo: 'requisiciones.export',
        titulo: 'Requisiciones',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'requisiciones.ver',
        columnas: [
          { campo: 'antro', etiqueta: 'Antro' },
          { campo: 'destino', etiqueta: 'Destino' },
          { campo: 'nota', etiqueta: 'Nota' },
          { campo: 'montoSolicitado', etiqueta: 'Monto solicitado' },
          { campo: 'montoResuelto', etiqueta: 'Monto resuelto' },
          { campo: 'estado', etiqueta: 'Estado' },
          { campo: 'fechaGastoProgramada', etiqueta: 'Fecha' },
        ],
        dataProvider: (ctx) => requisicionesService.listarParaExport(ctx.dataScope),
      },
    ],
  };
}
