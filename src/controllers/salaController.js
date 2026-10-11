/**
 * Controlador de Salas
 * Maneja el CRUD de salas y la consulta de disponibilidad
 */

const SalaModel = require('../models/salaModel');
const { exito, error } = require('../utils/respuesta');
const logger = require('../utils/logger');

/**
 * GET /api/v1/salas
 * Lista todas las salas activas
 */
const listarSalas = async (req, res, next) => {
  try {
    const salas = await SalaModel.obtenerTodas();
    return exito(res, salas, 'Salas obtenidas correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/salas/disponibles
 * Lista salas disponibles para un rango de fecha/hora
 */
const salasdisponibles = async (req, res, next) => {
  try {
    const { fecha, hora_inicio, hora_fin } = req.query;

    if (hora_inicio && hora_fin && hora_inicio >= hora_fin) {
      return error(res, 'La hora de inicio debe ser anterior a la hora de fin', 400);
    }

    const salas = await SalaModel.obtenerDisponibles(
      fecha,
      hora_inicio || '00:00',
      hora_fin || '23:59'
    );
    return exito(res, salas, `${salas.length} sala(s) disponible(s) encontrada(s)`);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/salas/:id
 * Obtiene una sala por su ID
 */
const obtenerSala = async (req, res, next) => {
  try {
    const sala = await SalaModel.buscarPorId(parseInt(req.params.id));
    if (!sala) {
      return error(res, 'Sala no encontrada', 404);
    }
    return exito(res, sala, 'Sala obtenida correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/salas
 * Crea una nueva sala (solo admins)
 */
const crearSala = async (req, res, next) => {
  try {
    const { nombre, capacidad, ubicacion, descripcion } = req.body;

    // Verificar nombre duplicado proactivamente
    const salaExistente = await SalaModel.buscarPorNombre(nombre);
    if (salaExistente) {
      return error(res, 'Ya existe una sala con ese nombre', 409);
    }

    const { lastID } = await SalaModel.crear({ nombre, capacidad, ubicacion, descripcion });

    logger.info('Nueva sala creada', { id: lastID, nombre });

    const salaNueva = await SalaModel.buscarPorId(lastID);
    return exito(res, salaNueva, 'Sala creada correctamente', 201);
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/salas/:id
 * Actualiza los datos de una sala (solo admins)
 */
const actualizarSala = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sala = await SalaModel.buscarPorId(id);

    if (!sala) {
      return error(res, 'Sala no encontrada', 404);
    }

    const { nombre, capacidad, ubicacion, descripcion } = req.body;

    // Verificar nombre duplicado en otra sala
    const otraSala = await SalaModel.buscarPorNombre(nombre, id);
    if (otraSala) {
      return error(res, 'Ya existe otra sala con ese nombre', 409);
    }

    await SalaModel.actualizar(id, { nombre, capacidad, ubicacion, descripcion });

    const salaActualizada = await SalaModel.buscarPorId(id);
    return exito(res, salaActualizada, 'Sala actualizada correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/salas/:id
 * Elimina (desactiva) una sala (solo admins)
 */
const eliminarSala = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const sala = await SalaModel.buscarPorId(id);

    if (!sala) {
      return error(res, 'Sala no encontrada', 404);
    }

    await SalaModel.eliminar(id);
    logger.info('Sala eliminada', { id });

    return exito(res, null, 'Sala eliminada correctamente');
  } catch (err) {
    next(err);
  }
};

module.exports = { listarSalas, salasdisponibles, obtenerSala, crearSala, actualizarSala, eliminarSala };
