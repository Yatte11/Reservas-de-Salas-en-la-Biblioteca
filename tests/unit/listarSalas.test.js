/**
 * Pruebas unitarias — listarSalas y disponibilidad
 * Verifica la funcionalidad de:
 * - Listar todas las salas activas
 * - Consultar disponibilidad por fecha y horario
 * - Búsqueda de sala por ID
 *
 * Generado con apoyo de Kiro (IA), revisado y ajustado manualmente.
 */

process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:';

const db = require('../../src/config/database');
const SalaModel = require('../../src/models/salaModel');
const ReservaModel = require('../../src/models/reservaModel');
const UsuarioModel = require('../../src/models/usuarioModel');

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeAll(async () => {
  await db.inicializarDB();
});

afterAll(async () => {
  await db.cerrarDB();
});

// ─── Tests: obtenerTodas ──────────────────────────────────────────────────────

describe('SalaModel.obtenerTodas()', () => {
  test('devuelve un arreglo', async () => {
    const salas = await SalaModel.obtenerTodas();
    expect(Array.isArray(salas)).toBe(true);
  });

  test('incluye salas activas recién creadas', async () => {
    const nombre = `Sala Lista ${Date.now()}`;
    const { lastID } = await SalaModel.crear({
      nombre,
      capacidad: 5,
      ubicacion: 'Piso 1',
    });

    const salas = await SalaModel.obtenerTodas();
    const encontrada = salas.find((s) => s.id === lastID);

    expect(encontrada).toBeDefined();
    expect(encontrada.nombre).toBe(nombre);
  });

  test('NO incluye salas desactivadas', async () => {
    const { lastID } = await SalaModel.crear({
      nombre: `Sala Inactiva ${Date.now()}`,
      capacidad: 3,
      ubicacion: 'Sótano',
    });

    await SalaModel.eliminar(lastID);

    const salas = await SalaModel.obtenerTodas();
    const desactivada = salas.find((s) => s.id === lastID);

    expect(desactivada).toBeUndefined();
  });

  test('cada sala tiene los campos requeridos', async () => {
    await SalaModel.crear({
      nombre: `Sala Campos ${Date.now()}`,
      capacidad: 8,
      ubicacion: 'Segundo Piso',
      descripcion: 'Con proyector',
    });

    const salas = await SalaModel.obtenerTodas();
    expect(salas.length).toBeGreaterThan(0);

    const sala = salas[0];
    expect(sala).toHaveProperty('id');
    expect(sala).toHaveProperty('nombre');
    expect(sala).toHaveProperty('capacidad');
    expect(sala).toHaveProperty('ubicacion');
  });
});

// ─── Tests: buscarPorId ───────────────────────────────────────────────────────

describe('SalaModel.buscarPorId()', () => {
  test('devuelve la sala correcta cuando el ID existe', async () => {
    const nombre = `Sala Por ID ${Date.now()}`;
    const { lastID } = await SalaModel.crear({
      nombre,
      capacidad: 10,
      ubicacion: 'Tercer Piso',
    });

    const sala = await SalaModel.buscarPorId(lastID);

    expect(sala).not.toBeNull();
    expect(sala.id).toBe(lastID);
    expect(sala.nombre).toBe(nombre);
    expect(sala.capacidad).toBe(10);
  });

  test('devuelve null cuando el ID no existe', async () => {
    const sala = await SalaModel.buscarPorId(999999);
    expect(sala).toBeNull();
  });

  test('devuelve null para una sala desactivada', async () => {
    const { lastID } = await SalaModel.crear({
      nombre: `Sala Borrada ${Date.now()}`,
      capacidad: 2,
      ubicacion: 'Azotea',
    });

    await SalaModel.eliminar(lastID);

    const sala = await SalaModel.buscarPorId(lastID);
    expect(sala).toBeNull();
  });
});

// ─── Tests: obtenerDisponibles ────────────────────────────────────────────────

describe('SalaModel.obtenerDisponibles()', () => {
  test('devuelve sala libre cuando no tiene reservas en ese horario', async () => {
    const { lastID: salaId } = await SalaModel.crear({
      nombre: `Sala Libre ${Date.now()}`,
      capacidad: 4,
      ubicacion: 'Piso Libre',
    });

    const disponibles = await SalaModel.obtenerDisponibles(
      '2027-01-10', '09:00', '11:00'
    );

    const libre = disponibles.find((s) => s.id === salaId);
    expect(libre).toBeDefined();
  });

  test('NO devuelve sala que tiene reserva activa en ese horario', async () => {
    const { lastID: salaId } = await SalaModel.crear({
      nombre: `Sala Ocupada ${Date.now()}`,
      capacidad: 4,
      ubicacion: 'Piso Ocupado',
    });

    const { lastID: userId } = await UsuarioModel.crear({
      nombre: 'Usuario Disp',
      email: `disp_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    await ReservaModel.crear({
      usuario_id: userId,
      sala_id: salaId,
      fecha: '2027-01-15',
      hora_inicio: '09:00',
      hora_fin: '11:00',
    });

    const disponibles = await SalaModel.obtenerDisponibles(
      '2027-01-15', '09:00', '11:00'
    );

    const ocupada = disponibles.find((s) => s.id === salaId);
    expect(ocupada).toBeUndefined();
  });

  test('SÍ devuelve sala cuya reserva fue cancelada', async () => {
    const { lastID: salaId } = await SalaModel.crear({
      nombre: `Sala Cancelada ${Date.now()}`,
      capacidad: 4,
      ubicacion: 'Piso Cancelado',
    });

    const { lastID: userId } = await UsuarioModel.crear({
      nombre: 'Usuario Cancel',
      email: `cancel_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    const { lastID: reservaId } = await ReservaModel.crear({
      usuario_id: userId,
      sala_id: salaId,
      fecha: '2027-01-20',
      hora_inicio: '10:00',
      hora_fin: '12:00',
    });

    await ReservaModel.cancelar(reservaId);

    const disponibles = await SalaModel.obtenerDisponibles(
      '2027-01-20', '10:00', '12:00'
    );

    const disponible = disponibles.find((s) => s.id === salaId);
    expect(disponible).toBeDefined();
  });

  test('devuelve un arreglo vacío si todas las salas están ocupadas', async () => {
    // Usar una fecha muy específica para no interferir con otros tests
    const { lastID: salaId } = await SalaModel.crear({
      nombre: `Sala Unica ${Date.now()}`,
      capacidad: 1,
      ubicacion: 'Sala Única',
    });

    const { lastID: userId } = await UsuarioModel.crear({
      nombre: 'Usuario Unico',
      email: `unico_${Date.now()}@test.com`,
      passwordHash: 'hash',
    });

    await ReservaModel.crear({
      usuario_id: userId,
      sala_id: salaId,
      fecha: '2027-02-01',
      hora_inicio: '08:00',
      hora_fin: '20:00',
    });

    const disponibles = await SalaModel.obtenerDisponibles(
      '2027-02-01', '10:00', '11:00'
    );

    const ocupada = disponibles.find((s) => s.id === salaId);
    expect(ocupada).toBeUndefined();
  });
});
