import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esqueleto multi-tenant + RBAC del que dependen todos los módulos de
 * negocio: Corporativo → Antro → Usuario, más Rol/Permiso/RolPermiso/
 * UsuarioAntro (permisos con alcance) y ExportRequest (auditoría de PDFs).
 */
export class EsqueletoInicial1700000000000 implements MigrationInterface {
  name = 'EsqueletoInicial1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`CREATE TYPE "corporativo_estado" AS ENUM ('activo', 'suspendido')`);
    await queryRunner.query(`
      CREATE TABLE "corporativo" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre_comercial" VARCHAR(150) NOT NULL,
        "razon_social" VARCHAR(150),
        "rfc" VARCHAR(20),
        "estado" "corporativo_estado" NOT NULL DEFAULT 'activo',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`CREATE TYPE "antro_estado" AS ENUM ('activo', 'temporalmente_cerrado', 'baja')`);
    await queryRunner.query(`
      CREATE TABLE "antro" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "corporativo_id" UUID NOT NULL REFERENCES "corporativo"("id") ON DELETE CASCADE,
        "nombre" VARCHAR(150) NOT NULL,
        "direccion" VARCHAR(255),
        "ciudad" VARCHAR(100),
        "estado_operativo" "antro_estado" NOT NULL DEFAULT 'activo',
        "permiso_uso_suelo" VARCHAR(100),
        "licencia_funcionamiento" VARCHAR(100),
        "aforo_maximo" INTEGER,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_antro_corporativo" ON "antro" ("corporativo_id")`);

    await queryRunner.query(`CREATE TYPE "usuario_estado" AS ENUM ('activo', 'inactivo')`);
    await queryRunner.query(`
      CREATE TABLE "usuario" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "corporativo_id" UUID NOT NULL REFERENCES "corporativo"("id") ON DELETE CASCADE,
        "nombre" VARCHAR(150) NOT NULL,
        "email" VARCHAR(150) NOT NULL UNIQUE,
        "password_hash" VARCHAR(255) NOT NULL,
        "estado" "usuario_estado" NOT NULL DEFAULT 'activo',
        "ultimo_login" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_usuario_corporativo" ON "usuario" ("corporativo_id")`);

    await queryRunner.query(`CREATE TYPE "rol_alcance" AS ENUM ('antro', 'corporativo')`);
    await queryRunner.query(`
      CREATE TABLE "rol" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "nombre" VARCHAR(100) NOT NULL UNIQUE,
        "alcance_tipo" "rol_alcance" NOT NULL,
        "es_rol_sistema" BOOLEAN NOT NULL DEFAULT false,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "permiso" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "codigo" VARCHAR(100) NOT NULL UNIQUE,
        "modulo" VARCHAR(50) NOT NULL,
        "descripcion" VARCHAR(255)
      )
    `);

    await queryRunner.query(`CREATE TYPE "permiso_alcance" AS ENUM ('propio', 'antro', 'corporativo')`);
    await queryRunner.query(`
      CREATE TABLE "rol_permiso" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "rol_id" UUID NOT NULL REFERENCES "rol"("id") ON DELETE CASCADE,
        "permiso_id" UUID NOT NULL REFERENCES "permiso"("id") ON DELETE CASCADE,
        "alcance" "permiso_alcance" NOT NULL,
        UNIQUE ("rol_id", "permiso_id")
      )
    `);

    await queryRunner.query(`CREATE TYPE "asignacion_estado" AS ENUM ('activo', 'revocado')`);
    await queryRunner.query(`
      CREATE TABLE "usuario_antro" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "usuario_id" UUID NOT NULL REFERENCES "usuario"("id") ON DELETE CASCADE,
        "antro_id" UUID REFERENCES "antro"("id") ON DELETE CASCADE,
        "rol_id" UUID NOT NULL REFERENCES "rol"("id") ON DELETE RESTRICT,
        "estado" "asignacion_estado" NOT NULL DEFAULT 'activo',
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_usuario_antro_usuario" ON "usuario_antro" ("usuario_id")`);
    await queryRunner.query(`CREATE INDEX "idx_usuario_antro_antro" ON "usuario_antro" ("antro_id")`);

    await queryRunner.query(`CREATE TYPE "export_estado" AS ENUM ('pendiente', 'generado', 'error')`);
    await queryRunner.query(`
      CREATE TABLE "export_request" (
        "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "corporativo_id" UUID NOT NULL REFERENCES "corporativo"("id") ON DELETE CASCADE,
        "antro_id" UUID REFERENCES "antro"("id") ON DELETE SET NULL,
        "modulo" VARCHAR(50) NOT NULL,
        "plantilla_codigo" VARCHAR(100) NOT NULL,
        "filtros" JSONB,
        "solicitado_por_usuario_id" UUID NOT NULL REFERENCES "usuario"("id") ON DELETE RESTRICT,
        "estado" "export_estado" NOT NULL DEFAULT 'pendiente',
        "archivo_url" VARCHAR(255),
        "generado_at" TIMESTAMPTZ,
        "created_at" TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);
    await queryRunner.query(`CREATE INDEX "idx_export_request_corporativo" ON "export_request" ("corporativo_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "export_request"`);
    await queryRunner.query(`DROP TYPE "export_estado"`);
    await queryRunner.query(`DROP TABLE "usuario_antro"`);
    await queryRunner.query(`DROP TYPE "asignacion_estado"`);
    await queryRunner.query(`DROP TABLE "rol_permiso"`);
    await queryRunner.query(`DROP TYPE "permiso_alcance"`);
    await queryRunner.query(`DROP TABLE "permiso"`);
    await queryRunner.query(`DROP TABLE "rol"`);
    await queryRunner.query(`DROP TYPE "rol_alcance"`);
    await queryRunner.query(`DROP TABLE "usuario"`);
    await queryRunner.query(`DROP TYPE "usuario_estado"`);
    await queryRunner.query(`DROP TABLE "antro"`);
    await queryRunner.query(`DROP TYPE "antro_estado"`);
    await queryRunner.query(`DROP TABLE "corporativo"`);
    await queryRunner.query(`DROP TYPE "corporativo_estado"`);
  }
}
