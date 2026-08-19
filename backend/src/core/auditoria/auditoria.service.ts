import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Auditoria } from './entities/auditoria.entity';
import { DataScope } from '../rbac/data-scope';

export interface RegistrarAuditoriaParams {
  corporativoId: string;
  actorUsuarioId: string;
  accion: string;
  entidad: string;
  entidadId?: string;
  detalle?: Record<string, unknown>;
}

@Injectable()
export class AuditoriaService {
  constructor(
    @InjectRepository(Auditoria)
    private readonly auditoriaRepo: Repository<Auditoria>,
  ) {}

  async registrar(params: RegistrarAuditoriaParams): Promise<void> {
    await this.auditoriaRepo.save(
      this.auditoriaRepo.create({
        corporativoId: params.corporativoId,
        actorUsuarioId: params.actorUsuarioId,
        accion: params.accion,
        entidad: params.entidad,
        entidadId: params.entidadId ?? null,
        detalle: params.detalle ?? null,
      }),
    );
  }

  /** Solo llega aquí quien tiene "auditoria.ver" — en la práctica, únicamente Super Admin (ver seed.ts). */
  async listar(dataScope: DataScope): Promise<Auditoria[]> {
    return this.auditoriaRepo.find({
      where: { corporativoId: dataScope.corporativoId },
      relations: ['actorUsuario'],
      order: { createdAt: 'DESC' },
      take: 300,
    });
  }
}
