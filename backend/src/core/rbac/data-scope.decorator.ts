import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DataScope } from './data-scope';

/**
 * Lee el DataScope que PermissionGuard ya resolvió para este request.
 * Solo tiene sentido en endpoints protegidos con @RequirePermission(...).
 */
export const CurrentDataScope = createParamDecorator((_data: unknown, ctx: ExecutionContext): DataScope => {
  const request = ctx.switchToHttp().getRequest();
  return request.dataScope;
});
