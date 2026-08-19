import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Corporativo, CorporativoEstado } from '../identidad/entities/corporativo.entity';
import { Antro, AntroEstadoOperativo } from '../identidad/entities/antro.entity';
import { Usuario, UsuarioEstado } from '../identidad/entities/usuario.entity';
import { UsuarioAntro, AsignacionEstado } from '../rbac/entities/usuario-antro.entity';
import { Rol } from '../rbac/entities/rol.entity';
import { CrearClienteDto } from './dto/crear-cliente.dto';
import { AuditoriaService } from '../auditoria/auditoria.service';

@Injectable()
export class OnboardingService {
  constructor(
    @InjectRepository(Corporativo)
    private readonly corporativoRepo: Repository<Corporativo>,
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(UsuarioAntro)
    private readonly usuarioAntroRepo: Repository<UsuarioAntro>,
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    private readonly auditoria: AuditoriaService,
  ) {}

  /**
   * A propósito, esta es la única operación de todo el backend que crea un
   * Corporativo — todo lo demás vive dentro del corporativo del que llama.
   * Por eso no usa DataScope para nada de negocio, solo para saber quién
   * es el actor (queda registrado en la auditoría del cliente nuevo).
   */
  async crearCliente(dto: CrearClienteDto, actorUsuarioId: string) {
    const existente = await this.usuarioRepo.findOne({ where: { email: dto.duenoEmail } });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese correo.');
    }

    const rolDueno = await this.rolRepo.findOne({ where: { nombre: 'Dueño' } });
    if (!rolDueno) {
      throw new BadRequestException('Falta sembrar los roles base ("npm run seed").');
    }

    const corporativo = await this.corporativoRepo.save(
      this.corporativoRepo.create({ nombreComercial: dto.nombreComercial, estado: CorporativoEstado.ACTIVO }),
    );

    const antro = await this.antroRepo.save(
      this.antroRepo.create({
        corporativoId: corporativo.id,
        nombre: dto.antroNombre,
        ciudad: dto.antroCiudad ?? null,
        estadoOperativo: AntroEstadoOperativo.ACTIVO,
      }),
    );

    const dueno = await this.usuarioRepo.save(
      this.usuarioRepo.create({
        corporativoId: corporativo.id,
        nombre: dto.duenoNombre,
        email: dto.duenoEmail,
        passwordHash: await bcrypt.hash(dto.duenoPasswordInicial, 10),
        estado: UsuarioEstado.ACTIVO,
      }),
    );

    await this.usuarioAntroRepo.save(
      this.usuarioAntroRepo.create({
        usuarioId: dueno.id,
        antroId: null,
        rolId: rolDueno.id,
        estado: AsignacionEstado.ACTIVO,
      }),
    );

    await this.auditoria.registrar({
      corporativoId: corporativo.id,
      actorUsuarioId,
      accion: 'cliente.alta',
      entidad: 'corporativo',
      entidadId: corporativo.id,
      detalle: { nombreComercial: dto.nombreComercial, antroNombre: dto.antroNombre, duenoEmail: dto.duenoEmail },
    });

    return {
      corporativo: { id: corporativo.id, nombreComercial: corporativo.nombreComercial },
      antro: { id: antro.id, nombre: antro.nombre },
      dueno: { id: dueno.id, nombre: dueno.nombre, email: dueno.email },
    };
  }

  listarClientes(): Promise<Corporativo[]> {
    return this.corporativoRepo.find({ order: { createdAt: 'DESC' } });
  }
}
