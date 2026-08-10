import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { ModuleRegistryService } from '../../core/module-registry/module-registry.service';
import { RbacService } from '../../core/rbac/rbac.service';
import { sincronizarPermisosDesdeRegistro } from '../../core/module-registry/sincronizar-permisos.util';
import { Rol, RolAlcanceTipo } from '../../core/rbac/entities/rol.entity';
import { Permiso } from '../../core/rbac/entities/permiso.entity';
import { RolPermiso } from '../../core/rbac/entities/rol-permiso.entity';
import { PermissionScope } from '../../core/rbac/permission-scope.enum';
import { Corporativo, CorporativoEstado } from '../../core/identidad/entities/corporativo.entity';
import { Antro, AntroEstadoOperativo } from '../../core/identidad/entities/antro.entity';
import { Usuario, UsuarioEstado } from '../../core/identidad/entities/usuario.entity';
import { UsuarioAntro, AsignacionEstado } from '../../core/rbac/entities/usuario-antro.entity';

const PASSWORD_DEMO = 'cambia-esta-password';

async function seed(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const dataSource = app.get(DataSource);

  console.log('Sincronizando catálogo de permisos declarado por los módulos...');
  await sincronizarPermisosDesdeRegistro(app.get(ModuleRegistryService), app.get(RbacService));

  const rolRepo = dataSource.getRepository(Rol);
  const permisoRepo = dataSource.getRepository(Permiso);
  const rolPermisoRepo = dataSource.getRepository(RolPermiso);
  const corporativoRepo = dataSource.getRepository(Corporativo);
  const antroRepo = dataSource.getRepository(Antro);
  const usuarioRepo = dataSource.getRepository(Usuario);
  const usuarioAntroRepo = dataSource.getRepository(UsuarioAntro);

  console.log('Sembrando roles base...');
  const rolesBase: { nombre: string; alcanceTipo: RolAlcanceTipo }[] = [
    { nombre: 'Dueño', alcanceTipo: RolAlcanceTipo.CORPORATIVO },
    { nombre: 'Gerente General', alcanceTipo: RolAlcanceTipo.CORPORATIVO },
    { nombre: 'Gerente de Antro', alcanceTipo: RolAlcanceTipo.ANTRO },
    { nombre: 'RP', alcanceTipo: RolAlcanceTipo.ANTRO },
  ];

  const roles: Record<string, Rol> = {};
  for (const base of rolesBase) {
    let rol = await rolRepo.findOne({ where: { nombre: base.nombre } });
    if (!rol) {
      rol = await rolRepo.save(rolRepo.create({ ...base, esRolSistema: true }));
    }
    roles[base.nombre] = rol;
  }

  console.log('Asignando permisos base a los roles...');
  const asignacionesPermiso: { rol: string; permisoCodigo: string; alcance: PermissionScope }[] = [
    { rol: 'RP', permisoCodigo: 'reservas.crear', alcance: PermissionScope.PROPIO },
    { rol: 'RP', permisoCodigo: 'reservas.ver', alcance: PermissionScope.PROPIO },
    { rol: 'Gerente de Antro', permisoCodigo: 'reservas.ver', alcance: PermissionScope.ANTRO },
    { rol: 'Gerente General', permisoCodigo: 'reservas.ver', alcance: PermissionScope.CORPORATIVO },
    { rol: 'Dueño', permisoCodigo: 'reservas.ver', alcance: PermissionScope.CORPORATIVO },
  ];

  for (const asignacion of asignacionesPermiso) {
    const permiso = await permisoRepo.findOne({ where: { codigo: asignacion.permisoCodigo } });
    if (!permiso) {
      console.warn(`  Permiso "${asignacion.permisoCodigo}" no existe en el catálogo, se omite.`);
      continue;
    }
    const rol = roles[asignacion.rol];
    const existente = await rolPermisoRepo.findOne({ where: { rolId: rol.id, permisoId: permiso.id } });
    if (!existente) {
      await rolPermisoRepo.save(rolPermisoRepo.create({ rolId: rol.id, permisoId: permiso.id, alcance: asignacion.alcance }));
    }
  }

  console.log('Sembrando corporativo/antro/usuarios de desarrollo...');
  let corporativo = await corporativoRepo.findOne({ where: { nombreComercial: 'Antros Demo Puebla' } });
  if (!corporativo) {
    corporativo = await corporativoRepo.save(
      corporativoRepo.create({ nombreComercial: 'Antros Demo Puebla', estado: CorporativoEstado.ACTIVO }),
    );
  }

  let antro = await antroRepo.findOne({ where: { corporativoId: corporativo.id, nombre: 'Antro Centro' } });
  if (!antro) {
    antro = await antroRepo.save(
      antroRepo.create({
        corporativoId: corporativo.id,
        nombre: 'Antro Centro',
        ciudad: 'Puebla',
        estadoOperativo: AntroEstadoOperativo.ACTIVO,
      }),
    );
  }

  const usuariosDemo: { nombre: string; email: string; rol: string; antro: Antro | null }[] = [
    { nombre: 'Gerente General Demo', email: 'gerente.general@aforo.dev', rol: 'Gerente General', antro: null },
    { nombre: 'Gerente Antro Centro', email: 'gerente.antro@aforo.dev', rol: 'Gerente de Antro', antro },
    { nombre: 'RP Demo', email: 'rp@aforo.dev', rol: 'RP', antro },
  ];

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);

  for (const datos of usuariosDemo) {
    let usuario = await usuarioRepo.findOne({ where: { email: datos.email } });
    if (!usuario) {
      usuario = await usuarioRepo.save(
        usuarioRepo.create({
          corporativoId: corporativo.id,
          nombre: datos.nombre,
          email: datos.email,
          passwordHash,
          estado: UsuarioEstado.ACTIVO,
        }),
      );
    }

    const rolId = roles[datos.rol].id;
    const asignacionExistente = await usuarioAntroRepo.findOne({ where: { usuarioId: usuario.id, rolId } });
    if (!asignacionExistente) {
      await usuarioAntroRepo.save(
        usuarioAntroRepo.create({
          usuarioId: usuario.id,
          antroId: datos.antro?.id ?? null,
          rolId,
          estado: AsignacionEstado.ACTIVO,
        }),
      );
    }
    console.log(`  ${datos.email} / ${PASSWORD_DEMO}  (${datos.rol})`);
  }

  console.log('Listo. Datos de desarrollo sembrados.');
  await app.close();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
