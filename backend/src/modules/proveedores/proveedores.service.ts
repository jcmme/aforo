import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { DataScope } from '../../core/rbac/data-scope';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
  ) {}

  crear(dto: CrearProveedorDto, dataScope: DataScope): Promise<Proveedor> {
    return this.proveedorRepo.save(this.proveedorRepo.create({ ...dto, corporativoId: dataScope.corporativoId }));
  }

  /**
   * El catálogo de proveedores es corporativo, no de un antro — cualquiera
   * con el permiso (sin importar si su alcance es antro o corporativo) ve
   * el mismo catálogo completo de su corporativo. No hay nada que filtrar
   * por antro porque el proveedor no pertenece a uno.
   */
  listar(dataScope: DataScope): Promise<Proveedor[]> {
    return this.proveedorRepo.find({ where: { corporativoId: dataScope.corporativoId }, order: { nombre: 'ASC' } });
  }
}
