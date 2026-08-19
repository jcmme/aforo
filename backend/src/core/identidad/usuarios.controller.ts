import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';
import { CrearUsuarioDto } from './dto/crear-usuario.dto';
import { CambiarEstadoUsuarioDto } from './dto/cambiar-estado-usuario.dto';
import { PermissionGuard } from '../rbac/permission.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { CurrentDataScope } from '../rbac/data-scope.decorator';
import { DataScope } from '../rbac/data-scope';

@Controller('usuarios')
@UseGuards(PermissionGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post()
  @RequirePermission('usuarios.gestionar')
  crear(@Body() dto: CrearUsuarioDto, @CurrentDataScope() dataScope: DataScope) {
    return this.usuariosService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('usuarios.gestionar')
  listar(@CurrentDataScope() dataScope: DataScope) {
    return this.usuariosService.listar(dataScope);
  }

  @Patch(':id/estado')
  @RequirePermission('usuarios.gestionar')
  cambiarEstado(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CambiarEstadoUsuarioDto,
    @CurrentDataScope() dataScope: DataScope,
  ) {
    return this.usuariosService.cambiarEstado(id, dto.estado, dataScope);
  }
}
