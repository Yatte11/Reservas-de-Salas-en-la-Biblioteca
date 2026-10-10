/**
 * Pruebas unitarias — listarReservas
 * Controlador: src/controllers/reservaController.js
 * Función:     listarReservas (GET /api/v1/reservas)
 */

jest.mock('../../src/models/reservaModel');
jest.mock('../../src/models/salaModel');
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
}));

const ReservaModel = require('../../src/models/reservaModel');
const { listarReservas } = require('../../src/controllers/reservaController');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Construye un objeto req mínimo para el controlador.
 * @param {object} usuario  - Datos del usuario autenticado (id, rol)
 * @param {object} query    - Query string params
 */
const buildReq = (usuario = { id: 1, rol: 'usuario' }, query = {}) => ({
  usuario,
  query,
});

/**
 * Construye un objeto res con los métodos que usa el controlador.
 * Devuelve { res, statusCode, body } para verificar la respuesta.
 */
const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const buildNext = () => jest.fn();

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const reservasUsuario = [
  {
    id: 1, fecha: '2026-11-10', hora_inicio: '10:00', hora_fin: '12:00',
    proposito: 'Estudio', estado: 'activa', fecha_creacion: '2026-10-01T00:00:00',
    sala_id: 2, sala_nombre: 'Sala B', sala_ubicacion: 'Planta Baja',
  },
  {
    id: 2, fecha: '2026-10-05', hora_inicio: '14:00', hora_fin: '15:00',
    proposito: null, estado: 'cancelada', fecha_creacion: '2026-09-20T00:00:00',
    sala_id: 3, sala_nombre: 'Sala C', sala_ubicacion: 'Primer Piso',
  },
];

const reservasAdmin = [
  ...reservasUsuario,
  {
    id: 3, fecha: '2026-11-15', hora_inicio: '08:00', hora_fin: '09:00',
    proposito: 'Reunión', estado: 'activa', fecha_creacion: '2026-10-02T00:00:00',
    sala_nombre: 'Sala A', usuario_nombre: 'Otro Usuario', usuario_email: 'otro@mail.com',
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('listarReservas', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Grupo 1: usuario normal ---

  it('caso 1 — usuario normal sin filtros recibe sus reservas con status 200', async () => {
    ReservaModel.obtenerPorUsuario.mockResolvedValue(reservasUsuario);

    const req  = buildReq({ id: 1, rol: 'usuario' }, {});
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mensaje: 'Reservas obtenidas correctamente',
      datos: reservasUsuario,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('caso 2 — usuario normal con ?estado=activa pasa el filtro al modelo', async () => {
    ReservaModel.obtenerPorUsuario.mockResolvedValue([reservasUsuario[0]]);

    const req  = buildReq({ id: 1, rol: 'usuario' }, { estado: 'activa' });
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(ReservaModel.obtenerPorUsuario).toHaveBeenCalledWith(
      1,
      { estado: 'activa', fecha: undefined }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('caso 3 — usuario normal con ?fecha=2026-11-01 pasa el filtro al modelo', async () => {
    ReservaModel.obtenerPorUsuario.mockResolvedValue([]);

    const req  = buildReq({ id: 1, rol: 'usuario' }, { fecha: '2026-11-01' });
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(ReservaModel.obtenerPorUsuario).toHaveBeenCalledWith(
      1,
      { estado: undefined, fecha: '2026-11-01' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('caso 4 — usuario normal con ambos filtros los pasa correctamente al modelo', async () => {
    ReservaModel.obtenerPorUsuario.mockResolvedValue([]);

    const req  = buildReq(
      { id: 5, rol: 'usuario' },
      { estado: 'cancelada', fecha: '2026-11-01' }
    );
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(ReservaModel.obtenerPorUsuario).toHaveBeenCalledWith(
      5,
      { estado: 'cancelada', fecha: '2026-11-01' }
    );
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('caso 4b — el controlador usa el id del usuario autenticado, no otro', async () => {
    ReservaModel.obtenerPorUsuario.mockResolvedValue([]);

    const req  = buildReq({ id: 42, rol: 'usuario' }, {});
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    // El primer argumento debe ser exactamente el id del usuario autenticado
    expect(ReservaModel.obtenerPorUsuario).toHaveBeenCalledWith(
      42,
      expect.any(Object)
    );
  });

  // --- Grupo 2: administrador ---

  it('caso 5 — admin recibe todas las reservas con status 200', async () => {
    ReservaModel.obtenerTodas.mockResolvedValue(reservasAdmin);

    const req  = buildReq({ id: 1, rol: 'admin' }, {});
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(ReservaModel.obtenerTodas).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mensaje: 'Reservas obtenidas correctamente',
      datos: reservasAdmin,
    });
  });

  it('caso 6 — admin ignora los query params y siempre usa obtenerTodas', async () => {
    ReservaModel.obtenerTodas.mockResolvedValue(reservasAdmin);

    const req  = buildReq({ id: 1, rol: 'admin' }, { estado: 'activa' });
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(ReservaModel.obtenerTodas).toHaveBeenCalled();
    expect(ReservaModel.obtenerPorUsuario).not.toHaveBeenCalled();
  });

  // --- Grupo 3: manejo de errores ---

  it('caso 7 — error de BD en obtenerPorUsuario propaga al next', async () => {
    const dbError = new Error('DB error simulado');
    ReservaModel.obtenerPorUsuario.mockRejectedValue(dbError);

    const req  = buildReq({ id: 1, rol: 'usuario' }, {});
    const res  = buildRes();
    const next = buildNext();

    await listarReservas(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });
});
