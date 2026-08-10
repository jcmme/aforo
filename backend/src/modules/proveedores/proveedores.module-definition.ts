import { ModuleDefinition, ReportLayout } from '../../core/module-registry/module-definition.interface';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { ComprasService } from './compras.service';

export function crearDefinicionModuloProveedores(comprasService: ComprasService): ModuleDefinition {
  return {
    codigo: 'proveedores',
    permisos: [
      { codigo: 'proveedores.gestionar', alcanceDefault: PermissionScope.CORPORATIVO, descripcion: 'Dar de alta/editar proveedores' },
      { codigo: 'proveedores.ver', alcanceDefault: PermissionScope.CORPORATIVO, descripcion: 'Ver el catálogo de proveedores' },
      { codigo: 'compras.registrar', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Registrar una compra a un proveedor' },
      { codigo: 'compras.ver', alcanceDefault: PermissionScope.ANTRO, descripcion: 'Ver compras e historial de precios' },
    ],
    reportTemplates: [
      {
        codigo: 'proveedores.historial_precios',
        titulo: 'Historial de compras',
        layout: ReportLayout.TABLA_HORIZONTAL,
        permisoRequerido: 'compras.ver',
        columnas: [
          { campo: 'proveedor', etiqueta: 'Proveedor' },
          { campo: 'categoria', etiqueta: 'Categoría' },
          { campo: 'antro', etiqueta: 'Antro' },
          { campo: 'descripcion', etiqueta: 'Descripción' },
          { campo: 'monto', etiqueta: 'Monto' },
          { campo: 'fecha', etiqueta: 'Fecha' },
        ],
        dataProvider: (ctx) => comprasService.historialParaExport(ctx.dataScope),
      },
    ],
  };
}
