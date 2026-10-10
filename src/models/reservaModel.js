/**
 * Modelo de Reserva
 * Maneja todas las operaciones de base de datos relacionadas con reservas
 */

const { consultar, consultarUno, ejecutar } = require('../config/database');

/**
 * Crea una nueva reserva
 * @param {Object} reserva - { usuario_id, sala_id, fecha, hora_inicio, hora_fin, proposito }
 * @returns {Promise<{lastID: number}>}
 */
const crear = async ({ usuario_id, sala_id, fecha, hora_inicio, hora_fin, proposito = null }) => {
  const sql = `
    INSERT INTO reservas (usuario_id, sala_id, fecha, hora_inicio, hora_fin, proposito, estado)
    VALUES (?, ?, ?, ?, ?, ?, 'activa')
  `;
  return ejecutar(sql, [usuario_id, sala_id, fecha, hora_inicio, hora_fin, proposito]);
};

/**
 * Obtiene todas las reservas de un usuario con filtros opcionales
 * @param {number} usuarioId
 * @param {Object} filtros          - Filtros opcionales
 * @param {string} [filtros.estado] - 'activa' | 'cancelada' | 'completada'
 * @param {string} [filtros.fecha]  - Fecha en formato YYYY-MM-DD
 * @returns {Promise<Array>}
 */
const obtenerPorUsuario = async (usuarioId, filtros = {}) => {
  const params = [usuarioId];
  let condicionesExtra = '';

  if (filtros.estado) {
    condicionesExtra += ' AND r.estado = ?';
    params.push(filtros.estado);
  }

  if (filtros.fecha) {
    condicionesExtra += ' AND r.fecha = ?';
    params.push(filtros.fecha);
  }

  const sql = `
    SELECT
      r.id, r.fecha, r.hora_inicio, r.hora_fin, r.proposito, r.estado, r.fecha_creacion,
      s.id AS sala_id, s.nombre AS sala_nombre, s.ubicacion AS sala_ubicacion
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    WHERE r.usuario_id = ?${condicionesExtra}
    ORDER BY r.fecha DESC, r.hora_inicio DESC
  `;
  return consultar(sql, params);
};

/**
 * Obtiene todas las reservas de una sala
 * @param {number} salaId
 * @returns {Promise<Array>}
 */
const obtenerPorSala = async (salaId) => {
  const sql = `
    SELECT
      r.id, r.fecha, r.hora_inicio, r.hora_fin, r.proposito, r.estado,
      u.nombre AS usuario_nombre
    FROM reservas r
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.sala_id = ? AND r.estado != 'cancelada'
    ORDER BY r.fecha ASC, r.hora_inicio ASC
  `;
  return consultar(sql, [salaId]);
};

/**
 * Busca una reserva por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const buscarPorId = async (id) => {
  const sql = `
    SELECT
      r.id, r.usuario_id, r.sala_id, r.fecha, r.hora_inicio,
      r.hora_fin, r.proposito, r.estado, r.fecha_creacion,
      s.nombre AS sala_nombre,
      u.nombre AS usuario_nombre
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    JOIN usuarios u ON r.usuario_id = u.id
    WHERE r.id = ?
  `;
  return consultarUno(sql, [id]);
};

/**
 * Verifica si hay conflicto de horario para una sala en una fecha dada
 * @param {number} salaId
 * @param {string} fecha
 * @param {string} horaInicio
 * @param {string} horaFin
 * @param {number|null} excluirReservaId - Para excluir al actualizar
 * @returns {Promise<boolean>}
 */
const existeConflicto = async (salaId, fecha, horaInicio, horaFin, excluirReservaId = null) => {
  let sql = `
    SELECT COUNT(*) as total
    FROM reservas
    WHERE sala_id = ?
      AND fecha = ?
      AND estado != 'cancelada'
      AND (
        (hora_inicio < ? AND hora_fin > ?)
        OR (hora_inicio < ? AND hora_fin > ?)
        OR (hora_inicio >= ? AND hora_fin <= ?)
      )
  `;
  const params = [salaId, fecha, horaFin, horaInicio, horaFin, horaInicio, horaInicio, horaFin];

  if (excluirReservaId) {
    sql += ' AND id != ?';
    params.push(excluirReservaId);
  }

  const resultado = await consultarUno(sql, params);
  return resultado.total > 0;
};

/**
 * Calcula el total de horas reservadas por un usuario en una fecha concreta
 * Útil para aplicar reglas de límite diario
 * @param {number} usuarioId
 * @param {string} fecha - Formato YYYY-MM-DD
 * @returns {Promise<number>} Total de horas reservadas ese día
 */
const calcularHorasReservadasEnDia = async (usuarioId, fecha) => {
  const sql = `
    SELECT hora_inicio, hora_fin
    FROM reservas
    WHERE usuario_id = ?
      AND fecha = ?
      AND estado != 'cancelada'
  `;
  const reservas = await consultar(sql, [usuarioId, fecha]);

  // Suma los minutos de cada reserva y convierte a horas
  const totalMinutos = reservas.reduce((acum, r) => {
    const [hIni, mIni] = r.hora_inicio.split(':').map(Number);
    const [hFin, mFin] = r.hora_fin.split(':').map(Number);
    return acum + (hFin * 60 + mFin) - (hIni * 60 + mIni);
  }, 0);

  return totalMinutos / 60;
};

/**
 * Cancela una reserva cambiando su estado
 * @param {number} id
 * @returns {Promise<{changes: number}>}
 */
const cancelar = async (id) => {
  const sql = 'UPDATE reservas SET estado = \'cancelada\' WHERE id = ?';
  return ejecutar(sql, [id]);
};

/**
 * Obtiene todas las reservas (solo para admins)
 * @returns {Promise<Array>}
 */
const obtenerTodas = async () => {
  const sql = `
    SELECT
      r.id, r.fecha, r.hora_inicio, r.hora_fin, r.proposito, r.estado, r.fecha_creacion,
      s.nombre AS sala_nombre,
      u.nombre AS usuario_nombre, u.email AS usuario_email
    FROM reservas r
    JOIN salas s ON r.sala_id = s.id
    JOIN usuarios u ON r.usuario_id = u.id
    ORDER BY r.fecha DESC, r.hora_inicio DESC
  `;
  return consultar(sql);
};

module.exports = {
  crear,
  obtenerPorUsuario,
  obtenerPorSala,
  buscarPorId,
  existeConflicto,
  calcularHorasReservadasEnDia,
  cancelar,
  obtenerTodas,
};
