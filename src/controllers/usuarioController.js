/**
 * Controlador de Usuarios
 * Maneja la consulta y actualización de perfil de usuario
 */

const UsuarioModel = require('../models/usuarioModel');
const { exito, error } = require('../utils/respuesta');

/**
 * GET /api/v1/usuarios/perfil
 * Devuelve el perfil del usuario autenticado
 */
const obtenerPerfil = async (req, res, next) => {
  try {
    const usuario = await UsuarioModel.buscarPorId(req.usuario.id);
    if (!usuario) {
      return error(res, 'Usuario no encontrado', 404);
    }
    return exito(res, usuario, 'Perfil obtenido correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/v1/usuarios/perfil
 * Actualiza el nombre y email del usuario autenticado
 */
const actualizarPerfil = async (req, res, next) => {
  try {
    const { nombre, email } = req.body;
    const id = req.usuario.id;

    // Verificar que el email no esté siendo usado por otro usuario
    const usuarioConEmail = await UsuarioModel.buscarPorEmail(email);
    if (usuarioConEmail && usuarioConEmail.id !== id) {
      return error(res, 'El email ya está en uso por otro usuario', 409);
    }

    await UsuarioModel.actualizar(id, { nombre, email });
    const usuarioActualizado = await UsuarioModel.buscarPorId(id);

    return exito(res, usuarioActualizado, 'Perfil actualizado correctamente');
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/usuarios
 * Lista todos los usuarios (solo admins)
 */
const listarUsuarios = async (req, res, next) => {
  try {
    const usuarios = await UsuarioModel.obtenerTodos();
    return exito(res, usuarios, 'Usuarios obtenidos correctamente');
  } catch (err) {
    next(err);
  }
};

module.exports = { obtenerPerfil, actualizarPerfil, listarUsuarios };
