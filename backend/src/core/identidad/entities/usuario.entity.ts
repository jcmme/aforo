import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Corporativo } from './corporativo.entity';

export enum UsuarioEstado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Corporativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'corporativo_id' })
  corporativo: Corporativo;

  @Column({ name: 'corporativo_id' })
  corporativoId: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ length: 150, unique: true })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ type: 'enum', enum: UsuarioEstado, default: UsuarioEstado.ACTIVO })
  estado: UsuarioEstado;

  @Column({ name: 'ultimo_login', type: 'timestamptz', nullable: true })
  ultimoLogin: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
