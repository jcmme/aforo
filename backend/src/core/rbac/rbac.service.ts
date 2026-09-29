import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { UsuarioAntro, AsignacionEstado } from './entities/usuario-antro.entity';
import { Permiso } from './entities/permiso.entity';
import { Antro } from '../identidad/entities/antro.entity';
import { AntroFeature } from '../feature-flags/entities/antro-feature.entity';
import { PermissionScope, alcanceMasAmplio } from './permission-scope.enum';
import { DataScope } from './data-scope';
import { PERMISOS_PLATAFORMA, featureDelModulo } from './permisos-plataforma';
import { UsuarioAutenticado } from '../auth/jwt-payload.interface';

export interface PermisoDeclarado {
  codigo: string;
  modulo: string;
  descripcion?: string;
}

@Injectable()
export class RbacService {
  constructor(
    @InjectRepository(UsuarioAntro)
    private readonly usuarioAntroRepo: Repository<UsuarioAntro>,
    @InjectRepository(Permiso)
    private readonly permisoRepo: Repository<Permiso>,
    @InjectRepository(Antro)
    private readonly antroRepo: Repository<Antro>,
    @InjectRepository(AntroFeature)
    private readonly antroFeatureRepo: Repository<AntroFeature>,
  ) {}

  async esSuperAdmin(usuarioId: string): Promise<boolean> {
    const asignaciones = await this.usuarioAntroRepo.find({
      where: { usuarioId, estado: AsignacionEstado.ACTIVO },
      relations: ['rol'],
    });
    return asignaciones.some((a) => a.rol.esSuperAdmin);
  }

  /**
   * Resuelve qué puede ver un usuario para un permiso dado: primero según
   * sus roles (o el modo del Súper Admin), y después recortado a los antros
   * que tienen prendido el módulo al que pertenece ese permiso.
   */
  async resolveDataScope(usuario: UsuarioAutenticado, permisoCodigo: string): Promise<DataScope | null> {
    const scope = usuario.esSuperAdmin
      ? this.resolverSuperAdmin(usuario, permisoCodigo)
      : await this.resolverPorRoles(usuario, permisoCodigo);
    if (!scope) return null;
    return this.recortarAlModulo(scope, permisoCodigo);
  }

  /**
   * En su vista propia, el Súper Admin solo tiene los permisos de plataforma.
   * Cuando "entra como" un cliente es al revés: tiene todos los del cliente
   * (sobre ese corporativo, o solo ese antro) y ninguno de plataforma.
   */
  private resolverSuperAdmin(usuario: UsuarioAutenticado, permisoCodigo: string): DataScope | null {
    const base = { usuarioId: usuario.id, corporativoId: usuario.corporativoId };
    const esPlataforma = PERMISOS_PLATAFORMA.has(permisoCodigo);

    if (!usuario.viendoComo) {
      return esPlataforma ? { ...base, alcance: PermissionScope.CORPORATIVO, antroIds: null } : null;
    }
    if (esPlataforma) return null;

    const { antroId } = usuario.viendoComo;
    return antroId
      ? { ...base, alcance: PermissionScope.ANTRO, antroIds: [antroId] }
      : { ...base, alcance: PermissionScope.CORPORATIVO, antroIds: null };
  }

  /** Agrega todas las asignaciones activas (puede tener el mismo permiso en varios antros, o de forma corporativa). */
  private async resolverPorRoles(usuario: UsuarioAutenticado, permisoCodigo: string): Promise<DataScope | null> {
    const asignaciones = await this.usuarioAntroRepo.find({
      where: { usuarioId: usuario.id, estado: AsignacionEstado.ACTIVO },
      relations: ['rol', 'rol.rolPermisos', 'rol.rolPermisos.permiso'],
    });

    let alcance: PermissionScope | null = null;
    const antroIds = new Set<string>();

    for (const asignacion of asignaciones) {
      const grant = asignacion.rol.rolPermisos?.find((rp) => rp.permiso.codigo === permisoCodigo);
      if (!grant) continue;

      alcance = alcance ? alcanceMasAmplio(alcance, grant.alcance) : grant.alcance;

      if (grant.alcance !== PermissionScope.CORPORATIVO && asignacion.antroId) {
        antroIds.add(asignacion.antroId);
      }
    }

    if (!alcance) return null;

    return {
      usuarioId: usuario.id,
      corporativoId: usuario.corporativoId,
      alcance,
      antroIds: alcance === PermissionScope.CORPORATIVO ? null : Array.from(antroIds),
    };
  }

  /**
   * Deja en el scope solo los antros que tienen prendido el módulo del
   * permiso (ver featureDelModulo). Si en un alcance corporativo solo
   * algunos antros lo tienen, baja a alcance ANTRO con esa lista — todos los
   * módulos ya filtran bien por antroIds en ese caso. Sin ninguno → null.
   */
  private async recortarAlModulo(scope: DataScope, permisoCodigo: string): Promise<DataScope | null> {
    const featureCodigo = featureDelModulo(permisoCodigo);
    if (!featureCodigo) return scope;

    const antrosDelScope =
      scope.antroIds ??
      (await this.antroRepo.find({ where: { corporativoId: scope.corporativoId }, select: ['id'] })).map((a) => a.id);
    if (antrosDelScope.length === 0) return null;

    const prendidos = await this.antroFeatureRepo.find({
      where: { antroId: In(antrosDelScope), activo: true, feature: { codigo: featureCodigo } },
      relations: ['feature'],
    });
    const conModulo = new Set(prendidos.map((af) => af.antroId));
    const permitidos = antrosDelScope.filter((id) => conModulo.has(id));

    if (permitidos.length === 0) return null;
    if (scope.antroIds === null && permitidos.length === antrosDelScope.length) return scope;
    if (scope.antroIds === null) return { ...scope, alcance: PermissionScope.ANTRO, antroIds: permitidos };
    return { ...scope, antroIds: permitidos };
  }

  /**
   * Da de alta en el catálogo cualquier permiso que un módulo haya declarado
   * y que todavía no exista en base de datos. Se llama una vez al arrancar
   * la app (ver main.ts) — así un módulo nuevo aparece en el catálogo sin
   * necesitar una migración de datos manual.
   */
  async sincronizarPermisos(permisos: PermisoDeclarado[]): Promise<void> {
    for (const permiso of permisos) {
      const existente = await this.permisoRepo.findOne({ where: { codigo: permiso.codigo } });
      if (!existente) {
        await this.permisoRepo.save(
          this.permisoRepo.create({
            codigo: permiso.codigo,
            modulo: permiso.modulo,
            descripcion: permiso.descripcion ?? null,
          }),
        );
      }
    }
  }
}
