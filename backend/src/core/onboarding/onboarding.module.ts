import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Corporativo } from '../identidad/entities/corporativo.entity';
import { Antro } from '../identidad/entities/antro.entity';
import { Usuario } from '../identidad/entities/usuario.entity';
import { UsuarioAntro } from '../rbac/entities/usuario-antro.entity';
import { Rol } from '../rbac/entities/rol.entity';
import { Auditoria } from '../auditoria/entities/auditoria.entity';
import { AntroFeature } from '../feature-flags/entities/antro-feature.entity';
import { OnboardingService } from './onboarding.service';
import { OnboardingController } from './onboarding.controller';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { crearDefinicionModuloOnboarding } from './onboarding.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Corporativo, Antro, Usuario, UsuarioAntro, Rol, Auditoria, AntroFeature])],
  controllers: [OnboardingController],
  providers: [OnboardingService],
})
export class OnboardingModule implements OnModuleInit {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloOnboarding());
  }
}
