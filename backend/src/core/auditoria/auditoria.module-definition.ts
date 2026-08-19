import { ModuleDefinition } from '../module-registry/module-definition.interface';
import { PermissionScope } from '../rbac/permission-scope.enum';

/**
 * A propósito, "auditoria.ver" no se le asigna a ningún rol en seed.ts —
 * solo Super Admin la ve, vía el bypass de RbacService.resolveDataScope
 * (que no necesita que el permiso esté explícitamente concedido).
 */
export function crearDefinicionModuloAuditoria(): ModuleDefinition {
  return {
    codigo: 'auditoria',
    permisos: [
      {
        codigo: 'auditoria.ver',
        alcanceDefault: PermissionScope.CORPORATIVO,
        descripcion: 'Ver la bitácora de decisiones de la plataforma (reservado a Super Admin)',
      },
    ],
  };
}
