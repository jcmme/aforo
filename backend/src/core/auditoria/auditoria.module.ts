import { Global, Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { AuditoriaService } from './auditoria.service';
import { AuditoriaController } from './auditoria.controller';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { crearDefinicionModuloAuditoria } from './auditoria.module-definition';

/**
 * Global porque cualquier módulo de negocio necesita registrar sus propias
 * decisiones (ver requisiciones.service.ts, reservas.service.ts, etc.) sin
 * tener que importar este módulo uno por uno — mismo patrón que RbacModule.
 */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Auditoria])],
  controllers: [AuditoriaController],
  providers: [AuditoriaService],
  exports: [AuditoriaService],
})
export class AuditoriaModule implements OnModuleInit {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloAuditoria());
  }
}
