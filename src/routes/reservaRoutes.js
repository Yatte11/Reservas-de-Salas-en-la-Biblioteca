/**
 * Rutas de reservas
 * GET    /api/v1/reservas
 * GET    /api/v1/reservas/:id
 * POST   /api/v1/reservas
 * DELETE /api/v1/reservas/:id
 */

const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { validarCrearReserva, validarIdParam } = require('../middlewares/validators');

router.get('/', verificarToken, reservaController.listarReservas);
router.get('/:id', verificarToken, validarIdParam, reservaController.obtenerReserva);
router.post('/', verificarToken, validarCrearReserva, reservaController.crearReserva);
router.delete('/:id', verificarToken, validarIdParam, reservaController.cancelarReserva);

module.exports = router;
