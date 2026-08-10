import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Corporativo } from './entities/corporativo.entity';
import { Antro } from './entities/antro.entity';
import { Usuario } from './entities/usuario.entity';
import { UsuarioAntro } from '../rbac/entities/usuario-antro.entity';
import { AntrosService } from './antros.service';
import { AntrosController } from './antros.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Corporativo, Antro, Usuario, UsuarioAntro])],
  controllers: [AntrosController],
  providers: [AntrosService],
  exports: [TypeOrmModule],
})
export class IdentidadModule {}
