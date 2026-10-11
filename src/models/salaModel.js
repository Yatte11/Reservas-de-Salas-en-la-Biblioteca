/**
 * Modelo de Sala
 * Maneja todas las operaciones de base de datos relacionadas con salas
 */

const { consultar, consultarUno, ejecutar } = require('../config/database');

/**
 * Obtiene todas las salas activas
 * @returns {Promise<Array>}
 */
const obtenerTodas = async () => {
  const sql = `
    SELECT id, nombre, capacidad, ubicacion, descripcion, activa, fecha_creacion
    FROM salas
    WHERE activa = 1
    ORDER BY nombre ASC
  `;
  return consultar(sql);
};

/**
 * Busca una sala por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const buscarPorId = async (id) => {
  const sql = `
    SELECT id, nombre, capacidad, ubicacion, descripcion, activa, fecha_creacion
    FROM salas
    WHERE id = ? AND activa = 1
  `;
  return consultarUno(sql, [id]);
};

/**
 * Crea una nueva sala
 * @param {Object} sala - { nombre, capacidad, ubicacion, descripcion }
 * @returns {Promise<{lastID: number}>}
 */
const crear = async ({ nombre, capacidad, ubicacion, descripcion = null }) => {
  const sql = `
    INSERT INTO salas (nombre, capacidad, ubicacion, descripcion)
    VALUES (?, ?, ?, ?)
  `;
  return ejecutar(sql, [nombre, capacidad, ubicacion, descripcion]);
};

/**
 * Actualiza los datos de una sala
 * @param {number} id
 * @param {Object} datos - { nombre, capacidad, ubicacion, descripcion }
 * @returns {Promise<{changes: number}>}
 */
const actualizar = async (id, { nombre, capacidad, ubicacion, descripcion }) => {
  const sql = `
    UPDATE salas
    SET nombre = ?, capacidad = ?, ubicacion = ?, descripcion = ?
    WHERE id = ? AND activa = 1
  `;
  return ejecutar(sql, [nombre, capacidad, ubicacion, descripcion, id]);
};

/**
 * Desactiva una sala (soft delete)
 * @param {number} id
 * @returns {Promise<{changes: number}>}
 */
const eliminar = async (id) => {
  const sql = 'UPDATE salas SET activa = 0 WHERE id = ?';
  return ejecutar(sql, [id]);
};

/**
 * Obtiene salas disponibles para un rango de fecha/hora
 * @param {string} fecha - Formato YYYY-MM-DD
 * @param {string} horaInicio - Formato HH:MM
 * @param {string} horaFin - Formato HH:MM
 * @returns {Promise<Array>}
 */
const obtenerDisponibles = async (fecha, horaInicio, horaFin) => {
  const sql = `
    SELECT s.id, s.nombre, s.capacidad, s.ubicacion, s.descripcion
    FROM salas s
    WHERE s.activa = 1
      AND s.id NOT IN (
        SELECT r.sala_id
        FROM reservas r
        WHERE r.fecha = ?
          AND r.estado != 'cancelada'
          AND (
            (r.hora_inicio < ? AND r.hora_fin > ?)
            OR (r.hora_inicio < ? AND r.hora_fin > ?)
            OR (r.hora_inicio >= ? AND r.hora_fin <= ?)
          )
      )
    ORDER BY s.capacidad ASC
  `;
  return consultar(sql, [fecha, horaFin, horaInicio, horaFin, horaInicio, horaInicio, horaFin]);
};

/**
 * Busca una sala activa por nombre, excluyendo opcionalmente un ID (para edición)
 * @param {string} nombre
 * @param {number|null} excluirId - ID de la sala a excluir del resultado (usar en PUT)
 * @returns {Promise<Object|null>}
 */
const buscarPorNombre = (nombre, excluirId = null) => {
  if (excluirId !== null) {
    return consultarUno(
      'SELECT * FROM salas WHERE nombre = ? AND id != ? AND activa = 1',
      [nombre, excluirId]
    );
  }
  return consultarUno(
    'SELECT * FROM salas WHERE nombre = ? AND activa = 1',
    [nombre]
  );
};

module.exports = { obtenerTodas, buscarPorId, crear, actualizar, eliminar, obtenerDisponibles, buscarPorNombre };
