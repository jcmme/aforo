import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Los módulos de negocio pasan a ser features del catálogo (ver
 * core/rbac/permisos-plataforma.ts#featureDelModulo). Se prenden para los
 * antros que YA existen, para que nadie pierda lo que hoy usa; un antro
 * creado después no tiene fila y por lo tanto arranca con todo apagado.
 */
const MODULOS: { codigo: string; nombre: string; descripcion: string }[] = [
  { codigo: 'modulo.reservas', nombre: 'Reservas', descripcion: 'Reservas de mesas y listas de los RPs.' },
  { codigo: 'modulo.metricas', nombre: 'Métricas', descripcion: 'Resumen de reservas y gastos por antro.' },
  { codigo: 'modulo.requisiciones', nombre: 'Requisiciones', descripcion: 'Solicitudes de gasto y su aprobación.' },
  { codigo: 'modulo.personal', nombre: 'Personal y asistencia', descripcion: 'Empleados y pase de lista.' },
  { codigo: 'modulo.nomina', nombre: 'Nómina', descripcion: 'Periodos de nómina y su detalle.' },
  { codigo: 'modulo.proveedores', nombre: 'Proveedores', descripcion: 'Catálogo de proveedores, compras e historial de precios.' },
];

export class ModulosComoFeatures1700000000009 implements MigrationInterface {
  name = 'ModulosComoFeatures1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const modulo of MODULOS) {
      await queryRunner.query(
        `INSERT INTO "feature" ("codigo", "nombre", "descripcion") VALUES ($1, $2, $3) ON CONFLICT ("codigo") DO NOTHING`,
        [modulo.codigo, modulo.nombre, modulo.descripcion],
      );
    }
    await queryRunner.query(`
      INSERT INTO "antro_feature" ("antro_id", "feature_id", "activo")
      SELECT a."id", f."id", true
      FROM "antro" a CROSS JOIN "feature" f
      WHERE f."codigo" LIKE 'modulo.%'
      ON CONFLICT ("antro_id", "feature_id") DO UPDATE SET "activo" = true
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "feature" WHERE "codigo" = ANY($1)`, [MODULOS.map((m) => m.codigo)]);
  }
}
