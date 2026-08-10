import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Antro } from '../../../core/identidad/entities/antro.entity';
import { Usuario } from '../../../core/identidad/entities/usuario.entity';

export enum ReservaEstado {
  CONFIRMADA = 'confirmada',
  CANCELADA = 'cancelada',
  NO_SHOW = 'no_show',
}

@Entity('reserva')
export class Reserva {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  /** El RP que hizo la reserva — así "propio" en el RBAC se filtra por esta columna. */
  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'rp_usuario_id' })
  rpUsuario: Usuario;

  @Column({ name: 'rp_usuario_id' })
  rpUsuarioId: string;

  @Column({ name: 'cliente_nombre', length: 150 })
  clienteNombre: string;

  @Column({ name: 'cliente_telefono', type: 'varchar', length: 30, nullable: true })
  clienteTelefono: string | null;

  @Column({ name: 'fecha_evento', type: 'date' })
  fechaEvento: string;

  @Column({ name: 'num_personas', type: 'int' })
  numPersonas: number;

  @Column({ type: 'enum', enum: ReservaEstado, default: ReservaEstado.CONFIRMADA })
  estado: ReservaEstado;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
