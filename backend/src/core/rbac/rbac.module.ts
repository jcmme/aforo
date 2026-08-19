import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './entities/rol.entity';
import { Permiso } from './entities/permiso.entity';
import { RolPermiso } from './entities/rol-permiso.entity';
import { UsuarioAntro } from './entities/usuario-antro.entity';
import { Antro } from '../identidad/entities/antro.entity';
import { RbacService } from './rbac.service';
import { PermissionGuard } from './permission.guard';
import { AntroGuardService } from './antro-guard.service';

// PermissionGuard NO se registra como guard global: se aplica por
// controlador con @UseGuards(PermissionGuard) + @RequirePermission(...).
// Así se garantiza que corre DESPUÉS del JwtAuthGuard global (que sí
// puebla request.user) — el orden entre dos guards globales de módulos
// distintos no está garantizado, el de controlador-tras-global sí.
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Rol, Permiso, RolPermiso, UsuarioAntro, Antro])],
  providers: [RbacService, PermissionGuard, AntroGuardService],
  exports: [RbacService, PermissionGuard, AntroGuardService, TypeOrmModule],
})
export class RbacModule {}
