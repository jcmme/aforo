import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Corporativo } from './entities/corporativo.entity';
import { Antro } from './entities/antro.entity';
import { Usuario } from './entities/usuario.entity';
import { UsuarioAntro } from '../rbac/entities/usuario-antro.entity';
import { Rol } from '../rbac/entities/rol.entity';
import { AntrosService } from './antros.service';
import { AntrosController } from './antros.controller';
import { UsuariosService } from './usuarios.service';
import { UsuariosController } from './usuarios.controller';
import { ModuleRegistryService } from '../module-registry/module-registry.service';
import { crearDefinicionModuloIdentidad } from './identidad.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Corporativo, Antro, Usuario, UsuarioAntro, Rol])],
  controllers: [AntrosController, UsuariosController],
  providers: [AntrosService, UsuariosService],
  exports: [TypeOrmModule, AntrosService],
})
export class IdentidadModule implements OnModuleInit {
  constructor(private readonly moduleRegistry: ModuleRegistryService) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloIdentidad());
  }
}
