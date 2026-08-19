import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Corporativo } from '../../identidad/entities/corporativo.entity';
import { Usuario } from '../../identidad/entities/usuario.entity';

/**
 * Rastro de decisiones tomadas dentro de la app (quién aprobó qué, quién dio
 * de alta qué, cuándo). Solo Super Admin puede leerla (ver auditoria.module-
 * definition.ts: "auditoria.ver" no se le asigna a ningún otro rol).
 */
@Entity('auditoria')
export class Auditoria {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Corporativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'corporativo_id' })
  corporativo: Corporativo;

  @Column({ name: 'corporativo_id' })
  corporativoId: string;

  @ManyToOne(() => Usuario, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'actor_usuario_id' })
  actorUsuario: Usuario;

  @Column({ name: 'actor_usuario_id' })
  actorUsuarioId: string;

  @Column({ length: 100 })
  accion: string;

  @Column({ length: 50 })
  entidad: string;

  @Column({ name: 'entidad_id', type: 'uuid', nullable: true })
  entidadId: string | null;

  @Column({ type: 'jsonb', nullable: true })
  detalle: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
