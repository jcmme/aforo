import { PermissionScope } from './permission-scope.enum';

/**
 * Resultado de resolver "¿qué puede ver este usuario para este permiso?".
 * antroIds = null significa alcance corporativo: no se filtra por antro,
 * solo por corporativoId (que ya viene en el JWT del usuario).
 */
export interface DataScope {
  usuarioId: string;
  corporativoId: string;
  alcance: PermissionScope;
  antroIds: string[] | null;
}
