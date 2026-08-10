import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TenancyContext } from './tenancy.types';

/**
 * Extrae de qué corporativo y usuario viene el request, a partir del JWT
 * ya validado por JwtAuthGuard. Es información de contexto separada del
 * permiso/alcance (eso lo resuelve PermissionGuard vía @CurrentDataScope()).
 */
export const CurrentTenancy = createParamDecorator((_data: unknown, ctx: ExecutionContext): TenancyContext => {
  const request = ctx.switchToHttp().getRequest();
  return {
    usuarioId: request.user.id,
    corporativoId: request.user.corporativoId,
  };
});
