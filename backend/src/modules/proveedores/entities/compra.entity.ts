import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Antro } from '../../../core/identidad/entities/antro.entity';
import { Proveedor } from './proveedor.entity';
import { Requisicion } from '../../requisiciones/entities/requisicion.entity';

/** Un registro de "esto se compró, a este proveedor, a este precio" — la fuente del historial de precios. */
@Entity('compra')
export class Compra {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  @ManyToOne(() => Proveedor, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'proveedor_id' })
  proveedor: Proveedor;

  @Column({ name: 'proveedor_id' })
  proveedorId: string;

  /** Opcional: si esta compra viene de una requisición ya aprobada. */
  @ManyToOne(() => Requisicion, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'requisicion_id' })
  requisicion: Requisicion | null;

  @Column({ name: 'requisicion_id', type: 'uuid', nullable: true })
  requisicionId: string | null;

  @Column({ length: 255 })
  descripcion: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  monto: string;

  @Column({ type: 'date' })
  fecha: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
