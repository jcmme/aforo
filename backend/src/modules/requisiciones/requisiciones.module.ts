import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Requisicion } from './entities/requisicion.entity';
import { RequisicionesService } from './requisiciones.service';
import { RequisicionesController } from './requisiciones.controller';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { crearDefinicionModuloRequisiciones } from './requisiciones.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Requisicion])],
  controllers: [RequisicionesController],
  providers: [RequisicionesService],
})
export class RequisicionesModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly requisicionesService: RequisicionesService,
  ) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloRequisiciones(this.requisicionesService));
  }
}
