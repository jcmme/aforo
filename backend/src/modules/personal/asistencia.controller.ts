import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AsistenciaService } from './asistencia.service';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('personal/asistencia')
@UseGuards(PermissionGuard)
export class AsistenciaController {
  constructor(private readonly asistenciaService: AsistenciaService) {}

  @Post()
  @RequirePermission('asistencia.registrar')
  registrar(@Body() dto: RegistrarAsistenciaDto, @CurrentDataScope() dataScope: DataScope) {
    return this.asistenciaService.registrar(dto, dataScope);
  }

  @Get()
  @RequirePermission('personal.ver')
  listar(
    @Query('desde') desde: string | undefined,
    @Query('hasta') hasta: string | undefined,
    @Query('antroId') antroId: string | undefined,
    @CurrentDataScope() dataScope: DataScope,
  ) {
    return this.asistenciaService.listar(dataScope, { desde, hasta, antroId });
  }
}
