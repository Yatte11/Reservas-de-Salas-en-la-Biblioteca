/**
 * Validaciones de entrada usando express-validator
 * Cada función exportada es un array de middlewares de validación
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Middleware que revisa el resultado de las validaciones y responde con errores si los hay
 */
const validar = (req, res, next) => {
  const errores = validationResult(req);
  if (!errores.isEmpty()) {
    return res.status(422).json({
      success: false,
      mensaje: 'Error de validación en los datos enviados',
      errores: errores.array().map((e) => ({ campo: e.path, mensaje: e.msg })),
    });
  }
  next();
};

// --- Validaciones de autenticación ---

const validarRegistro = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/[A-Z]/).withMessage('La contraseña debe tener al menos una mayúscula')
    .matches(/[0-9]/).withMessage('La contraseña debe tener al menos un número'),
  validar,
];

const validarLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es obligatoria'),
  validar,
];

// --- Validaciones de salas ---

const validarCrearSala = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre de la sala es obligatorio')
    .isLength({ max: 100 }).withMessage('El nombre no puede superar 100 caracteres'),
  body('capacidad')
    .notEmpty().withMessage('La capacidad es obligatoria')
    .isInt({ min: 1, max: 200 }).withMessage('La capacidad debe ser un entero entre 1 y 200'),
  body('ubicacion')
    .trim()
    .notEmpty().withMessage('La ubicación es obligatoria')
    .isLength({ max: 200 }).withMessage('La ubicación no puede superar 200 caracteres'),
  body('descripcion')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('La descripción no puede superar 500 caracteres'),
  validar,
];

// --- Validaciones de reservas ---

const validarCrearReserva = [
  body('sala_id')
    .notEmpty().withMessage('El ID de sala es obligatorio')
    .isInt({ min: 1 }).withMessage('El ID de sala debe ser un número entero positivo'),
  body('fecha')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('La fecha debe tener formato YYYY-MM-DD'),
  body('hora_inicio')
    .notEmpty().withMessage('La hora de inicio es obligatoria')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de inicio debe tener formato HH:MM'),
  body('hora_fin')
    .notEmpty().withMessage('La hora de fin es obligatoria')
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de fin debe tener formato HH:MM'),
  body('proposito')
    .optional()
    .trim()
    .isLength({ max: 300 }).withMessage('El propósito no puede superar 300 caracteres'),
  validar,
];

const validarIdParam = [
  param('id')
    .isInt({ min: 1 }).withMessage('El ID debe ser un número entero positivo'),
  validar,
];

const validarDisponibilidad = [
  query('fecha')
    .notEmpty().withMessage('La fecha es obligatoria')
    .isDate({ format: 'YYYY-MM-DD' }).withMessage('La fecha debe tener formato YYYY-MM-DD'),
  query('hora_inicio')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de inicio debe tener formato HH:MM'),
  query('hora_fin')
    .optional()
    .matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('La hora de fin debe tener formato HH:MM'),
  validar,
];

const validarFiltrosReserva = [
  query('estado')
    .optional()
    .isIn(['activa', 'cancelada', 'completada'])
    .withMessage('El estado debe ser \'activa\', \'cancelada\' o \'completada\''),
  query('fecha')
    .optional()
    .isDate({ format: 'YYYY-MM-DD', strictMode: true })
    .withMessage('La fecha debe tener formato YYYY-MM-DD y ser una fecha real'),
  validar,
];

// --- Validaciones de actualización de perfil ---

const validarActualizarPerfil = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es obligatorio')
    .isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .notEmpty().withMessage('El email es obligatorio')
    .isEmail().withMessage('El email no tiene un formato válido')
    .normalizeEmail(),
  validar,
];

module.exports = {
  validarRegistro,
  validarLogin,
  validarCrearSala,
  validarCrearReserva,
  validarIdParam,
  validarDisponibilidad,
  validarFiltrosReserva,
  validarActualizarPerfil,
};
