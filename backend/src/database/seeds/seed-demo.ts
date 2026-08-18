import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../../app.module';
import { Rol, RolAlcanceTipo } from '../../core/rbac/entities/rol.entity';
import { UsuarioAntro, AsignacionEstado } from '../../core/rbac/entities/usuario-antro.entity';
import { Corporativo, CorporativoEstado } from '../../core/identidad/entities/corporativo.entity';
import { Antro, AntroEstadoOperativo } from '../../core/identidad/entities/antro.entity';
import { Usuario, UsuarioEstado } from '../../core/identidad/entities/usuario.entity';
import { Reserva, ReservaEstado } from '../../modules/reservas/entities/reserva.entity';
import { Requisicion, RequisicionEstado } from '../../modules/requisiciones/entities/requisicion.entity';
import { Empleado, EmpleadoPuesto, EmpleadoTipoPago, EmpleadoEstado } from '../../modules/personal/entities/empleado.entity';
import { Asistencia, AsistenciaEstado } from '../../modules/personal/entities/asistencia.entity';
import { NominaPeriodo, NominaPeriodoEstado } from '../../modules/personal/entities/nomina-periodo.entity';
import { NominaDetalle } from '../../modules/personal/entities/nomina-detalle.entity';
import { Proveedor, ProveedorCategoria, ProveedorEstado } from '../../modules/proveedores/entities/proveedor.entity';
import { Compra } from '../../modules/proveedores/entities/compra.entity';

const PASSWORD_DEMO = 'cambia-esta-password';
const CORPORATIVO_NOMBRE = 'Antro Ejemplo (demo de venta)';

