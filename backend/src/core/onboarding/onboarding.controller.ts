import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { OnboardingService } from './onboarding.service';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { PermissionGuard } from '../rbac/permission.guard';
import { RequirePermission } from '../rbac/require-permission.decorator';
import { CurrentDataScope } from '../rbac/data-scope.decorator';
import { DataScope } from '../rbac/data-scope';

@Controller('onboarding')
@UseGuards(PermissionGuard)
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Post('clientes')
  @RequirePermission('onboarding.crear_cliente')
  crearCliente(@Body() dto: CrearClienteDto, @CurrentDataScope() dataScope: DataScope) {
    return this.onboardingService.crearCliente(dto, dataScope.usuarioId);
  }

  @Get('clientes')
  @RequirePermission('onboarding.crear_cliente')
  listarClientes() {
    return this.onboardingService.listarClientes();
  }
}
