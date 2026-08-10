import { MigrationInterface, QueryRunner } from 'typeorm';

export class SuperAdminRol1700000000002 implements MigrationInterface {
  name = 'SuperAdminRol1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rol" ADD COLUMN "es_super_admin" BOOLEAN NOT NULL DEFAULT false`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "rol" DROP COLUMN "es_super_admin"`);
  }
}