function fechaHace(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function fechaEn(dias: number): string {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

async function crearAntroConDatos(
  ds: DataSource,
  corporativoId: string,
  nombreAntro: string,
  ciudad: string,
): Promise<Antro> {
  const antroRepo = ds.getRepository(Antro);
  const usuarioRepo = ds.getRepository(Usuario);
  const usuarioAntroRepo = ds.getRepository(UsuarioAntro);
  const rolRepo = ds.getRepository(Rol);
  const reservaRepo = ds.getRepository(Reserva);
  const requisicionRepo = ds.getRepository(Requisicion);
  const empleadoRepo = ds.getRepository(Empleado);
  const asistenciaRepo = ds.getRepository(Asistencia);
  const periodoRepo = ds.getRepository(NominaPeriodo);
  const detalleRepo = ds.getRepository(NominaDetalle);

  let antro = await antroRepo.findOne({ where: { corporativoId, nombre: nombreAntro } });
  if (antro) {
    console.log(`  Antro "${nombreAntro}" ya existía, se omite (corre de nuevo con otro nombre si quieres duplicar).`);
    return antro;
  }

  antro = await antroRepo.save(
    antroRepo.create({ corporativoId, nombre: nombreAntro, ciudad, estadoOperativo: AntroEstadoOperativo.ACTIVO }),
  );
  console.log(`  Antro creado: ${nombreAntro}`);

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  const rolGerenteAntro = await rolRepo.findOne({ where: { nombre: 'Gerente de Antro' } });
  const rolRp = await rolRepo.findOne({ where: { nombre: 'RP' } });
  if (!rolGerenteAntro || !rolRp) throw new Error('Corre primero "npm run seed" para tener los roles base.');

  const slug = nombreAntro.toLowerCase().replace(/[^a-z0-9]+/g, '.');
  const gerente = await usuarioRepo.save(
    usuarioRepo.create({
      corporativoId,
      nombre: `Gerente ${nombreAntro}`,
      email: `gerente.${slug}@ejemplo-demo.com`,
      passwordHash,
      estado: UsuarioEstado.ACTIVO,
    }),
  );
  await usuarioAntroRepo.save(
    usuarioAntroRepo.create({ usuarioId: gerente.id, antroId: antro.id, rolId: rolGerenteAntro.id, estado: AsignacionEstado.ACTIVO }),
  );

  const nombresRp = ['Ana Torres', 'Luis Medina'];
  const rps: Usuario[] = [];
  for (const nombreRp of nombresRp) {
    const rp = await usuarioRepo.save(
      usuarioRepo.create({
        corporativoId,
        nombre: nombreRp,
        email: `${nombreRp.toLowerCase().replace(' ', '.')}.${slug}@ejemplo-demo.com`,
        passwordHash,
        estado: UsuarioEstado.ACTIVO,
      }),
    );
    await usuarioAntroRepo.save(
      usuarioAntroRepo.create({ usuarioId: rp.id, antroId: antro.id, rolId: rolRp.id, estado: AsignacionEstado.ACTIVO }),
    );
    rps.push(rp);
  }
  console.log(`  Usuarios: ${gerente.email}, ${rps.map((r) => r.email).join(', ')}`);

  // --- Reservas: mezcla de pasadas y futuras, distintos estados ---
  const clientes = [
    'Fernanda López', 'Ricardo Nuñez', 'Paola Guzmán', 'Diego Herrera', 'Karla Solís',
    'Mauricio Reyes', 'Valeria Cruz', 'Jorge Aguilar', 'Daniela Vega', 'Sergio Ramos',
    'Ximena Flores', 'Emilio Castro',
  ];
  const estadosReserva = [ReservaEstado.CONFIRMADA, ReservaEstado.CONFIRMADA, ReservaEstado.CONFIRMADA, ReservaEstado.NO_SHOW, ReservaEstado.CANCELADA];
  let totalReservas = 0;
  for (let i = 0; i < clientes.length; i++) {
    const rp = rps[i % rps.length];
    const diasOffset = i < 8 ? -1 * (14 - i) : i - 8;
    await reservaRepo.save(
      reservaRepo.create({
        antroId: antro.id,
        rpUsuarioId: rp.id,
        clienteNombre: clientes[i],
        clienteTelefono: `221${(1000000 + i * 137).toString().slice(0, 7)}`,
        fechaEvento: diasOffset < 0 ? fechaHace(-diasOffset) : fechaEn(diasOffset),
        numPersonas: 2 + (i % 6),
        estado: diasOffset < 0 ? estadosReserva[i % estadosReserva.length] : ReservaEstado.CONFIRMADA,
        notas: i % 4 === 0 ? 'Cumpleaños, pidió pastel' : null,
      }),
    );
    totalReservas++;
  }
  console.log(`  ${totalReservas} reservas`);

  // --- Requisiciones: variedad de estados ---
  const requisicionesBase = [
    { destino: 'Reparación de planta de sonido', monto: 8500, estado: RequisicionEstado.APROBADA, ajuste: 8500 },
    { destino: 'Compra de brazaletes RFID para acceso', monto: 12000, estado: RequisicionEstado.APROBADA, ajuste: 10500 },
    { destino: 'Mantenimiento de aires acondicionados', monto: 6200, estado: RequisicionEstado.PENDIENTE, ajuste: null },
    { destino: 'Uniformes nuevos para meseros', monto: 9800, estado: RequisicionEstado.PENDIENTE, ajuste: null },
    { destino: 'Renta de máquina de humo extra para evento', monto: 3200, estado: RequisicionEstado.RECHAZADA, ajuste: null },
    { destino: 'Remodelación de baños de VIP', monto: 45000, estado: RequisicionEstado.AJUSTADA, ajuste: 30000 },
  ];
  for (let i = 0; i < requisicionesBase.length; i++) {
    const r = requisicionesBase[i];
    const requisicion = requisicionRepo.create({
      antroId: antro.id,
      solicitanteUsuarioId: gerente.id,
      montoSolicitado: r.monto.toFixed(2),
      destino: r.destino,
      fechaGastoProgramada: fechaEn(3 + i * 2),
      estado: r.estado,
    });
    if (r.estado !== RequisicionEstado.PENDIENTE) {
      requisicion.montoResuelto = (r.ajuste ?? r.monto).toFixed(2);
      requisicion.resueltoPorUsuarioId = gerente.id;
      requisicion.fechaResolucion = new Date();
      requisicion.notaResolucion = r.estado === RequisicionEstado.RECHAZADA ? 'No es prioridad este mes' : 'Aprobado en junta';
    }
    await requisicionRepo.save(requisicion);
  }
  console.log(`  ${requisicionesBase.length} requisiciones`);

  // --- Personal + asistencia ---
  const empleadosBase = [
    { nombre: 'Rosa Jiménez', puesto: EmpleadoPuesto.MESERO, salario: 5800 },
    { nombre: 'Carlos Beltrán', puesto: EmpleadoPuesto.MESERO, salario: 5800 },
    { nombre: 'Miguel Ángel Soto', puesto: EmpleadoPuesto.BARRA, salario: 7200 },
    { nombre: 'Brenda Ochoa', puesto: EmpleadoPuesto.BARRA, salario: 7200 },
    { nombre: 'Héctor Villanueva', puesto: EmpleadoPuesto.SEGURIDAD, salario: 6500 },
    { nombre: nombreGerenteEmpleado(nombreAntro), puesto: EmpleadoPuesto.GERENTE, salario: 15000 },
  ];
  const empleados: Empleado[] = [];
  for (const e of empleadosBase) {
    const empleado = await empleadoRepo.save(
      empleadoRepo.create({
        antroId: antro.id,
        nombre: e.nombre,
        puesto: e.puesto,
        tipoPago: EmpleadoTipoPago.QUINCENAL,
        salarioBase: e.salario.toFixed(2),
        estado: EmpleadoEstado.ACTIVO,
      }),
    );
    empleados.push(empleado);
  }
  console.log(`  ${empleados.length} empleados`);

  const estadosAsistencia = [
    AsistenciaEstado.ASISTIO, AsistenciaEstado.ASISTIO, AsistenciaEstado.ASISTIO,
    AsistenciaEstado.ASISTIO, AsistenciaEstado.RETARDO, AsistenciaEstado.ASISTIO, AsistenciaEstado.FALTA,
  ];
  let totalAsistencias = 0;
  for (const empleado of empleados) {
    for (let dia = 0; dia < 14; dia += 2) {
      await asistenciaRepo.save(
        asistenciaRepo.create({
          empleadoId: empleado.id,
          fecha: fechaHace(dia),
          estado: estadosAsistencia[(dia + empleado.nombre.length) % estadosAsistencia.length],
          horaEntrada: '20:00',
          horaSalida: '03:30',
        }),
      );
      totalAsistencias++;
    }
  }
  console.log(`  ${totalAsistencias} registros de asistencia`);

  // --- Nómina: un periodo ya pagado ---
  const periodo = await periodoRepo.save(
    periodoRepo.create({
      antroId: antro.id,
      periodoInicio: fechaHace(14),
      periodoFin: fechaHace(1),
      estado: NominaPeriodoEstado.PAGADO,
    }),
  );
  for (const empleado of empleados) {
    const percepciones = Number(empleado.salarioBase);
    const faltas = empleado.nombre.length % 3 === 0 ? 1 : 0;
    const deducciones = faltas * (percepciones / 15);
    await detalleRepo.save(
      detalleRepo.create({
        nominaPeriodoId: periodo.id,
        empleadoId: empleado.id,
        horasTrabajadas: (56 - faltas * 8).toFixed(2),
        faltas,
        percepciones: percepciones.toFixed(2),
        deducciones: deducciones.toFixed(2),
        totalPagar: (percepciones - deducciones).toFixed(2),
      }),
    );
  }
  console.log(`  1 periodo de nómina pagado, con detalle de ${empleados.length} empleados`);

  return antro;
}

function nombreGerenteEmpleado(nombreAntro: string): string {
  return `Gerente de turno (${nombreAntro})`;
}

async function seedDemo(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const ds = app.get(DataSource);

  const corporativoRepo = ds.getRepository(Corporativo);
  const usuarioRepo = ds.getRepository(Usuario);
  const usuarioAntroRepo = ds.getRepository(UsuarioAntro);
  const rolRepo = ds.getRepository(Rol);
  const proveedorRepo = ds.getRepository(Proveedor);
  const compraRepo = ds.getRepository(Compra);
  const antroRepo = ds.getRepository(Antro);

  console.log('Creando corporativo de demo...');
  let corporativo = await corporativoRepo.findOne({ where: { nombreComercial: CORPORATIVO_NOMBRE } });
  if (!corporativo) {
    corporativo = await corporativoRepo.save(
      corporativoRepo.create({ nombreComercial: CORPORATIVO_NOMBRE, estado: CorporativoEstado.ACTIVO }),
    );
  }

  console.log('Creando cuenta de Dueño (ve ambos antros consolidados)...');
  const rolDueno = await rolRepo.findOne({ where: { nombre: 'Dueño' } });
  if (!rolDueno) throw new Error('Corre primero "npm run seed" para tener los roles base.');

  const passwordHash = await bcrypt.hash(PASSWORD_DEMO, 10);
  let dueno = await usuarioRepo.findOne({ where: { email: 'dueno@ejemplo-demo.com' } });
  if (!dueno) {
    dueno = await usuarioRepo.save(
      usuarioRepo.create({
        corporativoId: corporativo.id,
        nombre: 'Dueño Antro Ejemplo',
        email: 'dueno@ejemplo-demo.com',
        passwordHash,
        estado: UsuarioEstado.ACTIVO,
      }),
    );
    await usuarioAntroRepo.save(
      usuarioAntroRepo.create({ usuarioId: dueno.id, antroId: null, rolId: rolDueno.id, estado: AsignacionEstado.ACTIVO }),
    );
  }

  console.log('Creando antros con datos de ejemplo...');
  const antroCentro = await crearAntroConDatos(ds, corporativo.id, 'Antro Ejemplo Centro', 'Puebla');
  const antroNorte = await crearAntroConDatos(ds, corporativo.id, 'Antro Ejemplo Norte', 'Puebla');

  console.log('Creando catálogo de proveedores (compartido por el corporativo)...');
  const proveedoresBase = [
    { nombre: 'Distribuidora La Puebla', categoria: ProveedorCategoria.LICOR, contacto: 'Raúl Ibarra', tel: '2221234567' },
    { nombre: 'Insumos y Más SA', categoria: ProveedorCategoria.INSUMOS, contacto: 'Lucía Marín', tel: '2222345678' },
    { nombre: 'SonidoPro Puebla', categoria: ProveedorCategoria.SONIDO, contacto: 'Ismael Cordero', tel: '2223456789' },
    { nombre: 'Grupo Seguridad Vigía', categoria: ProveedorCategoria.SEGURIDAD, contacto: 'Patricia Nava', tel: '2224567890' },
  ];
  const proveedores: Proveedor[] = [];
  for (const p of proveedoresBase) {
    let proveedor = await proveedorRepo.findOne({ where: { corporativoId: corporativo.id, nombre: p.nombre } });
    if (!proveedor) {
      proveedor = await proveedorRepo.save(
        proveedorRepo.create({
          corporativoId: corporativo.id,
          nombre: p.nombre,
          categoria: p.categoria,
          contactoNombre: p.contacto,
          telefono: p.tel,
          estado: ProveedorEstado.ACTIVO,
        }),
      );
    }
    proveedores.push(proveedor);
  }

  console.log('Registrando compras de ejemplo en cada antro...');
  const descripcionesCompra = [
    'Reposición de licor de la semana', '20 cajas de cerveza', 'Refrescos y hielo', 'Renta de bocinas extra',
    'Guardias adicionales fin de semana', 'Vasos y popotes', 'Botellas premium para VIP',
  ];
  for (const antro of [antroCentro, antroNorte]) {
    for (let i = 0; i < descripcionesCompra.length; i++) {
      const proveedor = proveedores[i % proveedores.length];
      const yaExiste = await compraRepo.findOne({ where: { antroId: antro.id, descripcion: descripcionesCompra[i] } });
      if (yaExiste) continue;
      await compraRepo.save(
        compraRepo.create({
          antroId: antro.id,
          proveedorId: proveedor.id,
          descripcion: descripcionesCompra[i],
          monto: (1200 + i * 850).toFixed(2),
          fecha: fechaHace(i * 3),
        }),
      );
    }
  }

  console.log('\nListo. Cuentas para la demo (contraseña para todas: ' + PASSWORD_DEMO + '):');
  console.log(`  dueno@ejemplo-demo.com          — Dueño, ve "${antroCentro.nombre}" y "${antroNorte.nombre}" consolidados`);
  console.log(`  gerente.antro.ejemplo.centro@ejemplo-demo.com — Gerente de "${antroCentro.nombre}" únicamente`);
  console.log(`  gerente.antro.ejemplo.norte@ejemplo-demo.com  — Gerente de "${antroNorte.nombre}" únicamente`);
  console.log('  (y 2 RPs por cada antro, ver el detalle arriba)');

  await app.close();
}

seedDemo().catch((error) => {
  console.error(error);
  process.exit(1);
});
