import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Asistencia } from './entities/asistencia.entity';
import { Empleado } from './entities/empleado.entity';
import { RegistrarAsistenciaDto } from './dto/registrar-asistencia.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';

@Injectable()
export class AsistenciaService {
  constructor(
    @InjectRepository(Asistencia)
    private readonly asistenciaRepo: Repository<Asistencia>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
  ) {}

  async registrar(dto: RegistrarAsistenciaDto, dataScope: DataScope): Promise<Asistencia> {
    const empleado = await this.empleadoRepo.findOne({ where: { id: dto.empleadoId } });
    if (!empleado) {
      throw new NotFoundException('Empleado no encontrado.');
    }
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(empleado.antroId)) {
      throw new ForbiddenException('No tienes acceso a ese empleado.');
    }

    return this.asistenciaRepo.save(
      this.asistenciaRepo.create({
        empleadoId: dto.empleadoId,
        fecha: dto.fecha,
        estado: dto.estado,
        horaEntrada: dto.horaEntrada ?? null,
        horaSalida: dto.horaSalida ?? null,
      }),
    );
  }

  async listar(dataScope: DataScope, filtros: { desde?: string; hasta?: string }): Promise<Asistencia[]> {
    const query = this.construirQueryEscopada(dataScope);
    this.aplicarFiltrosFecha(query, filtros);
    return query.orderBy('asistencia.fecha', 'DESC').getMany();
  }

  /** Fuente de datos de la plantilla "personal.export_asistencia": una fila por empleado, totales del periodo. */
  async resumenPorEmpleado(dataScope: DataScope, filtros: { desde?: string; hasta?: string }): Promise<Record<string, unknown>[]> {
    const query = this.construirQueryEscopada(dataScope)
      .select('empleado.id', 'empleadoId')
      .addSelect('empleado.nombre', 'empleado')
      .addSelect('empleado.puesto', 'puesto')
      .addSelect(`COUNT(*) FILTER (WHERE asistencia.estado = 'asistio')`, 'asistencias')
      .addSelect(`COUNT(*) FILTER (WHERE asistencia.estado = 'falta')`, 'faltas')
      .addSelect(`COUNT(*) FILTER (WHERE asistencia.estado = 'retardo')`, 'retardos')
      .groupBy('empleado.id')
      .addGroupBy('empleado.nombre')
      .addGroupBy('empleado.puesto');

    this.aplicarFiltrosFecha(query, filtros);
    return query.getRawMany();
  }

  private construirQueryEscopada(dataScope: DataScope): SelectQueryBuilder<Asistencia> {
    const query = this.asistenciaRepo
      .createQueryBuilder('asistencia')
      .leftJoin('asistencia.empleado', 'empleado')
      .leftJoin('empleado.antro', 'antro');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('empleado.antroId IN (:...antroIds)', { antroIds });
    }

    return query;
  }

  private aplicarFiltrosFecha(query: SelectQueryBuilder<Asistencia>, filtros: { desde?: string; hasta?: string }): void {
    if (filtros.desde) query.andWhere('asistencia.fecha >= :desde', { desde: filtros.desde });
    if (filtros.hasta) query.andWhere('asistencia.fecha <= :hasta', { hasta: filtros.hasta });
  }
}
