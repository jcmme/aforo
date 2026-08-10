import { ModuleRegistryService } from './module-registry.service';
import { RbacService, PermisoDeclarado } from '../rbac/rbac.service';

/**
 * Aplana los permisos que cada módulo declaró al registrarse y los deja
 * al día en la tabla `permiso`. La usan tanto el arranque normal (main.ts)
 * como el script de seed, para que ambos vean el mismo catálogo.
 */
export async function sincronizarPermisosDesdeRegistro(
  moduleRegistry: ModuleRegistryService,
  rbacService: RbacService,
): Promise<void> {
  const permisosDeclarados: PermisoDeclarado[] = moduleRegistry
    .getTodosLosModulos()
    .flatMap((modulo) =>
      modulo.permisos.map((permiso) => ({
        codigo: permiso.codigo,
        modulo: modulo.codigo,
        descripcion: permiso.descripcion,
      })),
    );

  await rbacService.sincronizarPermisos(permisosDeclarados);
}
