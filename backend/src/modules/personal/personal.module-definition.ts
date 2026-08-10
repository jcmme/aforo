import { ModuleDefinition, ReportLayout } from '../../core/module-registry/module-definition.interface';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { AsistenciaService } from './asistencia.service';
import { NominaService } from './nomina.service';

export function crearDefinicionModuloPersonal(asistenciaService: AsistenciaService, nominaService: NominaService): ModuleDefinition {
  return {
    codigo: 'personal',
    permisos: [
      { codigo: 'personal.gestionar', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Dar de alta/editar empleados' },
      { codigo: 'personal.ver', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Ver empleados y asistencia' },
      { codigo: 'asistencia.registrar', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Pasar lista de asistencia' },
      { codigo: 'nomina.gestionar', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Abrir periodos de nómina y capturar el detalle' },
      { codigo: 'nomina.ver', alcanceDefault: PermissionScope.CORPORATIVO, descripcion: 'Ver nómina' },
    ],
    reportTemplates: [
      {
        codigo: 'personal.export_asistencia',
        titulo: 'Asistencia por empleado',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'personal.ver',
        columnas: [
          { campo: 'empleado', etiqueta: 'Empleado' },
          { campo: 'puesto', etiqueta: 'Puesto' },
          { campo: 'asistencias', etiqueta: 'Asistencias' },
          { campo: 'faltas', etiqueta: 'Faltas' },
          { campo: 'retardos', etiqueta: 'Retardos' },
        ],
        dataProvider: (ctx) =>
          asistenciaService.resumenPorEmpleado(ctx.dataScope, {
            desde: ctx.filtros.desde as string | undefined,
            hasta: ctx.filtros.hasta as string | undefined,
          }),
      },
      {
        codigo: 'nomina.export_periodo',
        titulo: 'Nómina del periodo',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'nomina.ver',
        columnas: [
          { campo: 'empleado', etiqueta: 'Empleado' },
          { campo: 'puesto', etiqueta: 'Puesto' },
          { campo: 'horasTrabajadas', etiqueta: 'Horas' },
          { campo: 'faltas', etiqueta: 'Faltas' },
          { campo: 'percepciones', etiqueta: 'Percepciones' },
          { campo: 'deducciones', etiqueta: 'Deducciones' },
          { campo: 'totalPagar', etiqueta: 'Total a pagar' },
        ],
        dataProvider: (ctx) => nominaService.resumenParaExport(ctx.dataScope, { periodoId: ctx.filtros.periodoId as string | undefined }),
      },
    ],
  };
}
