import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permiso')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  codigo: string;

  @Column({ length: 50 })
  modulo: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string | null;
}
