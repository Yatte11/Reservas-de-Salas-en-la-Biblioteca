/**
 * Pruebas unitarias — cancelarReserva
 * Controlador: src/controllers/reservaController.js
 * Función:     cancelarReserva (DELETE /api/v1/reservas/:id)
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
const { cancelarReserva } = require('../../src/controllers/reservaController');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const buildReq = (usuario = { id: 1, rol: 'usuario' }, params = { id: '1' }) => ({
  usuario,
  params,
});

const buildRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json   = jest.fn().mockReturnValue(res);
  return res;
};

const buildNext = () => jest.fn();

// ---------------------------------------------------------------------------
// Fechas fijas de referencia
//
// "Ahora" fijo: 2026-10-10 12:00:00 UTC  →  07:00 Ecuador (UTC-05:00)
// Reserva pasada:  fecha=2026-10-10  hora_inicio=06:00  (01:00 UTC+5 = 06:00-05:00 → ya pasó)
// Reserva futura:  fecha=2026-11-15  hora_inicio=10:00  (15:00 UTC → aún no llega)
// ---------------------------------------------------------------------------

const AHORA_FIJO = new Date('2026-10-10T12:00:00Z'); // mediodía UTC = 07:00 Ecuador

/**
 * Genera una reserva base válida con fecha futura.
 * Sobreescribe los campos que se pasen en `overrides`.
 */
const reservaFutura = (overrides = {}) => ({
  id: 1,
  usuario_id: 1,
  sala_id: 2,
  fecha: '2026-11-15',
  hora_inicio: '10:00',
  hora_fin: '12:00',
  proposito: 'Estudio',
  estado: 'activa',
  fecha_creacion: '2026-10-01T00:00:00',
  sala_nombre: 'Sala B',
  usuario_nombre: 'Estudiante Uno',
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cancelarReserva', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Fijar el reloj en AHORA_FIJO para reproducibilidad en todos los casos
    jest.useFakeTimers({ now: AHORA_FIJO });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // -------------------------------------------------------------------------
  // Grupo A — control de acceso y existencia
  // -------------------------------------------------------------------------

  it('caso 1 — reserva inexistente responde 404', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(null);

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '99' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, mensaje: 'Reserva no encontrada' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('caso 2 — usuario intenta cancelar reserva ajena responde 403', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ usuario_id: 99 }) // dueño es 99
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' }); // usuario autenticado es 1
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, mensaje: 'No tienes permiso para cancelar esta reserva' })
    );
  });

  it('caso 3 — admin puede cancelar reserva de otro usuario', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ usuario_id: 99 }) // dueño es 99
    );
    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req  = buildReq({ id: 1, rol: 'admin' }, { id: '1' }); // admin es 1
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, mensaje: 'Reserva cancelada correctamente' })
    );
  });

  // -------------------------------------------------------------------------
  // Grupo B — validación de estado
  // -------------------------------------------------------------------------

  it('caso 4 — cancelar reserva ya cancelada responde 400 con mensaje específico', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ estado: 'cancelada' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, mensaje: 'La reserva ya está cancelada' })
    );
  });

  it('caso 5 — cancelar reserva completada responde 400 con mensaje específico', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ estado: 'completada' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'No se puede cancelar una reserva que ya fue completada',
      })
    );
  });

  // -------------------------------------------------------------------------
  // Grupo C — validación de fecha y hora
  // -------------------------------------------------------------------------

  it('caso 6 — reserva que ya comenzó (hora pasada hoy) responde 400', async () => {
    // AHORA_FIJO = 2026-10-10T12:00Z = 07:00 Ecuador
    // inicio = 2026-10-10T06:00-05:00 = 2026-10-10T11:00Z → ya pasó respecto a 12:00Z
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: '2026-10-10', hora_inicio: '06:00' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'No se puede cancelar una reserva que ya ha comenzado o finalizado',
      })
    );
  });

  it('caso 7 — reserva con inicio en el futuro se cancela correctamente', async () => {
    // AHORA_FIJO = 2026-10-10T12:00Z = 07:00 Ecuador
    // inicio = 2026-11-15T10:00-05:00 = 2026-11-15T15:00Z → aún no llega
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: '2026-11-15', hora_inicio: '10:00' })
    );
    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, mensaje: 'Reserva cancelada correctamente' })
    );
  });

  it('caso 8 — inicio exactamente igual a "ahora" (borde <=) responde 400', async () => {
    // AHORA_FIJO = 2026-10-10T12:00:00Z = 07:00 Ecuador
    // inicio = 2026-10-10T07:00-05:00 = 2026-10-10T12:00:00Z → igual a AHORA_FIJO → <=
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: '2026-10-10', hora_inicio: '07:00' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'No se puede cancelar una reserva que ya ha comenzado o finalizado',
      })
    );
  });

  it('caso 9 — fecha imposible en BD (2026-02-30) responde 500', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: '2026-02-30', hora_inicio: '10:00' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'La reserva tiene una fecha inválida en el calendario',
      })
    );
  });

  it('caso 10 — formato de fecha corrupto en BD responde 500', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: 'no-es-fecha', hora_inicio: '10:00' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'La reserva tiene datos de fecha u hora inválidos',
      })
    );
  });

  it('caso 11 — formato de hora corrupto en BD responde 500', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({ fecha: '2026-11-15', hora_inicio: '99:99' })
    );

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        mensaje: 'La reserva tiene datos de fecha u hora inválidos',
      })
    );
  });

  // -------------------------------------------------------------------------
  // Grupo D — flujo completo exitoso
  // -------------------------------------------------------------------------

  it('caso 12 — cancelación exitosa llama a ReservaModel.cancelar con el id correcto', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(reservaFutura({ id: 7 }));
    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '7' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(ReservaModel.cancelar).toHaveBeenCalledWith(7);
  });

  it('caso 13 — respuesta exitosa tiene success: true y mensaje correcto', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(reservaFutura());
    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.json).toHaveBeenCalledWith({
      success: true,
      mensaje: 'Reserva cancelada correctamente',
      datos: null,
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('caso 14 — error de BD en cancelar propaga al next', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(reservaFutura());
    const dbError = new Error('DB write error simulado');
    ReservaModel.cancelar.mockRejectedValue(dbError);

    const req  = buildReq({ id: 1, rol: 'usuario' }, { id: '1' });
    const res  = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('caso manual 15 — permite cancelar un minuto antes del inicio', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({
        fecha: '2026-10-10',
        hora_inicio: '07:01',
      })
    );

    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req = buildReq(
      { id: 1, rol: 'usuario' },
      { id: '1' }
    );
    const res = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(ReservaModel.cancelar).toHaveBeenCalledWith(1);
    expect(next).not.toHaveBeenCalled();
  });


  it('caso manual 16 — permite cancelar una reserva del 29 de febrero en año bisiesto', async () => {
    ReservaModel.buscarPorId.mockResolvedValue(
      reservaFutura({
        fecha: '2028-02-29',
        hora_inicio: '10:00',
      })
    );

    ReservaModel.cancelar.mockResolvedValue({ changes: 1 });

    const req = buildReq(
      { id: 1, rol: 'usuario' },
      { id: '1' }
    );
    const res = buildRes();
    const next = buildNext();

    await cancelarReserva(req, res, next);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(ReservaModel.cancelar).toHaveBeenCalledWith(1);
    expect(next).not.toHaveBeenCalled();
  });

});
