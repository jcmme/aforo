import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum CorporativoEstado {
  ACTIVO = 'activo',
  SUSPENDIDO = 'suspendido',
}

@Entity('corporativo')
export class Corporativo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre_comercial', length: 150 })
  nombreComercial: string;

  @Column({ name: 'razon_social', type: 'varchar', length: 150, nullable: true })
  razonSocial: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  rfc: string | null;

  @Column({ type: 'enum', enum: CorporativoEstado, default: CorporativoEstado.ACTIVO })
  estado: CorporativoEstado;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
