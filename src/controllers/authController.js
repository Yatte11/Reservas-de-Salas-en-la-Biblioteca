/**
 * Controlador de Autenticación
 * Maneja el registro e inicio de sesión de usuarios
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuarioModel');
const { exito, error } = require('../utils/respuesta');
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'secreto_dev';
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * POST /api/v1/auth/registro
 * Registra un nuevo usuario en el sistema
 */
const registro = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;

    // Verificar que el email no esté ya registrado
    const usuarioExistente = await UsuarioModel.buscarPorEmail(email);
    if (usuarioExistente) {
      return error(res, 'El email ya está registrado', 409);
    }

    // Cifrar la contraseña con bcrypt (salt=12)
    const passwordHash = await bcrypt.hash(password, 12);

    const { lastID } = await UsuarioModel.crear({ nombre, email, passwordHash });

    logger.info('Nuevo usuario registrado', { id: lastID, email });

    return exito(
      res,
      { id: lastID, nombre, email },
      'Usuario registrado correctamente',
      201
    );
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/v1/auth/login
 * Autentica a un usuario y devuelve un token JWT
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const usuario = await UsuarioModel.buscarPorEmail(email);
    if (!usuario) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    const passwordValido = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValido) {
      return error(res, 'Credenciales incorrectas', 401);
    }

    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRATION });

    logger.info('Inicio de sesión exitoso', { id: usuario.id, email });

    return exito(res, {
      token,
      usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol },
    }, 'Inicio de sesión exitoso');
  } catch (err) {
    next(err);
  }
};

module.exports = { registro, login };
