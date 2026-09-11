import { ModuleDefinition } from '../module-registry/module-definition.interface';
import { PermissionScope } from '../rbac/permission-scope.enum';

/**
 * A propósito, "feature_flags.gestionar_todas" no se asigna a ningún rol en
 * seed.ts — solo Super Admin lo tiene, vía el mismo bypass que
 * onboarding.crear_cliente, auditoria.ver y cuentas.ver_todas.
 */
export function crearDefinicionModuloFeatureFlags(): ModuleDefinition {
  return {
    codigo: 'feature-flags',
    permisos: [
      {
        codigo: 'feature_flags.gestionar_todas',
        alcanceDefault: PermissionScope.CORPORATIVO,
        descripcion: 'Ver el catálogo de features y activarlas/desactivarlas por antro o corporativo (reservado a Super Admin)',
      },
    ],
  };
}
