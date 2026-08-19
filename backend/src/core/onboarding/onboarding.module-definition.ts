import { ModuleDefinition } from '../module-registry/module-definition.interface';
import { PermissionScope } from '../rbac/permission-scope.enum';

/**
 * A propósito, "onboarding.crear_cliente" no se asigna a ningún rol en
 * seed.ts — solo Super Admin lo tiene, vía el mismo bypass que auditoria.ver
 * y cuentas.ver_todas.
 */
export function crearDefinicionModuloOnboarding(): ModuleDefinition {
  return {
    codigo: 'onboarding',
    permisos: [
      {
        codigo: 'onboarding.crear_cliente',
        alcanceDefault: PermissionScope.CORPORATIVO,
        descripcion: 'Dar de alta un cliente nuevo: corporativo, primer antro y su cuenta Dueño (reservado a Super Admin)',
      },
    ],
  };
}
