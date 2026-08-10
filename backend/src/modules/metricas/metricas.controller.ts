import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { MetricasService } from './metricas.service';
import { PermissionGuard } from '../../core/rbac/permission.guard';
import { RequirePermission } from '../../core/rbac/require-permission.decorator';
import { CurrentDataScope } from '../../core/rbac/data-scope.decorator';
import { DataScope } from '../../core/rbac/data-scope';

@Controller('metricas')
@UseGuards(PermissionGuard)
export class MetricasController {
  constructor(private readonly metricasService: MetricasService) {}

  @Get('resumen')
  @RequirePermission('metricas.ver')
  resumen(@Query('desde') desde: string | undefined, @Query('hasta') hasta: string | undefined, @CurrentDataScope() dataScope: DataScope) {
    return this.metricasService.resumenPorAntro(dataScope, { desde, hasta });
  }
}
