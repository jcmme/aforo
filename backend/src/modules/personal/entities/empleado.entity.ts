import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Antro } from '../../../core/identidad/entities/antro.entity';
import { Usuario } from '../../../core/identidad/entities/usuario.entity';

export enum EmpleadoPuesto {
  MESERO = 'mesero',
  BARRA = 'barra',
  SEGURIDAD = 'seguridad',
  GERENTE = 'gerente',
  OTRO = 'otro',
}

export enum EmpleadoTipoPago {
  POR_HORA = 'por_hora',
  QUINCENAL = 'quincenal',
}

export enum EmpleadoEstado {
  ACTIVO = 'activo',
  BAJA = 'baja',
}

/** Existe aunque el trabajador no tenga login propio — por eso usuarioId es opcional. */
@Entity('empleado')
export class Empleado {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'enum', enum: EmpleadoPuesto })
  puesto: EmpleadoPuesto;

  @Column({ name: 'tipo_pago', type: 'enum', enum: EmpleadoTipoPago })
  tipoPago: EmpleadoTipoPago;

  @Column({ name: 'salario_base', type: 'numeric', precision: 12, scale: 2, nullable: true })
  salarioBase: string | null;

  @Column({ type: 'enum', enum: EmpleadoEstado, default: EmpleadoEstado.ACTIVO })
  estado: EmpleadoEstado;

  @ManyToOne(() => Usuario, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario | null;

  @Column({ name: 'usuario_id', type: 'uuid', nullable: true })
  usuarioId: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
