import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NominaPeriodo } from './entities/nomina-periodo.entity';
import { NominaDetalle } from './entities/nomina-detalle.entity';
import { Empleado } from './entities/empleado.entity';
import { CrearNominaPeriodoDto } from './dto/crear-nomina-periodo.dto';
import { RegistrarNominaDetalleDto } from './dto/registrar-nomina-detalle.dto';
import { DataScope } from '../../core/rbac/data-scope';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { AuditoriaService } from '../../core/auditoria/auditoria.service';
import { AntroGuardService } from '../../core/rbac/antro-guard.service';

@Injectable()
export class NominaService {
  constructor(
    @InjectRepository(NominaPeriodo)
    private readonly periodoRepo: Repository<NominaPeriodo>,
    @InjectRepository(NominaDetalle)
    private readonly detalleRepo: Repository<NominaDetalle>,
    @InjectRepository(Empleado)
    private readonly empleadoRepo: Repository<Empleado>,
    private readonly auditoria: AuditoriaService,
    private readonly antroGuard: AntroGuardService,
  ) {}

  async crearPeriodo(dto: CrearNominaPeriodoDto, dataScope: DataScope): Promise<NominaPeriodo> {
    await this.antroGuard.verificarAcceso(dto.antroId, dataScope);

    const periodo = await this.periodoRepo.save(
      this.periodoRepo.create({
        antroId: dto.antroId,
        periodoInicio: dto.periodoInicio,
        periodoFin: dto.periodoFin,
      }),
    );

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'nomina.periodo_crear',
      entidad: 'nomina_periodo',
      entidadId: periodo.id,
      detalle: { antroId: dto.antroId, periodoInicio: dto.periodoInicio, periodoFin: dto.periodoFin },
    });

    return periodo;
  }

  async listarPeriodos(dataScope: DataScope, antroIdFiltro?: string): Promise<NominaPeriodo[]> {
    const query = this.periodoRepo.createQueryBuilder('periodo').leftJoinAndSelect('periodo.antro', 'antro');

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('antro.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
      if (antroIdFiltro) {
        query.andWhere('periodo.antroId = :antroIdFiltro', { antroIdFiltro });
      }
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('periodo.antroId IN (:...antroIds)', { antroIds });
    }

    return query.orderBy('periodo.periodoInicio', 'DESC').getMany();
  }

  async registrarDetalle(periodoId: string, dto: RegistrarNominaDetalleDto, dataScope: DataScope): Promise<NominaDetalle> {
    const periodo = await this.periodoRepo.findOne({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundException('Periodo de nómina no encontrado.');
    await this.antroGuard.verificarAcceso(periodo.antroId, dataScope);

    const empleado = await this.empleadoRepo.findOne({ where: { id: dto.empleadoId } });
    if (!empleado || empleado.antroId !== periodo.antroId) {
      throw new BadRequestException('El empleado no pertenece al antro de este periodo.');
    }

    const percepciones = dto.percepciones;
    const deducciones = dto.deducciones ?? 0;
    const totalPagar = percepciones - deducciones;

    let detalle = await this.detalleRepo.findOne({ where: { nominaPeriodoId: periodoId, empleadoId: dto.empleadoId } });
    if (!detalle) {
      detalle = this.detalleRepo.create({ nominaPeriodoId: periodoId, empleadoId: dto.empleadoId });
    }

    detalle.horasTrabajadas = dto.horasTrabajadas.toFixed(2);
    detalle.faltas = dto.faltas ?? 0;
    detalle.percepciones = percepciones.toFixed(2);
    detalle.deducciones = deducciones.toFixed(2);
    detalle.totalPagar = totalPagar.toFixed(2);

    const guardado = await this.detalleRepo.save(detalle);

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'nomina.detalle_registrar',
      entidad: 'nomina_detalle',
      entidadId: guardado.id,
      detalle: { empleadoId: dto.empleadoId, periodoId, totalPagar: guardado.totalPagar },
    });

    return guardado;
  }

  async listarDetalle(periodoId: string, dataScope: DataScope): Promise<NominaDetalle[]> {
    const periodo = await this.periodoRepo.findOne({ where: { id: periodoId } });
    if (!periodo) throw new NotFoundException('Periodo de nómina no encontrado.');
    await this.antroGuard.verificarAcceso(periodo.antroId, dataScope);

    return this.detalleRepo.find({ where: { nominaPeriodoId: periodoId }, relations: ['empleado'] });
  }

  /** Fuente de datos de la plantilla "nomina.export_periodo": una fila por trabajador, totales del periodo. */
  async resumenParaExport(dataScope: DataScope, filtros: { periodoId?: string }): Promise<Record<string, unknown>[]> {
    if (!filtros.periodoId) {
      throw new BadRequestException('Falta el filtro "periodoId".');
    }
    const detalles = await this.listarDetalle(filtros.periodoId, dataScope);
    return detalles.map((d) => ({
      empleado: d.empleado.nombre,
      puesto: d.empleado.puesto,
      horasTrabajadas: d.horasTrabajadas,
      faltas: d.faltas,
      percepciones: d.percepciones,
      deducciones: d.deducciones,
      totalPagar: d.totalPagar,
    }));
  }
}
