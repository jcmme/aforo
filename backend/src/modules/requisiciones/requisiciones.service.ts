import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Requisicion, RequisicionEstado } from './entities/requisicion.entity';
import { CrearRequisicionDto } from './dto/crear-requisicion.dto';
import { ResolverRequisicionDto, ResolucionRequisicion } from './dto/resolver-requisicion.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';
import { AntroGuardService } from '../../core/rbac/antro-guard.service';

const MAPA_RESOLUCION: Record<ResolucionRequisicion, RequisicionEstado> = {
  [ResolucionRequisicion.APROBADA]: RequisicionEstado.APROBADA,
  [ResolucionRequisicion.RECHAZADA]: RequisicionEstado.RECHAZADA,
  [ResolucionRequisicion.AJUSTADA]: RequisicionEstado.AJUSTADA,
};

@Injectable()
export class RequisicionesService {
  constructor(
    @InjectRepository(Requisicion)
    private readonly requisicionRepo: Repository<Requisicion>,
    private readonly auditoria: AuditoriaService,
    private readonly antroGuard: AntroGuardService,
  ) {}

  async crear(dto: CrearRequisicionDto, dataScope: DataScope): Promise<Requisicion> {
    await this.antroGuard.verificarAcceso(dto.antroId, dataScope);

    const requisicion = this.requisicionRepo.create({
      antroId: dto.antroId,
      solicitanteUsuarioId: dataScope.usuarioId,
      montoSolicitado: dto.montoSolicitado.toFixed(2),
      destino: dto.destino,
      nota: dto.nota ?? null,
      fechaGastoProgramada: dto.fechaGastoProgramada,
    });

    const guardada = await this.requisicionRepo.save(requisicion);

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'requisicion.crear',
      entidad: 'requisicion',
      entidadId: guardada.id,
      detalle: { antroId: dto.antroId, destino: dto.destino, montoSolicitado: dto.montoSolicitado },
    });

    return guardada;
  }

  async listar(dataScope: DataScope, antroIdFiltro?: string): Promise<Requisicion[]> {
    const query = this.requisicionRepo.createQueryBuilder('requisicion').leftJoinAndSelect('requisicion.antro', 'antro');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
      if (antroIdFiltro) {
        query.andWhere('requisicion.antroId = :antroIdFiltro', { antroIdFiltro });
      }
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('requisicion.antroId IN (:...antroIds)', { antroIds });
    }

    return query.orderBy('requisicion.createdAt', 'DESC').getMany();
  }

  async resolver(id: string, dto: ResolverRequisicionDto, dataScope: DataScope): Promise<Requisicion> {
    const requisicion = await this.requisicionRepo.findOne({ where: { id }, relations: ['antro'] });
    if (!requisicion) {
      throw new NotFoundException('Requisición no encontrada.');
    }
    if (requisicion.antro.corporativoId !== dataScope.corporativoId) {
      throw new ForbiddenException('Esa requisición no pertenece a tu corporativo.');
    }

    requisicion.estado = MAPA_RESOLUCION[dto.estado];
    requisicion.montoResuelto = (dto.montoResuelto ?? Number(requisicion.montoSolicitado)).toFixed(2);
    requisicion.resueltoPorUsuarioId = dataScope.usuarioId;
    requisicion.fechaResolucion = new Date();
    requisicion.notaResolucion = dto.notaResolucion ?? null;

    const guardada = await this.requisicionRepo.save(requisicion);

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'requisicion.resolver',
      entidad: 'requisicion',
      entidadId: guardada.id,
      detalle: { estado: dto.estado, montoResuelto: guardada.montoResuelto },
    });

    return guardada;
  }

  /** Fuente de datos de la plantilla "requisiciones.export" (ver requisiciones.module-definition.ts). */
  async listarParaExport(dataScope: DataScope): Promise<Record<string, unknown>[]> {
    const requisiciones = await this.listar(dataScope);
    return requisiciones.map((r) => ({
      antro: r.antro.nombre,
      destino: r.destino,
      nota: r.nota,
      montoSolicitado: r.montoSolicitado,
      montoResuelto: r.montoResuelto,
      estado: r.estado,
      fechaGastoProgramada: r.fechaGastoProgramada,
    }));
  }
}
