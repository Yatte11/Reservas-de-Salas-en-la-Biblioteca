/**
 * Middleware de autenticación con JWT
 * Verifica que el token sea válido antes de permitir acceso a rutas protegidas
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica el token JWT del header Authorization
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      mensaje: 'Acceso denegado. Se requiere token de autenticación',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secreto_dev');
    req.usuario = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware que verifica que el usuario tenga rol de administrador
 */
const verificarAdmin = (req, res, next) => {
  if (!req.usuario || req.usuario.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      mensaje: 'Acceso denegado. Se requieren permisos de administrador',
    });
  }
  next();
};

module.exports = { verificarToken, verificarAdmin };
