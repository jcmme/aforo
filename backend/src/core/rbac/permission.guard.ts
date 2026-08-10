import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacService } from './rbac.service';
import { PERMISSION_KEY } from './require-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rbacService: RbacService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permisoCodigo = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!permisoCodigo) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const usuario = request.user;
    if (!usuario) {
      throw new UnauthorizedException('Se requiere iniciar sesión.');
    }

    const dataScope = await this.rbacService.resolveDataScope(usuario.id, usuario.corporativoId, permisoCodigo);
    if (!dataScope) {
      throw new ForbiddenException(`No tienes el permiso requerido: ${permisoCodigo}`);
    }

    request.dataScope = dataScope;
    return true;
  }
}
