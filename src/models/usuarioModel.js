/**
 * Modelo de Usuario
 * Maneja todas las operaciones de base de datos relacionadas con usuarios
 */

const { consultar, consultarUno, ejecutar } = require('../config/database');

/**
 * Crea un nuevo usuario en la base de datos
 * @param {Object} usuario - { nombre, email, passwordHash, rol }
 * @returns {Promise<{lastID: number}>}
 */
const crear = async ({ nombre, email, passwordHash, rol = 'usuario' }) => {
  const sql = `
    INSERT INTO usuarios (nombre, email, password_hash, rol)
    VALUES (?, ?, ?, ?)
  `;
  return ejecutar(sql, [nombre, email, passwordHash, rol]);
};

/**
 * Busca un usuario por su email
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
const buscarPorEmail = async (email) => {
  const sql = 'SELECT * FROM usuarios WHERE email = ? AND activo = 1';
  return consultarUno(sql, [email]);
};

/**
 * Busca un usuario por su ID
 * @param {number} id
 * @returns {Promise<Object|null>}
 */
const buscarPorId = async (id) => {
  const sql = `
    SELECT id, nombre, email, rol, fecha_registro
    FROM usuarios
    WHERE id = ? AND activo = 1
  `;
  return consultarUno(sql, [id]);
};

/**
 * Obtiene todos los usuarios activos (solo para admins)
 * @returns {Promise<Array>}
 */
const obtenerTodos = async () => {
  const sql = `
    SELECT id, nombre, email, rol, fecha_registro
    FROM usuarios
    WHERE activo = 1
    ORDER BY fecha_registro DESC
  `;
  return consultar(sql);
};

/**
 * Actualiza los datos de un usuario
 * @param {number} id
 * @param {Object} datos - { nombre, email }
 * @returns {Promise<{changes: number}>}
 */
const actualizar = async (id, { nombre, email }) => {
  const sql = `
    UPDATE usuarios SET nombre = ?, email = ?
    WHERE id = ? AND activo = 1
  `;
  return ejecutar(sql, [nombre, email, id]);
};

/**
 * Desactiva un usuario (soft delete)
 * @param {number} id
 * @returns {Promise<{changes: number}>}
 */
const eliminar = async (id) => {
  const sql = 'UPDATE usuarios SET activo = 0 WHERE id = ?';
  return ejecutar(sql, [id]);
};

module.exports = { crear, buscarPorEmail, buscarPorId, obtenerTodos, actualizar, eliminar };
