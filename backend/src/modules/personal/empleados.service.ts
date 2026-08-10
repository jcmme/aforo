import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async crear(dto: CrearEmpleadoDto, dataScope: DataScope): Promise<Empleado> {
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(dto.antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }

    return this.empleadoRepo.save(
      this.empleadoRepo.create({
        antroId: dto.antroId,
        nombre: dto.nombre,
        puesto: dto.puesto,
        tipoPago: dto.tipoPago,
        salarioBase: dto.salarioBase != null ? dto.salarioBase.toFixed(2) : null,
      }),
    );
  }

  async listar(dataScope: DataScope): Promise<Empleado[]> {
    const query = this.empleadoRepo.createQueryBuilder('empleado').leftJoinAndSelect('empleado.antro', 'antro');
    this.aplicarAlcance(query, dataScope);
    return query.orderBy('empleado.nombre', 'ASC').getMany();
  }

  aplicarAlcance(query: SelectQueryBuilder<Empleado>, dataScope: DataScope): void {
    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('empleado.antroId IN (:...antroIds)', { antroIds });
    }
  }
}
