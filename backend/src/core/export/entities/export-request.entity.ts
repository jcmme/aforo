import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Corporativo } from '../../identidad/entities/corporativo.entity';
import { Antro } from '../../identidad/entities/antro.entity';
import { Usuario } from '../../identidad/entities/usuario.entity';

export enum ExportEstado {
  PENDIENTE = 'pendiente',
  GENERADO = 'generado',
  ERROR = 'error',
}

/**
 * Un registro por cada exportación a PDF que alguien pidió, sin importar
 * el módulo — es la entidad transversal de la que habla la arquitectura:
 * ningún módulo nuevo necesita su propia tabla de "exports".
 */
@Entity('export_request')
export class ExportRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Corporativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'corporativo_id' })
  corporativo: Corporativo;

  @Column({ name: 'corporativo_id' })
  corporativoId: string;

  @ManyToOne(() => Antro, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'antro_id' })
  antro: Antro | null;

  @Column({ name: 'antro_id', type: 'uuid', nullable: true })
  antroId: string | null;

  @Column({ length: 50 })
  modulo: string;

  @Column({ name: 'plantilla_codigo', length: 100 })
  plantillaCodigo: string;

  @Column({ type: 'jsonb', nullable: true })
  filtros: Record<string, unknown> | null;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'solicitado_por_usuario_id' })
  solicitadoPorUsuario: Usuario;

  @Column({ name: 'solicitado_por_usuario_id' })
  solicitadoPorUsuarioId: string;

  @Column({ type: 'enum', enum: ExportEstado, default: ExportEstado.PENDIENTE })
  estado: ExportEstado;

  @Column({ name: 'archivo_url', type: 'varchar', length: 255, nullable: true })
  archivoUrl: string | null;

  @Column({ name: 'generado_at', type: 'timestamptz', nullable: true })
  generadoAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
