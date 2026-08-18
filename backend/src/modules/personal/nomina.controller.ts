import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { NominaService } from './nomina.service';
import { CrearNominaPeriodoDto } from './dto/crear-nomina-periodo.dto';
import { RegistrarNominaDetalleDto } from './dto/registrar-nomina-detalle.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('personal/nomina')
@UseGuards(PermissionGuard)
export class NominaController {
  constructor(private readonly nominaService: NominaService) {}

  @Post('periodos')
  @RequirePermission('nomina.gestionar')
  crearPeriodo(@Body() dto: CrearNominaPeriodoDto, @CurrentDataScope() dataScope: DataScope) {
    return this.nominaService.crearPeriodo(dto, dataScope);
  }

  @Get('periodos')
  @RequirePermission('nomina.ver')
  listarPeriodos(@CurrentDataScope() dataScope: DataScope, @Query('antroId') antroId?: string) {
    return this.nominaService.listarPeriodos(dataScope, antroId);
  }

  @Post('periodos/:periodoId/detalle')
  @RequirePermission('nomina.gestionar')
  registrarDetalle(
    @Param('periodoId', ParseUUIDPipe) periodoId: string,
    @Body() dto: RegistrarNominaDetalleDto,
    @CurrentDataScope() dataScope: DataScope,
  ) {
    return this.nominaService.registrarDetalle(periodoId, dto, dataScope);
  }

  @Get('periodos/:periodoId/detalle')
  @RequirePermission('nomina.ver')
  listarDetalle(@Param('periodoId', ParseUUIDPipe) periodoId: string, @CurrentDataScope() dataScope: DataScope) {
    return this.nominaService.listarDetalle(periodoId, dataScope);
  }
}
