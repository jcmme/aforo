import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Usuario } from '../../identidad/entities/usuario.entity';
import { Antro } from '../../identidad/entities/antro.entity';
import { Rol } from './rol.entity';

export enum AsignacionEstado {
  ACTIVO = 'activo',
  REVOCADO = 'revocado',
}

/**
 * Une un usuario a un rol, en el contexto de un antro (rol.alcanceTipo = 'antro')
 * o sin antro para roles de alcance 'corporativo' (antro = null).
 */
@Entity('usuario_antro')
export class UsuarioAntro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Usuario, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @Column({ name: 'usuario_id' })
  usuarioId: string;

  @ManyToOne(() => Antro, { eager: true, nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro | null;

  @Column({ name: 'antro_id', type: 'uuid', nullable: true })
  antroId: string | null;

  @ManyToOne(() => Rol, { eager: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rol_id' })
  rol: Rol;

  @Column({ name: 'rol_id' })
  rolId: string;

  @Column({ type: 'enum', enum: AsignacionEstado, default: AsignacionEstado.ACTIVO })
  estado: AsignacionEstado;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
