import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { RequisicionesService } from './requisiciones.service';
import { CrearRequisicionDto } from './dto/crear-requisicion.dto';
import { ResolverRequisicionDto } from './dto/resolver-requisicion.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('requisiciones')
@UseGuards(PermissionGuard)
export class RequisicionesController {
  constructor(private readonly requisicionesService: RequisicionesService) {}

  @Post()
  @RequirePermission('requisiciones.crear')
  crear(@Body() dto: CrearRequisicionDto, @CurrentDataScope() dataScope: DataScope) {
    return this.requisicionesService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('requisiciones.ver')
  listar(@CurrentDataScope() dataScope: DataScope) {
    return this.requisicionesService.listar(dataScope);
  }

  @Post(':id/resolver')
  @RequirePermission('requisiciones.resolver')
  resolver(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResolverRequisicionDto,
    @CurrentDataScope() dataScope: DataScope,
  ) {
    return this.requisicionesService.resolver(id, dto, dataScope);
  }
}
