import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Proveedor } from './entities/proveedor.entity';
import { CrearProveedorDto } from './dto/crear-proveedor.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';

@Injectable()
export class ProveedoresService {
  constructor(
    @InjectRepository(Proveedor)
    private readonly proveedorRepo: Repository<Proveedor>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async crear(dto: CrearProveedorDto, dataScope: DataScope): Promise<Proveedor> {
    const proveedor = await this.proveedorRepo.save(this.proveedorRepo.create({ ...dto, corporativoId: dataScope.corporativoId }));

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'proveedor.crear',
      entidad: 'proveedor',
      entidadId: proveedor.id,
      detalle: { nombre: dto.nombre, categoria: dto.categoria },
    });

    return proveedor;
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
