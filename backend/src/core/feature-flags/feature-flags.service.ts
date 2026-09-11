import { NotFoundException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feature } from './entities/feature.entity';
import { AntroFeature } from './entities/antro-feature.entity';
import { Antro } from '../identidad/entities/antro.entity';
import { Corporativo } from '../identidad/entities/corporativo.entity';
import { AntrosService } from '../identidad/antros.service';
import { AuditoriaService } from '../auditoria/auditoria.service';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

export interface FeaturesActivasPorAntro {
  antroId: string;
  features: string[];
}

export interface AntroAdmin {
  id: string;
  nombre: string;
  corporativoId: string;
  corporativoNombre: string;
}

@Injectable()
export class FeatureFlagsService {
  constructor(
    @InjectRepository(Feature)
    private readonly featureRepo: Repository<Feature>,
    @InjectRepository(AntroFeature)
    private readonly antroFeatureRepo: Repository<AntroFeature>,
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    @InjectRepository(Corporativo)
    private readonly corporativoRepo: Repository<Corporativo>,
    private readonly antrosService: AntrosService,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * No acepta ningún antroId como parámetro: siempre deriva del propio
   * usuario qué antros puede ver (vía AntrosService.listarAccesibles), así
   * que no hay forma de pedir las features de un antro ajeno.
   */
  async obtenerActivasParaUsuario(usuario: UsuarioAutenticado): Promise<FeaturesActivasPorAntro[]> {
    const antros = await this.antrosService.listarAccesibles(usuario);
    if (antros.length === 0) return [];

    const antroIds = antros.map((a) => a.id);
    const activas = await this.antroFeatureRepo.find({
      where: antroIds.map((antroId) => ({ antroId, activo: true })),
      relations: ['feature'],
    });

    return antros.map((antro) => ({
      antroId: antro.id,
      features: activas.filter((af) => af.antroId === antro.id).map((af) => af.feature.codigo),
    }));
  }

  listarCatalogo(): Promise<Feature[]> {
    return this.featureRepo.find({ order: { nombre: 'ASC' } });
  }

  /** Lista plana de todos los corporativos, sin filtrar — solo Super Admin llega aquí (igual que OnboardingService.listarClientes). */
  listarCorporativos(): Promise<Corporativo[]> {
    return this.corporativoRepo.find({ order: { nombreComercial: 'ASC' } });
  }

  /** Todos los antros de todos los corporativos — solo Super Admin llega aquí. */
  async listarAntros(): Promise<AntroAdmin[]> {
    const antros = await this.antroRepo.find({ relations: ['corporativo'], order: { nombre: 'ASC' } });
    return antros.map((antro) => ({
      id: antro.id,
      nombre: antro.nombre,
      corporativoId: antro.corporativoId,
      corporativoNombre: antro.corporativo.nombreComercial,
    }));
  }

  async obtenerEstadoAntro(antroId: string): Promise<Record<string, boolean>> {
    const antro = await this.antroRepo.findOne({ where: { id: antroId } });
    if (!antro) throw new NotFoundException('Ese antro no existe.');

    const catalogo = await this.featureRepo.find();
    const activas = await this.antroFeatureRepo.find({ where: { antroId }, relations: ['feature'] });
    const activasPorCodigo = new Map(activas.map((af) => [af.feature.codigo, af.activo]));

    const estado: Record<string, boolean> = {};
    for (const feature of catalogo) {
      estado[feature.codigo] = activasPorCodigo.get(feature.codigo) ?? false;
    }
    return estado;
  }

  async actualizarFlagAntro(antroId: string, featureCodigo: string, activo: boolean, actor: UsuarioAutenticado): Promise<void> {
    const antro = await this.antroRepo.findOne({ where: { id: antroId } });
    if (!antro) throw new NotFoundException('Ese antro no existe.');

    const feature = await this.featureRepo.findOne({ where: { codigo: featureCodigo } });
    if (!feature) throw new NotFoundException('Esa feature no existe en el catálogo.');

    await this.upsertFlag(antroId, feature.id, activo);

    await this.auditoria.registrar({
      corporativoId: antro.corporativoId,
      actorUsuarioId: actor.id,
      accion: activo ? 'feature.activar' : 'feature.desactivar',
      entidad: 'antro_feature',
      entidadId: antroId,
      detalle: { featureCodigo },
    });
  }

  async actualizarFlagCorporativo(corporativoId: string, featureCodigo: string, activo: boolean, actor: UsuarioAutenticado): Promise<void> {
    const corporativo = await this.corporativoRepo.findOne({ where: { id: corporativoId } });
    if (!corporativo) throw new NotFoundException('Ese corporativo no existe.');

    const feature = await this.featureRepo.findOne({ where: { codigo: featureCodigo } });
    if (!feature) throw new NotFoundException('Esa feature no existe en el catálogo.');

    const antros = await this.antroRepo.find({ where: { corporativoId } });
    for (const antro of antros) {
      await this.upsertFlag(antro.id, feature.id, activo);
    }

    await this.auditoria.registrar({
      corporativoId,
      actorUsuarioId: actor.id,
      accion: activo ? 'feature.activar_corporativo' : 'feature.desactivar_corporativo',
      entidad: 'antro_feature',
      entidadId: corporativoId,
      detalle: { featureCodigo, antrosAfectados: antros.length },
    });
  }

  private async upsertFlag(antroId: string, featureId: string, activo: boolean): Promise<void> {
    const existente = await this.antroFeatureRepo.findOne({ where: { antroId, featureId } });
    if (existente) {
      existente.activo = activo;
      await this.antroFeatureRepo.save(existente);
    } else {
      await this.antroFeatureRepo.save(this.antroFeatureRepo.create({ antroId, featureId, activo }));
    }
  }
}
