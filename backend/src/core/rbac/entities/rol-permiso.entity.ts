import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Rol } from './rol.entity';
import { Permiso } from './permiso.entity';
import { PermissionScope } from '../permission-scope.enum';

@Entity('rol_permiso')
export class RolPermiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Rol, (rol) => rol.rolPermisos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ name: 'rol_id' })
  rolId: string;

  @ManyToOne(() => Permiso, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permiso_id' })
  permiso: Permiso;

  @Column({ name: 'permiso_id' })
  permisoId: string;

  @Column({ type: 'enum', enum: PermissionScope })
  alcance: PermissionScope;
}
