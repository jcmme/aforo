import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Antro } from '../../identidad/entities/antro.entity';
import { Feature } from './feature.entity';

@Entity('antro_feature')
export class AntroFeature {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Antro, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro;

  @Column({ name: 'antro_id' })
  antroId: string;

  @ManyToOne(() => Feature, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'feature_id' })
  feature: Feature;

  @Column({ name: 'feature_id' })
  featureId: string;

  @Column({ default: false })
  activo: boolean;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
