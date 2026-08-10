import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RolPermiso } from './rol-permiso.entity';

export enum RolAlcanceTipo {
  ANTRO = 'antro',
  CORPORATIVO = 'corporativo',
}

@Entity('rol')
export class Rol {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  nombre: string;

  @Column({ name: 'alcance_tipo', type: 'enum', enum: RolAlcanceTipo })
  alcanceTipo: RolAlcanceTipo;

  @Column({ name: 'es_rol_sistema', default: false })
  esRolSistema: boolean;

  /** Cualquier usuario con un rol así ve y hace todo dentro de su corporativo, sin necesitar RolPermiso por cada permiso (ver RbacService.resolveDataScope). */
  @Column({ name: 'es_super_admin', default: false })
  esSuperAdmin: boolean;

  @OneToMany(() => RolPermiso, (rolPermiso) => rolPermiso.rol)
  rolPermisos: RolPermiso[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
