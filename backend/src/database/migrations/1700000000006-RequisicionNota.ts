import { MigrationInterface, QueryRunner } from 'typeorm';

export class RequisicionNota1700000000006 implements MigrationInterface {
  name = 'RequisicionNota1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "requisicion" ADD COLUMN "nota" TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "requisicion" DROP COLUMN "nota"`);
  }
}
