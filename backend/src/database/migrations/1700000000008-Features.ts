import { MigrationInterface, QueryRunner } from 'typeorm';

export class Features1700000000008 implements MigrationInterface {
  name = 'Features1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "feature" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "codigo" VARCHAR(100) NOT NULL UNIQUE,
        "nombre" VARCHAR(150) NOT NULL,
        "descripcion" VARCHAR(255),
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "antro_feature" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "feature_id" UUID NOT NULL REFERENCES "feature"("id") ON DELETE CASCADE,
        "activo" BOOLEAN NOT NULL DEFAULT false,
        "updated_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE ("antro_id", "feature_id")
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_antro_feature_antro" ON "antro_feature" ("antro_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "antro_feature"`);
    await queryRunner.query(`DROP TABLE "feature"`);
  }
}
