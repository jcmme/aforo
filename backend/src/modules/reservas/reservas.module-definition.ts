import { ModuleDefinition, ReportLayout } from '../../core/module-registry/module-definition.interface';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { ReservasService } from './reservas.service';

export function crearDefinicionModuloReservas(reservasService: ReservasService): ModuleDefinition {
  return {
    codigo: 'reservas',
    permisos: [
      { codigo: 'reservas.crear', alcanceDefault: PermissionScope.PROPIO, descripcion: 'Crear una reserva' },
      { codigo: 'reservas.ver', alcanceDefault: PermissionScope.PROPIO, descripcion: 'Ver reservas' },
    ],
    reportTemplates: [
      {
        codigo: 'reservas.export_rp',
        titulo: 'Reservas por RP',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'reservas.ver',
        columnas: [
          { campo: 'rp', etiqueta: 'RP' },
          { campo: 'totalReservas', etiqueta: 'Reservas totales' },
          { campo: 'confirmadas', etiqueta: 'Confirmadas' },
          { campo: 'noShows', etiqueta: 'No-shows' },
        ],
        dataProvider: (ctx) => reservasService.resumenPorRp(ctx.dataScope),
      },
      {
        codigo: 'reservas.export_lista',
        titulo: 'Lista de reservas (control de acceso)',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'reservas.ver',
        columnas: [
          { campo: 'antro', etiqueta: 'Antro' },
          { campo: 'cliente', etiqueta: 'Cliente' },
          { campo: 'telefono', etiqueta: 'Teléfono' },
          { campo: 'personas', etiqueta: '# Personas' },
          { campo: 'fecha', etiqueta: 'Fecha' },
          { campo: 'rp', etiqueta: 'RP' },
        ],
        columnaChecklist: 'Asistió',
        dataProvider: (ctx) =>
          reservasService.listarParaExport(ctx.dataScope, {
            antroId: ctx.filtros.antroId as string | undefined,
            fecha: ctx.filtros.fecha as string | undefined,
          }),
      },
    ],
  };
}
