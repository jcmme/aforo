import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { Compra } from './entities/compra.entity';
import { ProveedoresService } from './proveedores.service';
import { ComprasService } from './compras.service';
import { ProveedoresController } from './proveedores.controller';
import { ComprasController } from './compras.controller';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { crearDefinicionModuloProveedores } from './proveedores.module-definition';

@Module({
  imports: [TypeOrmModule.forFeature([Proveedor, Compra])],
  controllers: [ProveedoresController, ComprasController],
  providers: [ProveedoresService, ComprasService],
})
export class ProveedoresModule implements OnModuleInit {
  constructor(
    private readonly moduleRegistry: ModuleRegistryService,
    private readonly comprasService: ComprasService,
  ) {}

  onModuleInit(): void {
    this.moduleRegistry.register(crearDefinicionModuloProveedores(this.comprasService));
  }
}
