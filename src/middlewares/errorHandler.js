/**
 * Middleware centralizado de manejo de errores
 * Captura cualquier error no manejado en la aplicación
 */

const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  logger.error('Error no controlado:', {
    mensaje: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    ruta: req.originalUrl,
    metodo: req.method,
  });

  // Error de validación de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      mensaje: 'Token de autenticación inválido',
    });
  }

  // Token expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      mensaje: 'El token de autenticación ha expirado',
    });
  }

  // Error de base de datos — constraint violated
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    return res.status(409).json({
      success: false,
      mensaje: 'El recurso ya existe o hay un conflicto de datos',
    });
  }

  // Error genérico del servidor
  const status = err.status || err.statusCode || 500;
  return res.status(status).json({
    success: false,
    mensaje: status === 500 ? 'Error interno del servidor' : err.message,
  });
};

module.exports = errorHandler;
