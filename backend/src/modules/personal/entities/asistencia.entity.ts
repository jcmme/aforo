import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Empleado } from './empleado.entity';

export enum AsistenciaEstado {
  ASISTIO = 'asistio',
  FALTA = 'falta',
  RETARDO = 'retardo',
  PERMISO = 'permiso',
}

@Entity('asistencia')
export class Asistencia {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Empleado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ name: 'empleado_id' })
  empleadoId: string;

  @Column({ type: 'date' })
  fecha: string;

  @Column({ type: 'enum', enum: AsistenciaEstado })
  estado: AsistenciaEstado;

  @Column({ name: 'hora_entrada', type: 'time', nullable: true })
  horaEntrada: string | null;

  @Column({ name: 'hora_salida', type: 'time', nullable: true })
  horaSalida: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
