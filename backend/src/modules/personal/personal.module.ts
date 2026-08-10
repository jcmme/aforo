import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Empleado } from './entities/empleado.entity';
import { Asistencia } from './entities/asistencia.entity';
import { NominaPeriodo } from './entities/nomina-periodo.entity';
import { NominaDetalle } from './entities/nomina-detalle.entity';
import { EmpleadosService } from './empleados.service';
import { AsistenciaService } from './asistencia.service';
import { NominaService } from './nomina.service';
import { EmpleadosController } from './empleados.controller';
import { AsistenciaController } from './asistencia.controller';
import { NominaController } from './nomina.controller';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { crearDefinicionModuloPersonal } from './personal.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Empleado, Asistencia, NominaPeriodo, NominaDetalle])],
  controllers: [EmpleadosController, AsistenciaController, NominaController],
  providers: [EmpleadosService, AsistenciaService, NominaService],
})
export class PersonalModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly asistenciaService: AsistenciaService,
    private readonly nominaService: NominaService,
  ) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloPersonal(this.asistenciaService, this.nominaService));
  }
}
