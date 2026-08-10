import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablaReserva1700000000001 implements MigrationInterface {
  name = 'TablaReserva1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "reserva_estado" AS ENUM ('confirmada', 'cancelada', 'no_show')`);
    await queryRunner.query(`
      CREATE TABLE "reserva" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "rp_usuario_id" UUID NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "cliente_nombre" VARCHAR(150) NOT NULL,
        "cliente_telefono" VARCHAR(30),
        "fecha_evento" DATE NOT NULL,
        "num_personas" INTEGER NOT NULL,
        "estado" "reserva_estado" NOT NULL DEFAULT 'confirmada',
        "notas" TEXT,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_reserva_antro" ON "reserva" ("antro_id")`);
    await queryRunner.query(`CREATE INDEX "idx_reserva_rp" ON "reserva" ("rp_usuario_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "reserva"`);
    await queryRunner.query(`DROP TYPE "reserva_estado"`);
  }
}
