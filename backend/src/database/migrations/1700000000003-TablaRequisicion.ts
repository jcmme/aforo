import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablaRequisicion1700000000003 implements MigrationInterface {
  name = 'TablaRequisicion1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "requisicion_estado" AS ENUM ('pendiente', 'aprobada', 'rechazada', 'ajustada')`);
    await queryRunner.query(`
      CREATE TABLE "requisicion" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "solicitante_usuario_id" UUID NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "monto_solicitado" NUMERIC(12,2) NOT NULL,
        "destino" VARCHAR(255) NOT NULL,
        "fecha_gasto_programada" DATE NOT NULL,
        "estado" "requisicion_estado" NOT NULL DEFAULT 'pendiente',
        "monto_resuelto" NUMERIC(12,2),
        "resuelto_por_usuario_id" UUID REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "fecha_resolucion" TIMESTAMPTZ,
        "nota_resolucion" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_requisicion_antro" ON "requisicion" ("antro_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "requisicion"`);
    await queryRunner.query(`DROP TYPE "requisicion_estado"`);
  }
}
