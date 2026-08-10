import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Reserva } from '../reservas/entities/reserva.entity';
import { Requisicion, RequisicionEstado } from '../requisiciones/entities/requisicion.entity';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';

export interface FiltrosMetricas {
  desde?: string;
  hasta?: string;
}

/**
 * No tiene entidad propia: lee Reserva y Requisicion, que ya existen.
 * Un panel de métricas es lectura agregada, no un dominio de negocio nuevo.
 */
@Injectable()
export class MetricasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    @InjectRepository(Requisicion)
    private readonly requisicionRepo: Repository<Requisicion>,
  ) {}

  async resumenPorAntro(dataScope: DataScope, filtros: FiltrosMetricas): Promise<Record<string, unknown>[]> {
    const reservasQuery = this.reservaRepo
      .createQueryBuilder('reserva')
      .leftJoin('reserva.antro', 'antro')
      .select('antro.id', 'antroId')
      .addSelect('antro.nombre', 'antro')
      .addSelect('COUNT(*)', 'totalReservas')
      .addSelect(`COUNT(*) FILTER (WHERE reserva.estado = 'confirmada')`, 'confirmadas')
      .addSelect(`COUNT(*) FILTER (WHERE reserva.estado = 'no_show')`, 'noShows')
      .groupBy('antro.id')
      .addGroupBy('antro.nombre');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      reservasQuery.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      reservasQuery.andWhere('reserva.antroId IN (:...antroIds)', { antroIds });
    }
    if (filtros.desde) reservasQuery.andWhere('reserva.fechaEvento >= :desde', { desde: filtros.desde });
    if (filtros.hasta) reservasQuery.andWhere('reserva.fechaEvento <= :hasta', { hasta: filtros.hasta });

    const gastosQuery = this.requisicionRepo
      .createQueryBuilder('requisicion')
      .leftJoin('requisicion.antro', 'antro')
      .select('antro.id', 'antroId')
      .addSelect('COALESCE(SUM(requisicion.montoResuelto), 0)', 'gastosAprobados')
      .where('requisicion.estado = :estado', { estado: RequisicionEstado.APROBADA })
      .groupBy('antro.id');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      gastosQuery.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      gastosQuery.andWhere('requisicion.antroId IN (:...antroIds)', { antroIds });
    }
    if (filtros.desde) gastosQuery.andWhere('requisicion.fechaGastoProgramada >= :desde', { desde: filtros.desde });
    if (filtros.hasta) gastosQuery.andWhere('requisicion.fechaGastoProgramada <= :hasta', { hasta: filtros.hasta });

    const [filasReservas, filasGastos] = await Promise.all([reservasQuery.getRawMany(), gastosQuery.getRawMany()]);
    const gastosPorAntroId = new Map(filasGastos.map((f) => [f.antroId, f.gastosAprobados]));

    return filasReservas.map((f) => ({
      antro: f.antro,
      totalReservas: f.totalReservas,
      confirmadas: f.confirmadas,
      noShows: f.noShows,
      gastosAprobados: gastosPorAntroId.get(f.antroId) ?? '0.00',
    }));
  }
}
