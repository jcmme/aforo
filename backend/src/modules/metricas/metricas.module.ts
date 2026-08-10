import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Requisicion } from '../requisiciones/entities/requisicion.entity';
import { MetricasService } from './metricas.service';
import { MetricasController } from './metricas.controller';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { crearDefinicionModuloMetricas } from './metricas.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva, Requisicion])],
  controllers: [MetricasController],
  providers: [MetricasService],
})
export class MetricasModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly metricasService: MetricasService,
  ) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloMetricas(this.metricasService));
  }
}
