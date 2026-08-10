import { MigrationInterface, QueryRunner } from 'typeorm';

export class TablasPersonal1700000000004 implements MigrationInterface {
  name = 'TablasPersonal1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TYPE "empleado_puesto" AS ENUM ('mesero', 'barra', 'seguridad', 'gerente', 'otro')`);
    await queryRunner.query(`CREATE TYPE "empleado_tipo_pago" AS ENUM ('por_hora', 'quincenal')`);
    await queryRunner.query(`CREATE TYPE "empleado_estado" AS ENUM ('activo', 'baja')`);
    await queryRunner.query(`
      CREATE TABLE "empleado" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "nombre" VARCHAR(150) NOT NULL,
        "puesto" "empleado_puesto" NOT NULL,
        "tipo_pago" "empleado_tipo_pago" NOT NULL,
        "salario_base" NUMERIC(12,2),
        "estado" "empleado_estado" NOT NULL DEFAULT 'activo',
        "usuario_id" UUID REFERENCES "usuario"("id") ON DELETE SET NULL,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_empleado_antro" ON "empleado" ("antro_id")`);

    await queryRunner.query(`CREATE TYPE "asistencia_estado" AS ENUM ('asistio', 'falta', 'retardo', 'permiso')`);
    await queryRunner.query(`
      CREATE TABLE "asistencia" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "empleado_id" UUID NOT NULL REFERENCES "empleado"("id") ON DELETE CASCADE,
        "fecha" DATE NOT NULL,
        "estado" "asistencia_estado" NOT NULL,
        "hora_entrada" TIME,
        "hora_salida" TIME,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_asistencia_empleado" ON "asistencia" ("empleado_id")`);
    await queryRunner.query(`CREATE INDEX "idx_asistencia_fecha" ON "asistencia" ("fecha")`);

    await queryRunner.query(`CREATE TYPE "nomina_periodo_estado" AS ENUM ('abierto', 'cerrado', 'pagado')`);
    await queryRunner.query(`
      CREATE TABLE "nomina_periodo" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "antro_id" UUID NOT NULL REFERENCES "antro"("id") ON DELETE CASCADE,
        "periodo_inicio" DATE NOT NULL,
        "periodo_fin" DATE NOT NULL,
        "estado" "nomina_periodo_estado" NOT NULL DEFAULT 'abierto',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_nomina_periodo_antro" ON "nomina_periodo" ("antro_id")`);

    await queryRunner.query(`
      CREATE TABLE "nomina_detalle" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nomina_periodo_id" UUID NOT NULL REFERENCES "nomina_periodo"("id") ON DELETE CASCADE,
        "empleado_id" UUID NOT NULL REFERENCES "empleado"("id") ON DELETE CASCADE,
        "horas_trabajadas" NUMERIC(6,2) NOT NULL DEFAULT 0,
        "faltas" INTEGER NOT NULL DEFAULT 0,
        "percepciones" NUMERIC(12,2) NOT NULL DEFAULT 0,
        "deducciones" NUMERIC(12,2) NOT NULL DEFAULT 0,
        "total_pagar" NUMERIC(12,2) NOT NULL DEFAULT 0,
        UNIQUE ("nomina_periodo_id", "empleado_id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "nomina_detalle"`);
    await queryRunner.query(`DROP TABLE "nomina_periodo"`);
    await queryRunner.query(`DROP TYPE "nomina_periodo_estado"`);
    await queryRunner.query(`DROP TABLE "asistencia"`);
    await queryRunner.query(`DROP TYPE "asistencia_estado"`);
    await queryRunner.query(`DROP TABLE "empleado"`);
    await queryRunner.query(`DROP TYPE "empleado_estado"`);
    await queryRunner.query(`DROP TYPE "empleado_tipo_pago"`);
    await queryRunner.query(`DROP TYPE "empleado_puesto"`);
  }
}
