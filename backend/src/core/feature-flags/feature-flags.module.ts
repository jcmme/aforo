import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Feature } from './entities/feature.entity';
import { AntroFeature } from './entities/antro-feature.entity';
import { Antro } from '../identidad/entities/antro.entity';
import { Corporativo } from '../identidad/entities/corporativo.entity';
import { IdentidadModule } from '../identidad/identidad.module';
import { FeatureFlagsService } from './feature-flags.service';
import { FeatureFlagsController } from './feature-flags.controller';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { crearDefinicionModuloFeatureFlags } from './feature-flags.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Feature, AntroFeature, Antro, Corporativo]), IdentidadModule],
  controllers: [FeatureFlagsController],
  providers: [FeatureFlagsService],
})
export class FeatureFlagsModule implements OnModuleInit {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloFeatureFlags());
  }
}
