import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Corporativo } from '../../../core/identidad/entities/corporativo.entity';

export enum ProveedorCategoria {
  LICOR = 'licor',
  INSUMOS = 'insumos',
  SONIDO = 'sonido',
  SEGURIDAD = 'seguridad',
  LIMPIEZA = 'limpieza',
  OTRO = 'otro',
}

export enum ProveedorEstado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
}

/**
 * Catálogo corporativo, no de un antro — es lo que permite comparar precios
 * entre sucursales y negociar con poder de compra consolidado.
 */
@Entity('proveedor')
export class Proveedor {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Corporativo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'corporativo_id' })
  corporativo: Corporativo;

  @Column({ name: 'corporativo_id' })
  corporativoId: string;

  @Column({ length: 150 })
  nombre: string;

  @Column({ type: 'enum', enum: ProveedorCategoria })
  categoria: ProveedorCategoria;

  @Column({ name: 'contacto_nombre', type: 'varchar', length: 150, nullable: true })
  contactoNombre: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  telefono: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  email: string | null;

  @Column({ type: 'enum', enum: ProveedorEstado, default: ProveedorEstado.ACTIVO })
  estado: ProveedorEstado;

  @Column({ type: 'text', nullable: true })
  notas: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
