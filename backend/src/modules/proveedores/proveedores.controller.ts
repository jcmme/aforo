import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ProveedoresService } from './proveedores.service';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('proveedores')
@UseGuards(PermissionGuard)
export class ProveedoresController {
  constructor(private readonly proveedoresService: ProveedoresService) {}

  @Post()
  @RequirePermission('proveedores.gestionar')
  crear(@Body() dto: CrearProveedorDto, @CurrentDataScope() dataScope: DataScope) {
    return this.proveedoresService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('proveedores.ver')
  listar(@CurrentDataScope() dataScope: DataScope) {
    return this.proveedoresService.listar(dataScope);
  }
}
