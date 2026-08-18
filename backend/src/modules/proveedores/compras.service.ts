import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Compra } from './entities/compra.entity';
import { CrearCompraDto } from './dto/crear-compra.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';

@Injectable()
export class ComprasService {
  constructor(
    @InjectRepository(Compra)
    private readonly compraRepo: Repository<Compra>,
  ) {}

  async crear(dto: CrearCompraDto, dataScope: DataScope): Promise<Compra> {
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(dto.antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }

    return this.compraRepo.save(
      this.compraRepo.create({
        antroId: dto.antroId,
        proveedorId: dto.proveedorId,
        requisicionId: dto.requisicionId ?? null,
        descripcion: dto.descripcion,
        monto: dto.monto.toFixed(2),
        fecha: dto.fecha,
      }),
    );
  }

  async listar(dataScope: DataScope, antroIdFiltro?: string): Promise<Compra[]> {
    const query = this.compraRepo
      .createQueryBuilder('compra')
      .leftJoinAndSelect('compra.antro', 'antro')
      .leftJoinAndSelect('compra.proveedor', 'proveedor');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
      if (antroIdFiltro) {
        query.andWhere('compra.antroId = :antroIdFiltro', { antroIdFiltro });
      }
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('compra.antroId IN (:...antroIds)', { antroIds });
    }

    return query.orderBy('compra.fecha', 'DESC').getMany();
  }

  /** Fuente de datos de la plantilla "proveedores.historial_precios". */
  async historialParaExport(dataScope: DataScope): Promise<Record<string, unknown>[]> {
    const compras = await this.listar(dataScope);
    return compras.map((c) => ({
      proveedor: c.proveedor.nombre,
      categoria: c.proveedor.categoria,
      antro: c.antro.nombre,
      descripcion: c.descripcion,
      monto: c.monto,
      fecha: c.fecha,
    }));
  }
}
