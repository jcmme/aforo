// Pruebas de AISLAMIENTO MULTI-TENANT y matriz de permisos.
//
// Ejercitan la MISMA lógica pura (`decision.ts`) que usan las Edge Functions en
// producción — no una copia. Objetivo: demostrar, con dos corporativos, que el
// personal de uno JAMÁS alcanza datos/acciones del otro, en toda dirección
// (CLAUDE.md §2, "aislamiento probado explícitamente").
//
// Correr:  npm test
// (Node 22+ ejecuta TypeScript de forma nativa; sin dependencias extra.)

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  type Membresia,
  decidirAccion,
  membresiaCubreTenant,
  perteneceAlTenant,
  rolesEnTenant,
} from './decision.ts';

// --- Fixtures: dos corporativos aislados -----------------------------------
const CORP_A = 'corp-A';
const CORP_B = 'corp-B';
const A1 = 'antro-A1';
const A2 = 'antro-A2';
const B1 = 'antro-B1';

const m = (rol: string, corporativo_id: string, antro_id: string | null): Membresia =>
  ({ rol, corporativo_id, antro_id });

// Personal atado a un antro
const cadeneroA1 = [m('cadenero', CORP_A, A1)];
const hostessA1 = [m('hostess', CORP_A, A1)];
const capitanA2 = [m('capitan', CORP_A, A2)];
const cajeroA1 = [m('cajero', CORP_A, A1)];
const gerenteA1 = [m('gerente', CORP_A, A1)]; // gerente individual (un antro)
const cadeneroB1 = [m('cadenero', CORP_B, B1)];
// Personal de alcance corporativo (cualquier antro de su corporativo)
const gerenteGeneralA = [m('gerente_general', CORP_A, null)];
const duenoA = [m('dueno', CORP_A, null)];
// Transversal
const superAdmin = [m('super_admin', CORP_A, null)];
// Sin membresía (cliente final puro) y personal revocado (sin membresías activas)
const cliente: Membresia[] = [];
const revocado: Membresia[] = [];
// Caso borde: una persona con roles en DOS corporativos distintos
const multiCorp = [m('cadenero', CORP_A, A1), m('hostess', CORP_B, B1)];

// Oráculo de la matriz de permisos (subconjunto real de CLAUDE.md §5).
const MATRIZ: Record<string, string[]> = {
  escanear_puerta: ['cadenero', 'hostess'],
  asignar_mover_mesa: ['hostess', 'capitan', 'gerente', 'gerente_general'],
  gestionar_invitaciones: ['capitan', 'gerente', 'gerente_general', 'super_admin'],
  ver_metricas_antro: ['gerente', 'gerente_general', 'dueno', 'socio', 'super_admin'],
  capturar_consumo: ['cajero', 'super_admin'],
  contador_sin_reserva: ['cadenero'],
};
const ACCIONES_CLIENTE = ['crear_reserva', 'cancelar_reserva_propia'];

// Réplica del contrato de `puedeAccion` usando la lógica pura: acota roles al
// tenant y consulta la matriz. Es lo que hace la Edge Function.
function puede(
  membresias: Membresia[],
  accion: string,
  tenant?: { corporativoId?: string | null; antroId?: string | null },
): boolean {
  return decidirAccion(membresias, accion, {
    accionesCliente: ACCIONES_CLIENTE,
    tenant,
    rolPermiteAccion: (roles) => roles.some((r) => (MATRIZ[accion] ?? []).includes(r)),
  });
}

// ===========================================================================
// 1. Pertenencia al tenant (verificarTenant) — el muro de aislamiento
// ===========================================================================
test('pertenencia: el personal solo alcanza SU antro', () => {
  assert.equal(perteneceAlTenant(cadeneroA1, { corporativoId: CORP_A, antroId: A1 }), true);
  // Mismo corporativo, OTRO antro → denegado (rol atado a un antro).
  assert.equal(perteneceAlTenant(cadeneroA1, { corporativoId: CORP_A, antroId: A2 }), false);
});

test('pertenencia: NADIE cruza a otro corporativo', () => {
  assert.equal(perteneceAlTenant(cadeneroA1, { corporativoId: CORP_B, antroId: B1 }), false);
  assert.equal(perteneceAlTenant(cadeneroA1, { corporativoId: CORP_B }), false);
  assert.equal(perteneceAlTenant(gerenteGeneralA, { corporativoId: CORP_B, antroId: B1 }), false);
  assert.equal(perteneceAlTenant(gerenteA1, { corporativoId: CORP_B }), false);
  // Y en la dirección inversa (B hacia A).
  assert.equal(perteneceAlTenant(cadeneroB1, { corporativoId: CORP_A, antroId: A1 }), false);
});

