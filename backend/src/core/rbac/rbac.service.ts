import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsuarioAntro, AsignacionEstado } from './entities/usuario-antro.entity';
import { Permiso } from './entities/permiso.entity';
import { PermissionScope, alcanceMasAmplio } from './permission-scope.enum';
import { DataScope } from './data-scope';

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
  ) {}

  /**
   * Resuelve qué puede ver un usuario para un permiso dado, agregando
   * todas sus asignaciones activas (puede tener el mismo permiso en
   * varios antros, o de forma corporativa).
   */
  async resolveDataScope(usuarioId: string, corporativoId: string, permisoCodigo: string): Promise<DataScope | null> {
    const asignaciones = await this.usuarioAntroRepo.find({
      where: { usuarioId, estado: AsignacionEstado.ACTIVO },
      relations: ['rol', 'rol.rolPermisos', 'rol.rolPermisos.permiso'],
    });

    // Super Admin ve y hace todo dentro de su corporativo sin necesitar una
    // fila de RolPermiso por cada permiso — incluidos los que un módulo
    // futuro declare y todavía no se le hayan asignado explícitamente.
    if (asignaciones.some((a) => a.rol.esSuperAdmin)) {
      return { usuarioId, corporativoId, alcance: PermissionScope.CORPORATIVO, antroIds: null };
    }

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
      usuarioId,
      corporativoId,
      alcance,
      antroIds: alcance === PermissionScope.CORPORATIVO ? null : Array.from(antroIds),
    };
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
