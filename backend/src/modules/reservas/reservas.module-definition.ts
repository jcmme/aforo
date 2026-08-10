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
    ],
  };
}
