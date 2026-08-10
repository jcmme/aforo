import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Antro } from './entities/antro.entity';
import { UsuarioAntro, AsignacionEstado } from '../rbac/entities/usuario-antro.entity';
import { RolAlcanceTipo } from '../rbac/entities/rol.entity';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

@Injectable()
export class AntrosService {
  constructor(
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    @InjectRepository(UsuarioAntro)
    private readonly usuarioAntroRepo: Repository<UsuarioAntro>,
  ) {}

  /**
   * No pasa por el motor de permisos (no es una acción de negocio, es
   * "en qué antros opero"), pero sí respeta la misma cascada: un rol de
   * alcance corporativo ve todos los antros del corporativo, uno de
   * alcance antro solo ve los suyos.
   */
  async listarAccesibles(usuario: UsuarioAutenticado): Promise<Antro[]> {
    const asignaciones = await this.usuarioAntroRepo.find({
      where: { usuarioId: usuario.id, estado: AsignacionEstado.ACTIVO },
      relations: ['rol', 'antro'],
    });

    const tieneAlcanceCorporativo = asignaciones.some((a) => a.rol.alcanceTipo === RolAlcanceTipo.CORPORATIVO);
    if (tieneAlcanceCorporativo) {
      return this.antroRepo.find({ where: { corporativoId: usuario.corporativoId }, order: { nombre: 'ASC' } });
    }

    const antros = asignaciones.map((a) => a.antro).filter((antro): antro is Antro => antro !== null);
    return antros.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
}
