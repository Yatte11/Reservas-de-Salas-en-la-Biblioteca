/**
 * Rutas de salas
 * GET    /api/v1/salas
 * GET    /api/v1/salas/disponibles
 * GET    /api/v1/salas/:id
 * POST   /api/v1/salas
 * PUT    /api/v1/salas/:id
 * DELETE /api/v1/salas/:id
 * GET    /api/v1/salas/:id/reservas
 */

const express = require('express');
const router = express.Router();
const salaController = require('../controllers/salaController');
const reservaController = require('../controllers/reservaController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');
const {
  validarCrearSala,
  validarIdParam,
  validarDisponibilidad,
} = require('../middlewares/validators');

// Rutas públicas (requieren autenticación pero no admin)
router.get('/', verificarToken, salaController.listarSalas);
router.get('/disponibles', verificarToken, validarDisponibilidad, salaController.salasdisponibles);
router.get('/:id', verificarToken, validarIdParam, salaController.obtenerSala);
router.get('/:id/reservas', verificarToken, validarIdParam, reservaController.reservasPorSala);

// Rutas de administración
router.post('/', verificarToken, verificarAdmin, validarCrearSala, salaController.crearSala);
router.put('/:id', verificarToken, verificarAdmin, validarIdParam, validarCrearSala, salaController.actualizarSala);
router.delete('/:id', verificarToken, verificarAdmin, validarIdParam, salaController.eliminarSala);

module.exports = router;
