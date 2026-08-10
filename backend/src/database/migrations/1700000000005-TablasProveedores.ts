import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablasProveedores1700000000005 implements MigrationInterface {
  name = 'TablasProveedores1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "proveedor_categoria" AS ENUM ('licor', 'insumos', 'sonido', 'seguridad', 'limpieza', 'otro')`);
    await queryRunner.query(`CREATE TYPE "proveedor_estado" AS ENUM ('activo', 'inactivo')`);
    await queryRunner.query(`
      CREATE TABLE "proveedor" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "corporativo_id" UUID NOT NULL REFERENCES "corporativo"("id") ON DELETE CASCADE,
        "nombre" VARCHAR(150) NOT NULL,
        "categoria" "proveedor_categoria" NOT NULL,
        "contacto_nombre" VARCHAR(150),
        "telefono" VARCHAR(30),
        "email" VARCHAR(150),
        "estado" "proveedor_estado" NOT NULL DEFAULT 'activo',
        "notas" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_proveedor_corporativo" ON "proveedor" ("corporativo_id")`);

    await queryRunner.query(`
      CREATE TABLE "compra" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "proveedor_id" UUID NOT NULL REFERENCES "proveedor"("id") ON DELETE RESTRICT,
        "requisicion_id" UUID REFERENCES "requisicion"("id") ON DELETE SET NULL,
        "descripcion" VARCHAR(255) NOT NULL,
        "monto" NUMERIC(12,2) NOT NULL,
        "fecha" DATE NOT NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_compra_antro" ON "compra" ("antro_id")`);
    await queryRunner.query(`CREATE INDEX "idx_compra_proveedor" ON "compra" ("proveedor_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "compra"`);
    await queryRunner.query(`DROP TABLE "proveedor"`);
    await queryRunner.query(`DROP TYPE "proveedor_estado"`);
    await queryRunner.query(`DROP TYPE "proveedor_categoria"`);
  }
}
