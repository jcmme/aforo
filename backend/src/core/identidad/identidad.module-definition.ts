import { ModuleDefinition } from '../module-registry/module-definition.interface';
import { PermissionScope } from '../rbac/permission-scope.enum';

export function crearDefinicionModuloIdentidad(): ModuleDefinition {
  return {
    codigo: 'usuarios',
    permisos: [
      {
        codigo: 'usuarios.gestionar',
        alcanceDefault: PermissionScope.ANTRO,
        descripcion: 'Crear y administrar cuentas secundarias (Gerente de Antro, RP, Hostess)',
      },
      {
        codigo: 'cuentas.ver_todas',
        alcanceDefault: PermissionScope.CORPORATIVO,
        descripcion: 'Ver y administrar las cuentas de todos los antros agrupadas (reservado a Super Admin, como auditoria.ver)',
      },
    ],
  };
}
