import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ReservasService } from './reservas.service';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('reservas')
@UseGuards(PermissionGuard)
export class ReservasController {
  constructor(private readonly reservasService: ReservasService) {}

  @Post()
  @RequirePermission('reservas.crear')
  crear(@Body() dto: CrearReservaDto, @CurrentDataScope() dataScope: DataScope) {
    return this.reservasService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('reservas.ver')
  listar(@CurrentDataScope() dataScope: DataScope, @Query('antroId') antroId?: string) {
    return this.reservasService.listar(dataScope, antroId);
  }
}
