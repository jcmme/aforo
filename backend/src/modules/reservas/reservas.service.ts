import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
  ) {}

  async crear(dto: CrearReservaDto, dataScope: DataScope): Promise<Reserva> {
    this.verificarAccesoAntro(dto.antroId, dataScope);

    const reserva = this.reservaRepo.create({
      antroId: dto.antroId,
      rpUsuarioId: dataScope.usuarioId,
      clienteNombre: dto.clienteNombre,
      clienteTelefono: dto.clienteTelefono ?? null,
      fechaEvento: dto.fechaEvento,
      numPersonas: dto.numPersonas,
      notas: dto.notas ?? null,
    });

    return this.reservaRepo.save(reserva);
  }

  async listar(dataScope: DataScope, antroIdFiltro?: string): Promise<Reserva[]> {
    const query = this.reservaRepo.createQueryBuilder('reserva').leftJoinAndSelect('reserva.antro', 'antro');
    this.aplicarAlcance(query, dataScope, antroIdFiltro);
    return query.orderBy('reserva.fechaEvento', 'DESC').getMany();
  }

  /** Fuente de datos de la plantilla de reporte "reservas.export_rp" (ver reservas.module-definition.ts). */
  async resumenPorRp(dataScope: DataScope): Promise<Record<string, unknown>[]> {
    const query = this.reservaRepo
      .createQueryBuilder('reserva')
      .leftJoin('reserva.rpUsuario', 'rp')
      .leftJoin('reserva.antro', 'antro')
      .select('rp.id', 'rpId')
      .addSelect('rp.nombre', 'rp')
      .addSelect('COUNT(*)', 'totalReservas')
      .addSelect(`COUNT(*) FILTER (WHERE reserva.estado = 'confirmada')`, 'confirmadas')
      .addSelect(`COUNT(*) FILTER (WHERE reserva.estado = 'no_show')`, 'noShows')
      .groupBy('rp.id')
      .addGroupBy('rp.nombre');

    this.aplicarAlcance(query, dataScope);
    return query.getRawMany();
  }

  private aplicarAlcance(query: SelectQueryBuilder<Reserva>, dataScope: DataScope, antroIdFiltro?: string): void {
    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
      if (antroIdFiltro) {
        query.andWhere('reserva.antroId = :antroIdFiltro', { antroIdFiltro });
      }
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('reserva.antroId IN (:...antroIds)', { antroIds });
    }

    if (dataScope.alcance === PermissionScope.PROPIO) {
      query.andWhere('reserva.rpUsuarioId = :usuarioId', { usuarioId: dataScope.usuarioId });
    }
  }

  private verificarAccesoAntro(antroId: string, dataScope: DataScope): void {
    if (dataScope.alcance === PermissionScope.CORPORATIVO) return;
    if (!dataScope.antroIds?.includes(antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }
  }
}
