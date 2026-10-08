/**
 * Controlador de Reservas
 * Maneja la creación, consulta y cancelación de reservas
 */

const ReservaModel = require('../models/reservaModel');
const SalaModel = require('../models/salaModel');
const { exito, error } = require('../utils/respuesta');
const logger = require('../utils/logger');

/**
 * GET /api/v1/reservas
 * Lista las reservas del usuario autenticado (o todas si es admin)
 */
const listarReservas = async (req, res, next) => {
  try {
    let reservas;
    if (req.usuario.rol === 'admin') {
      reservas = await ReservaModel.obtenerTodas();
    } else {
      reservas = await ReservaModel.obtenerPorUsuario(req.usuario.id);
    }
    return exito(res, reservas, 'Reservas obtenidas correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/reservas/:id
 * Obtiene el detalle de una reserva específica
 */
const obtenerReserva = async (req, res, next) => {
  try {
    const reserva = await ReservaModel.buscarPorId(parseInt(req.params.id));

    if (!reserva) {
      return error(res, 'Reserva no encontrada', 404);
    }

    // Solo el dueño o un admin puede ver la reserva
    if (req.usuario.rol !== 'admin' && reserva.usuario_id !== req.usuario.id) {
      return error(res, 'No tienes permiso para ver esta reserva', 403);
    }

    return exito(res, reserva, 'Reserva obtenida correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/reservas
 * Crea una nueva reserva para el usuario autenticado
 */
const crearReserva = async (req, res, next) => {
  try {
    const { sala_id, fecha, hora_inicio, hora_fin, proposito } = req.body;

    // Validar que hora_inicio < hora_fin
    if (hora_inicio >= hora_fin) {
      return error(res, 'La hora de inicio debe ser anterior a la hora de fin', 400);
    }

    // Verificar que la sala existe
    const sala = await SalaModel.buscarPorId(sala_id);
    if (!sala) {
      return error(res, 'La sala especificada no existe', 404);
    }

    // Verificar que no haya conflicto de horario
    const hayConflicto = await ReservaModel.existeConflicto(sala_id, fecha, hora_inicio, hora_fin);
    if (hayConflicto) {
      return error(
        res,
        'La sala ya tiene una reserva en ese horario. Por favor elige otro horario.',
        409
      );
    }

    const { lastID } = await ReservaModel.crear({
      usuario_id: req.usuario.id,
      sala_id,
      fecha,
      hora_inicio,
      hora_fin,
      proposito,
    });

    logger.info('Nueva reserva creada', {
      id: lastID,
      usuario: req.usuario.id,
      sala: sala_id,
      fecha,
    });

    const reservaNueva = await ReservaModel.buscarPorId(lastID);
    return exito(res, reservaNueva, 'Reserva creada correctamente', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/reservas/:id
 * Cancela una reserva (solo el dueño o admin)
 */
const cancelarReserva = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const reserva = await ReservaModel.buscarPorId(id);

    if (!reserva) {
      return error(res, 'Reserva no encontrada', 404);
    }

    // Solo el dueño o admin puede cancelar
    if (req.usuario.rol !== 'admin' && reserva.usuario_id !== req.usuario.id) {
      return error(res, 'No tienes permiso para cancelar esta reserva', 403);
    }

    if (reserva.estado === 'cancelada') {
      return error(res, 'La reserva ya está cancelada', 400);
    }

    await ReservaModel.cancelar(id);
    logger.info('Reserva cancelada', { id, usuario: req.usuario.id });

    return exito(res, null, 'Reserva cancelada correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/salas/:id/reservas
 * Lista las reservas activas de una sala específica
 */
const reservasPorSala = async (req, res, next) => {
  try {
    const salaId = parseInt(req.params.id);
    const sala = await SalaModel.buscarPorId(salaId);

    if (!sala) {
      return error(res, 'Sala no encontrada', 404);
    }

    const reservas = await ReservaModel.obtenerPorSala(salaId);
    return exito(res, reservas, 'Reservas de la sala obtenidas correctamente');
  } catch (err) {
    next(err);
  }
};

module.exports = { listarReservas, obtenerReserva, crearReserva, cancelarReserva, reservasPorSala };
