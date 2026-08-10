import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Antro } from '../../../core/identidad/entities/antro.entity';

export enum NominaPeriodoEstado {
  ABIERTO = 'abierto',
  CERRADO = 'cerrado',
  PAGADO = 'pagado',
}

@Entity('nomina_periodo')
export class NominaPeriodo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  @Column({ name: 'periodo_inicio', type: 'date' })
  periodoInicio: string;

  @Column({ name: 'periodo_fin', type: 'date' })
  periodoFin: string;

  @Column({ type: 'enum', enum: NominaPeriodoEstado, default: NominaPeriodoEstado.ABIERTO })
  estado: NominaPeriodoEstado;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
