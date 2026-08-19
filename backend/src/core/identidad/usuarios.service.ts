import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario, UsuarioEstado } from './entities/usuario.entity';
import { Antro } from './entities/antro.entity';
import { UsuarioAntro, AsignacionEstado } from '../rbac/entities/usuario-antro.entity';
import { Rol } from '../rbac/entities/rol.entity';
import { CrearUsuarioDto, ROLES_CREABLES } from './dto/crear-usuario.dto';
import { DataScope } from '../rbac/data-scope';
import { PermissionScope } from '../rbac/permission-scope.enum';
import { AuditoriaService } from '../auditoria/auditoria.service';

export interface CuentaSecundaria {
  id: string;
  nombre: string;
  email: string;
  estado: UsuarioEstado;
  rol: string;
  antroId: string | null;
  antro: string | null;
}

/**
 * "Cuenta general del antro" (Gerente de Antro) y cuentas corporativas
 * (Dueño, Gerente General) dan de alta y administran aquí sus cuentas
 * secundarias: Gerente de Antro, RP y Hostess — nunca Dueño, Gerente
 * General ni Super Admin, que se quedan fuera de este endpoint a propósito.
 */
@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioAntro)
    private readonly usuarioAntroRepo: Repository<UsuarioAntro>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    private readonly auditoria: AuditoriaService,
  ) {}

  async crear(dto: CrearUsuarioDto, dataScope: DataScope): Promise<Usuario> {
    if (dataScope.alcance !== PermissionScope.CORPORATIVO && !dataScope.antroIds?.includes(dto.antroId)) {
      throw new ForbiddenException('No tienes acceso a ese antro.');
    }

    const antro = await this.antroRepo.findOne({ where: { id: dto.antroId } });
    if (!antro || antro.corporativoId !== dataScope.corporativoId) {
      throw new ForbiddenException('Ese antro no pertenece a tu corporativo.');
    }

    const existente = await this.usuarioRepo.findOne({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const rol = await this.rolRepo.findOne({ where: { nombre: dto.rol } });
    if (!rol) {
      throw new BadRequestException('Rol no válido.');
    }

    const usuario = await this.usuarioRepo.save(
      this.usuarioRepo.create({
        corporativoId: dataScope.corporativoId,
        nombre: dto.nombre,
        email: dto.email,
        passwordHash: await bcrypt.hash(dto.passwordInicial, 10),
        estado: UsuarioEstado.ACTIVO,
      }),
    );

    await this.usuarioAntroRepo.save(
      this.usuarioAntroRepo.create({
        usuarioId: usuario.id,
        antroId: dto.antroId,
        rolId: rol.id,
        estado: AsignacionEstado.ACTIVO,
      }),
    );

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'usuario.crear',
      entidad: 'usuario',
      entidadId: usuario.id,
      detalle: { rol: dto.rol, antroId: dto.antroId, email: dto.email },
    });

    return usuario;
  }

  async listar(dataScope: DataScope): Promise<CuentaSecundaria[]> {
    const query = this.usuarioAntroRepo
      .createQueryBuilder('ua')
      .leftJoinAndSelect('ua.usuario', 'usuario')
      .leftJoinAndSelect('ua.rol', 'rol')
      .leftJoinAndSelect('ua.antro', 'antro')
      .where('rol.nombre IN (:...roles)', { roles: ROLES_CREABLES });

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      query.andWhere('usuario.corporativoId = :corporativoId', { corporativoId: dataScope.corporativoId });
    } else {
      const antroIds = dataScope.antroIds?.length ? dataScope.antroIds : [null];
      query.andWhere('ua.antroId IN (:...antroIds)', { antroIds });
    }

    const asignaciones = await query.orderBy('usuario.nombre', 'ASC').getMany();
    return asignaciones.map((ua) => ({
      id: ua.usuario.id,
      nombre: ua.usuario.nombre,
      email: ua.usuario.email,
      estado: ua.usuario.estado,
      rol: ua.rol.nombre,
      antroId: ua.antroId,
      antro: ua.antro?.nombre ?? null,
    }));
  }

  async cambiarEstado(usuarioId: string, estado: UsuarioEstado, dataScope: DataScope): Promise<void> {
    const asignacion = await this.usuarioAntroRepo.findOne({
      where: { usuarioId },
      relations: ['rol', 'usuario'],
    });
    if (!asignacion || !ROLES_CREABLES.includes(asignacion.rol.nombre as (typeof ROLES_CREABLES)[number])) {
      throw new NotFoundException('Cuenta no encontrada.');
    }

    if (dataScope.alcance === PermissionScope.CORPORATIVO) {
      if (asignacion.usuario.corporativoId !== dataScope.corporativoId) {
        throw new ForbiddenException('Esa cuenta no pertenece a tu corporativo.');
      }
    } else if (!asignacion.antroId || !dataScope.antroIds?.includes(asignacion.antroId)) {
      throw new ForbiddenException('No tienes acceso a esa cuenta.');
    }

    asignacion.usuario.estado = estado;
    await this.usuarioRepo.save(asignacion.usuario);

    await this.auditoria.registrar({
      corporativoId: dataScope.corporativoId,
      actorUsuarioId: dataScope.usuarioId,
      accion: 'usuario.estado_cambiado',
      entidad: 'usuario',
      entidadId: usuarioId,
      detalle: { estado },
    });
  }
}
