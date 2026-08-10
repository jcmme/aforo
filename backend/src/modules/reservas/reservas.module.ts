import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Reserva } from './entities/reserva.entity';
import { ReservasService } from './reservas.service';
import { ReservasController } from './reservas.controller';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { crearDefinicionModuloReservas } from './reservas.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Reserva])],
  controllers: [ReservasController],
  providers: [ReservasService],
})
export class ReservasModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly reservasService: ReservasService,
  ) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloReservas(this.reservasService));
  }
}
