import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { EmpleadosService } from './empleados.service';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('personal/empleados')
@UseGuards(PermissionGuard)
export class EmpleadosController {
  constructor(private readonly empleadosService: EmpleadosService) {}

  @Post()
  @RequirePermission('personal.gestionar')
  crear(@Body() dto: CrearEmpleadoDto, @CurrentDataScope() dataScope: DataScope) {
    return this.empleadosService.crear(dto, dataScope);
  }

  @Get()
  @RequirePermission('personal.ver')
  listar(@CurrentDataScope() dataScope: DataScope) {
    return this.empleadosService.listar(dataScope);
  }
}