test('pertenencia: alcance corporativo cubre cualquier antro de SU corporativo', () => {
  assert.equal(perteneceAlTenant(gerenteGeneralA, { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(perteneceAlTenant(gerenteGeneralA, { corporativoId: CORP_A, antroId: A2 }), true);
  assert.equal(perteneceAlTenant(duenoA, { corporativoId: CORP_A, antroId: A2 }), true);
});

test('pertenencia: gerente individual NO cubre otro antro del mismo corporativo', () => {
  assert.equal(perteneceAlTenant(gerenteA1, { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(perteneceAlTenant(gerenteA1, { corporativoId: CORP_A, antroId: A2 }), false);
});

test('pertenencia: super_admin es transversal; cliente/revocado no pertenecen a nada', () => {
  assert.equal(perteneceAlTenant(superAdmin, { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(perteneceAlTenant(superAdmin, { corporativoId: CORP_B, antroId: B1 }), true);
  assert.equal(perteneceAlTenant(cliente, { corporativoId: CORP_A, antroId: A1 }), false);
  assert.equal(perteneceAlTenant(revocado, { corporativoId: CORP_A }), false);
});

test('pertenencia: persona con roles en dos corporativos solo alcanza el que corresponde', () => {
  assert.equal(perteneceAlTenant(multiCorp, { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(perteneceAlTenant(multiCorp, { corporativoId: CORP_B, antroId: B1 }), true);
  // No mezcla: su rol en A no le da el antro A2, ni su rol en B otro antro.
  assert.equal(perteneceAlTenant(multiCorp, { corporativoId: CORP_A, antroId: A2 }), false);
});

// ===========================================================================
// 2. Acción completa (matriz + aislamiento) — puedeAccion
// ===========================================================================
test('acción: el cadenero escanea en SU puerta, no en otra', () => {
  assert.equal(puede(cadeneroA1, 'escanear_puerta', { corporativoId: CORP_A, antroId: A1 }), true);
  // Otro antro del mismo corporativo → denegado.
  assert.equal(puede(cadeneroA1, 'escanear_puerta', { corporativoId: CORP_A, antroId: A2 }), false);
});

test('acción: CROSS-TENANT — un cadenero NO puede operar la puerta de otro corporativo', () => {
  // Aunque tenga el rol "cadenero", en el corporativo B no cuenta: denegado.
  assert.equal(puede(cadeneroA1, 'escanear_puerta', { corporativoId: CORP_B, antroId: B1 }), false);
  assert.equal(puede(cadeneroB1, 'escanear_puerta', { corporativoId: CORP_A, antroId: A1 }), false);
});

test('acción: el gerente general gestiona invitaciones en SU corporativo, no en otro', () => {
  assert.equal(puede(gerenteGeneralA, 'gestionar_invitaciones', { corporativoId: CORP_A }), true);
  assert.equal(puede(gerenteGeneralA, 'gestionar_invitaciones', { corporativoId: CORP_B }), false);
});

test('acción: la matriz sigue negando lo que el rol no puede, aun en su propio antro', () => {
  // El capitán no captura consumo (eso es del cajero), ni en su antro.
  assert.equal(puede(capitanA2, 'capturar_consumo', { corporativoId: CORP_A, antroId: A2 }), false);
  // El cajero sí, en su antro; pero no en el ajeno.
  assert.equal(puede(cajeroA1, 'capturar_consumo', { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(puede(cajeroA1, 'capturar_consumo', { corporativoId: CORP_B, antroId: B1 }), false);
});

test('acción: el cliente puede crear reserva en cualquier antro; nada operativo', () => {
  assert.equal(puede(cliente, 'crear_reserva', { corporativoId: CORP_A, antroId: A1 }), true);
  assert.equal(puede(cliente, 'crear_reserva', { corporativoId: CORP_B, antroId: B1 }), true);
  // Pero no acciones de personal.
  assert.equal(puede(cliente, 'escanear_puerta', { corporativoId: CORP_A, antroId: A1 }), false);
  assert.equal(puede(cliente, 'gestionar_invitaciones', { corporativoId: CORP_A }), false);
});

test('acción: personal revocado (sin membresías activas) pierde el acceso al instante', () => {
  assert.equal(puede(revocado, 'escanear_puerta', { corporativoId: CORP_A, antroId: A1 }), false);
});

test('acción: super_admin es transversal en la matriz', () => {
  assert.equal(puede(superAdmin, 'gestionar_invitaciones', { corporativoId: CORP_B }), true);
  assert.equal(puede(superAdmin, 'ver_metricas_antro', { corporativoId: CORP_B, antroId: B1 }), true);
});

test('acción: la persona multi-corporativo actúa con el rol correcto en cada uno', () => {
  // hostess en B1 → puede escanear en B1; cadenero en A1 → puede en A1.
  assert.equal(puede(multiCorp, 'escanear_puerta', { corporativoId: CORP_B, antroId: B1 }), true);
  assert.equal(puede(multiCorp, 'escanear_puerta', { corporativoId: CORP_A, antroId: A1 }), true);
  // hostess mueve mesa (permiso de hostess) solo en B1, no en A (ahí es cadenero).
  assert.equal(puede(multiCorp, 'asignar_mover_mesa', { corporativoId: CORP_B, antroId: B1 }), true);
  assert.equal(puede(multiCorp, 'asignar_mover_mesa', { corporativoId: CORP_A, antroId: A1 }), false);
});

// ===========================================================================
// 3. Utilidades de apoyo
// ===========================================================================
test('rolesEnTenant: acota los roles al corporativo/antro objetivo', () => {
  assert.deepEqual(rolesEnTenant(cadeneroA1, { corporativoId: CORP_A, antroId: A1 }), ['cadenero']);
  assert.deepEqual(rolesEnTenant(cadeneroA1, { corporativoId: CORP_B, antroId: B1 }), []);
  // Sin tenant, no se acota (uso para acciones no ligadas a un tenant).
  assert.deepEqual(rolesEnTenant(cadeneroA1), ['cadenero']);
});

test('membresiaCubreTenant: solo corporativo (sin antro) exige coincidencia de corporativo', () => {
  assert.equal(membresiaCubreTenant(cadeneroA1[0], { corporativoId: CORP_A }), true);
  assert.equal(membresiaCubreTenant(cadeneroA1[0], { corporativoId: CORP_B }), false);
});
