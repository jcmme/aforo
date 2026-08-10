import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Corporativo } from './corporativo.entity';

export enum AntroEstadoOperativo {
  ACTIVO = 'activo',
  TEMPORALMENTE_CERRADO = 'temporalmente_cerrado',
  BAJA = 'baja',
}

@Entity('antro')
export class Antro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Corporativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'corporativo_id' })
  corporativo: Corporativo;

  @Column({ name: 'corporativo_id' })
  corporativoId: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  ciudad: string | null;

  @Column({ name: 'estado_operativo', type: 'enum', enum: AntroEstadoOperativo, default: AntroEstadoOperativo.ACTIVO })
  estadoOperativo: AntroEstadoOperativo;

  // Campos reservados para el módulo de cumplimiento/permisos (fase posterior) — nulos por ahora.
  @Column({ name: 'permiso_uso_suelo', type: 'varchar', length: 100, nullable: true })
  permisoUsoSuelo: string | null;

  @Column({ name: 'licencia_funcionamiento', type: 'varchar', length: 100, nullable: true })
  licenciaFuncionamiento: string | null;

  @Column({ name: 'aforo_maximo', type: 'int', nullable: true })
  aforoMaximo: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
