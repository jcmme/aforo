import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permiso_requerido';

/**
 * Marca un endpoint con el código de permiso que necesita (ej. "reservas.crear").
 * PermissionGuard lo lee y, si el usuario lo tiene, deja el DataScope resuelto
 * disponible vía @DataScope().
 */
export const RequirePermission = (codigo: string) => SetMetadata(PERMISSION_KEY, codigo);
