import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Empleado } from './entities/empleado.entity';
import { CrearEmpleadoDto } from './dto/crear-empleado.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';

@Injectable()
export class EmpleadosService {
  constructor(
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async crear(dto: CrearEmpleadoDto, dataScope: DataScope): Promise<Empleado> {
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(dto.antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }

    const empleado = await this.empleadoRepo.save(
      this.empleadoRepo.create({
        antroId: dto.antroId,
        nombre: dto.nombre,
        puesto: dto.puesto,
        tipoPago: dto.tipoPago,
        salarioBase: dto.salarioBase != null ? dto.salarioBase.toFixed(2) : null,
      }),
    );

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'empleado.crear',
      entidad: 'empleado',
      entidadId: empleado.id,
      detalle: { antroId: dto.antroId, nombre: dto.nombre, puesto: dto.puesto },
    });

    return empleado;
  }

  async listar(dataScope: DataScope, antroIdFiltro?: string): Promise<Empleado[]> {
    const query = this.empleadoRepo.createQueryBuilder('empleado').leftJoinAndSelect('empleado.antro', 'antro');
    this.aplicarAlcance(query, dataScope, antroIdFiltro);
    return query.orderBy('empleado.nombre', 'ASC').getMany();
  }

  aplicarAlcance(query: SelectQueryBuilder<Empleado>, dataScope: DataScope, antroIdFiltro?: string): void {
    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
      if (antroIdFiltro) {
        query.andWhere('empleado.antroId = :antroIdFiltro', { antroIdFiltro });
      }
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('empleado.antroId IN (:...antroIds)', { antroIds });
    }
  }
}
