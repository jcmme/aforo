import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ComprasService } from './compras.service';
import { CrearCompraDto } from './dto/crear-compra.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('compras')
@UseGuards(PermissionGuard)
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Post()
  @RequirePermission('compras.registrar')
  crear(@Body() dto: CrearCompraDto, @CurrentDataScope() dataScope: DataScope) {
    return this.comprasService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('compras.ver')
  listar(@CurrentDataScope() dataScope: DataScope) {
    return this.comprasService.listar(dataScope);
  }
}
