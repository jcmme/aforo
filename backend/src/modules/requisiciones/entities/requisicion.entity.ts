import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Antro } from '../../../core/identidad/entities/antro.entity';
import { Usuario } from '../../../core/identidad/entities/usuario.entity';

export enum RequisicionEstado {
  PENDIENTE = 'pendiente',
  APROBADA = 'aprobada',
  RECHAZADA = 'rechazada',
  AJUSTADA = 'ajustada',
}

/**
 * Registro ligero del resultado de la junta entre Gerente de Antro y
 * Gerente General — a propósito NO guarda la discusión, solo la decisión.
 */
@Entity('requisicion')
export class Requisicion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitante_usuario_id' })
  solicitanteUsuario: Usuario;

  @Column({ name: 'solicitante_usuario_id' })
  solicitanteUsuarioId: string;

  @Column({ name: 'monto_solicitado', type: 'numeric', precision: 12, scale: 2 })
  montoSolicitado: string;

  @Column({ length: 255 })
  destino: string;

  @Column({ type: 'text', nullable: true })
  nota: string | null;

  @Column({ name: 'fecha_gasto_programada', type: 'date' })
  fechaGastoProgramada: string;

  @Column({ type: 'enum', enum: RequisicionEstado, default: RequisicionEstado.PENDIENTE })
  estado: RequisicionEstado;

  @Column({ name: 'monto_resuelto', type: 'numeric', precision: 12, scale: 2, nullable: true })
  montoResuelto: string | null;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'resuelto_por_usuario_id' })
  resueltoPorUsuario: Usuario | null;

  @Column({ name: 'resuelto_por_usuario_id', type: 'uuid', nullable: true })
  resueltoPorUsuarioId: string | null;

  @Column({ name: 'fecha_resolucion', type: 'timestamptz', nullable: true })
  fechaResolucion: Date | null;

  @Column({ name: 'nota_resolucion', type: 'text', nullable: true })
  notaResolucion: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
