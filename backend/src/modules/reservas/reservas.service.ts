import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Reserva } from './entities/reserva.entity';
import { CrearReservaDto } from './dto/crear-reserva.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';
import { AntroGuardService } from '../../core/rbac/antro-guard.service';

@Injectable()
export class ReservasService {
  constructor(
    @InjectRepository(Reserva)
    private readonly reservaRepo: Repository<Reserva>,
    private readonly auditoria: AuditoriaService,
    private readonly antroGuard: AntroGuardService,
  ) {}

  async crear(dto: CrearReservaDto, dataScope: DataScope): Promise<Reserva> {
    await this.antroGuard.verificarAcceso(dto.antroId, dataScope);

    const reserva = this.reservaRepo.create({
      antroId: dto.antroId,
      rpUsuarioId: dataScope.usuarioId,
      clienteNombre: dto.clienteNombre,
      clienteTelefono: dto.clienteTelefono ?? null,
      fechaEvento: dto.fechaEvento,
      numPersonas: dto.numPersonas,
      notas: dto.notas ?? null,
    });

    const guardada = await this.reservaRepo.save(reserva);

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'reserva.crear',
      entidad: 'reserva',
      entidadId: guardada.id,
      detalle: { antroId: dto.antroId, clienteNombre: dto.clienteNombre, fechaEvento: dto.fechaEvento },
    });

    return guardada;
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

  /** Fuente de datos de la plantilla "reservas.export_lista" (ver reservas.module-definition.ts): una fila por reserva, para imprimir en la puerta. */
  async listarParaExport(dataScope: DataScope, filtros: { antroId?: string; fecha?: string }): Promise<Record<string, unknown>[]> {
    const query = this.reservaRepo
      .createQueryBuilder('reserva')
      .leftJoin('reserva.antro', 'antro')
      .leftJoin('reserva.rpUsuario', 'rp')
      .select('antro.nombre', 'antro')
      .addSelect('reserva.clienteNombre', 'cliente')
      .addSelect('reserva.clienteTelefono', 'telefono')
      .addSelect('reserva.numPersonas', 'personas')
      .addSelect('reserva.fechaEvento', 'fecha')
      .addSelect('rp.nombre', 'rp');

    this.aplicarAlcance(query, dataScope, filtros.antroId);
    if (filtros.fecha) {
      query.andWhere('reserva.fechaEvento = :fecha', { fecha: filtros.fecha });
    }

    return query.orderBy('reserva.fechaEvento', 'ASC').addOrderBy('reserva.clienteNombre', 'ASC').getRawMany();
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
}
