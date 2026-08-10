import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Corporativo } from './entities/corporativo.entity';
import { Antro } from './entities/antro.entity';
import { Usuario } from './entities/usuario.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Corporativo, Antro, Usuario])],
  exports: [TypeOrmModule],
})
export class IdentidadModule {}
