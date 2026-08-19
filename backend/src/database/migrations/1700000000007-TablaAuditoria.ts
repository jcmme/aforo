import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablaAuditoria1700000000007 implements MigrationInterface {
  name = 'TablaAuditoria1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "auditoria" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "corporativo_id" UUID NOT NULL REFERENCES "corporativo"("id") ON DELETE CASCADE,
        "actor_usuario_id" UUID NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "accion" VARCHAR(100) NOT NULL,
        "entidad" VARCHAR(50) NOT NULL,
        "entidad_id" UUID,
        "detalle" JSONB,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_auditoria_corporativo" ON "auditoria" ("corporativo_id")`);
    await queryRunner.query(`CREATE INDEX "idx_auditoria_created_at" ON "auditoria" ("created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "auditoria"`);
  }
}
