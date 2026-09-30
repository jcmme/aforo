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
import { Auditoria } from '../auditoria/entities/auditoria.entity';
import { AntroFeature } from '../feature-flags/entities/antro-feature.entity';

/** Una fila del widget "Uso de los clientes" (vista de plataforma). */
export interface UsoCliente {
  corporativoId: string;
  nombreComercial: string;
  antros: number;
  modulosActivos: number;
  acciones: number;
  usuariosActivos: number;
  ultimaActividad: string | null;
}

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
    @InjectRepository(Auditoria)
    private readonly auditoriaRepo: Repository<Auditoria>,
    @InjectRepository(AntroFeature)
    private readonly antroFeatureRepo: Repository<AntroFeature>,
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

  /**
   * Qué tanto usa cada cliente la app, para el widget de la vista de
   * plataforma. La actividad sale de la auditoría, que es lo único que ya
   * registra "alguien hizo algo" de forma pareja en todos los módulos.
   */
  async resumirUso(dias = 30): Promise<UsoCliente[]> {
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000);

    const [corporativos, antros, modulos, actividad] = await Promise.all([
      this.corporativoRepo.find(),
      this.antroRepo
        .createQueryBuilder('a')
        .select('a.corporativoId', 'corporativoId')
        .addSelect('COUNT(*)', 'total')
        .groupBy('a.corporativoId')
        .getRawMany<{ corporativoId: string; total: string }>(),
      this.antroFeatureRepo
        .createQueryBuilder('af')
        .innerJoin('af.antro', 'a')
        .innerJoin('af.feature', 'f')
        .select('a.corporativoId', 'corporativoId')
        .addSelect('COUNT(DISTINCT f.codigo)', 'total')
        .where('af.activo = true')
        .andWhere("f.codigo LIKE 'modulo.%'")
        .groupBy('a.corporativoId')
        .getRawMany<{ corporativoId: string; total: string }>(),
      this.auditoriaRepo
        .createQueryBuilder('au')
        .select('au.corporativoId', 'corporativoId')
        .addSelect('COUNT(*)', 'acciones')
        .addSelect('COUNT(DISTINCT au.actorUsuarioId)', 'usuarios')
        .addSelect('MAX(au.createdAt)', 'ultima')
        .where('au.createdAt >= :desde', { desde })
        .groupBy('au.corporativoId')
        .getRawMany<{ corporativoId: string; acciones: string; usuarios: string; ultima: Date }>(),
    ]);

    const porCorporativo = <T extends { corporativoId: string }>(filas: T[]) => new Map(filas.map((f) => [f.corporativoId, f]));
    const antrosPor = porCorporativo(antros);
    const modulosPor = porCorporativo(modulos);
    const actividadPor = porCorporativo(actividad);

    return corporativos
      .map((c) => {
        const uso = actividadPor.get(c.id);
        return {
          corporativoId: c.id,
          nombreComercial: c.nombreComercial,
          antros: Number(antrosPor.get(c.id)?.total ?? 0),
          modulosActivos: Number(modulosPor.get(c.id)?.total ?? 0),
          acciones: Number(uso?.acciones ?? 0),
          usuariosActivos: Number(uso?.usuarios ?? 0),
          ultimaActividad: uso?.ultima ? new Date(uso.ultima).toISOString() : null,
        };
      })
      .sort((a, b) => b.acciones - a.acciones || a.nombreComercial.localeCompare(b.nombreComercial));
  }
}
