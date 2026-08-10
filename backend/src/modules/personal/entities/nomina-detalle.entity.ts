import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { NominaPeriodo } from './nomina-periodo.entity';
import { Empleado } from './empleado.entity';

@Entity('nomina_detalle')
@Unique(['nominaPeriodoId', 'empleadoId'])
export class NominaDetalle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => NominaPeriodo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'nomina_periodo_id' })
  nominaPeriodo: NominaPeriodo;

  @Column({ name: 'nomina_periodo_id' })
  nominaPeriodoId: string;

  @ManyToOne(() => Empleado, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'empleado_id' })
  empleado: Empleado;

  @Column({ name: 'empleado_id' })
  empleadoId: string;

  @Column({ name: 'horas_trabajadas', type: 'numeric', precision: 6, scale: 2, default: 0 })
  horasTrabajadas: string;

  @Column({ type: 'int', default: 0 })
  faltas: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  percepciones: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  deducciones: string;

  @Column({ name: 'total_pagar', type: 'numeric', precision: 12, scale: 2, default: 0 })
  totalPagar: string;
}
