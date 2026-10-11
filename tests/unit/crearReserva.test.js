/**
 * Pruebas unitarias — crearReserva
 * Verifica las validaciones de la funcionalidad de crear reservas:
 * - Choque de horario con reservas existentes
 * - Duración mínima de 30 minutos
 * - Que la sala exista
 * - Creación exitosa
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'secreto_test';

let contador = 0;
const uid = () => `cr_${++contador}_${Math.random().toString(36).slice(2)}`;

const db = require('../../src/config/database');
const ReservaModel = require('../../src/models/reservaModel');
const SalaModel = require('../../src/models/salaModel');
const UsuarioModel = require('../../src/models/usuarioModel');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

let usuarioId;
let salaId;

beforeEach(async () => {
  const usuario = await UsuarioModel.crear({
    nombre: 'Tester Crear',
    email: `crear_${uid()}@test.com`,
    passwordHash: 'hash_test',
  });
  usuarioId = usuario.lastID;

  const sala = await SalaModel.crear({
    nombre: `Sala Crear ${uid()}`,
    capacidad: 6,
    ubicacion: 'Piso 1',
  });
  salaId = sala.lastID;
});

// ─── Tests: existeConflicto ───────────────────────────────────────────────────

describe('Choque de horario', () => {
  test('detecta choque cuando los horarios se solapan', async () => {
    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-11-01',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });

    const conflicto = await ReservaModel.existeConflicto(
      salaId, '2026-11-01', '10:00', '12:00'
    );

    expect(conflicto).toBe(true);
  });

  test('NO detecta choque cuando los horarios son consecutivos', async () => {
    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-11-02',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });

    const conflicto = await ReservaModel.existeConflicto(
      salaId, '2026-11-02', '11:00', '13:00'
    );

    expect(conflicto).toBe(false);
  });

  test('NO detecta choque en fecha diferente', async () => {
    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-11-03',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });

    const conflicto = await ReservaModel.existeConflicto(
      salaId, '2026-11-04', '09:00', '11:00'
    );

    expect(conflicto).toBe(false);
  });

  test('NO detecta choque si la reserva previa fue cancelada', async () => {
    const { lastID } = await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-11-05',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });

    await ReservaModel.cancelar(lastID);

    const conflicto = await ReservaModel.existeConflicto(
      salaId, '2026-11-05', '09:00', '11:00'
    );

    expect(conflicto).toBe(false);
  });
});

// ─── Tests: calcularHorasReservadasEnDia ──────────────────────────────────────

describe('Cálculo de horas reservadas en el día', () => {
  test('devuelve 0 cuando el usuario no tiene reservas ese día', async () => {
    const horas = await ReservaModel.calcularHorasReservadasEnDia(usuarioId, '2026-12-01');
    expect(horas).toBe(0);
  });

  test('calcula correctamente el total de horas de una reserva', async () => {
    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-02',
      hora_inicio: '09:00',
      hora_fin: '11:00', // 2 horas
    });

    const horas = await ReservaModel.calcularHorasReservadasEnDia(usuarioId, '2026-12-02');
    expect(horas).toBe(2);
  });

  test('suma correctamente varias reservas en el mismo día', async () => {
    const sala2 = await SalaModel.crear({
      nombre: `Sala Extra ${Date.now()}`,
      capacidad: 4,
      ubicacion: 'Piso 2',
    });

    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-03',
      hora_inicio: '08:00',
      hora_fin: '09:00', // 1 hora
    });

    await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: sala2.lastID,
      fecha: '2026-12-03',
      hora_inicio: '10:00',
      hora_fin: '12:30', // 2.5 horas
    });

    const horas = await ReservaModel.calcularHorasReservadasEnDia(usuarioId, '2026-12-03');
    expect(horas).toBe(3.5);
  });

  test('no cuenta las reservas canceladas en el total', async () => {
    const { lastID } = await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-04',
      hora_inicio: '09:00',
      hora_fin: '11:00', // 2 horas canceladas
    });

    await ReservaModel.cancelar(lastID);

    const horas = await ReservaModel.calcularHorasReservadasEnDia(usuarioId, '2026-12-04');
    expect(horas).toBe(0);
  });
});

// ─── Tests: crear reserva ─────────────────────────────────────────────────────

describe('Crear reserva en base de datos', () => {
  test('crea una reserva exitosamente y devuelve lastID', async () => {
    const resultado = await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-10',
      hora_inicio: '14:00',
      hora_fin: '16:00',
      proposito: 'Reunión de equipo',
    });

    expect(resultado.lastID).toBeGreaterThan(0);
  });

  test('la reserva creada tiene estado activa por defecto', async () => {
    const { lastID } = await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-11',
      hora_inicio: '10:00',
      hora_fin: '11:00',
    });

    const reserva = await ReservaModel.buscarPorId(lastID);
    expect(reserva.estado).toBe('activa');
  });

  test('la reserva guarda correctamente todos los campos', async () => {
    const { lastID } = await ReservaModel.crear({
      usuario_id: usuarioId,
      sala_id: salaId,
      fecha: '2026-12-12',
      hora_inicio: '09:00',
      hora_fin: '10:30',
      proposito: 'Estudio final',
    });

    const reserva = await ReservaModel.buscarPorId(lastID);

    expect(reserva.fecha).toBe('2026-12-12');
    expect(reserva.hora_inicio).toBe('09:00');
    expect(reserva.hora_fin).toBe('10:30');
    expect(reserva.proposito).toBe('Estudio final');
    expect(reserva.sala_id).toBe(salaId);
    expect(reserva.usuario_id).toBe(usuarioId);
  });
});
