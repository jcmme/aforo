import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, UseGuards } from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { PermissionGuard } from '../rbac/permission.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';
import { ActualizarFlagAntroDto } from './dto/actualizar-flag-antro.dto';
import { ActualizarFlagCorporativoDto } from './dto/actualizar-flag-corporativo.dto';

@Controller('feature-flags')
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  /** Sin permiso especial: cada usuario ve solo las features de los antros a los que ya tiene acceso. */
  @Get('activas')
  obtenerActivas(@CurrentUser() usuario: UsuarioAutenticado) {
    return this.featureFlagsService.obtenerActivasParaUsuario(usuario);
  }

  @Get('catalogo')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  listarCatalogo() {
    return this.featureFlagsService.listarCatalogo();
  }

  @Get('admin/corporativos')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  listarCorporativos() {
    return this.featureFlagsService.listarCorporativos();
  }

  @Get('admin/antros')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  listarAntros() {
    return this.featureFlagsService.listarAntros();
  }

  @Get('admin/estado/:antroId')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  obtenerEstadoAntro(@Param('antroId', ParseUUIDPipe) antroId: string) {
    return this.featureFlagsService.obtenerEstadoAntro(antroId);
  }

  @Patch('admin/antro')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  actualizarFlagAntro(@Body() dto: ActualizarFlagAntroDto, @CurrentUser() actor: UsuarioAutenticado) {
    return this.featureFlagsService.actualizarFlagAntro(dto.antroId, dto.featureCodigo, dto.activo, actor);
  }

  @Patch('admin/corporativo')
  @UseGuards(PermissionGuard)
  @RequirePermission('feature_flags.gestionar_todas')
  actualizarFlagCorporativo(@Body() dto: ActualizarFlagCorporativoDto, @CurrentUser() actor: UsuarioAutenticado) {
    return this.featureFlagsService.actualizarFlagCorporativo(dto.corporativoId, dto.featureCodigo, dto.activo, actor);
  }
}
