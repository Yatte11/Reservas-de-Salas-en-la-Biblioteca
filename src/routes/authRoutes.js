/**
 * Rutas de autenticación
 * POST /api/v1/auth/registro
 * POST /api/v1/auth/login
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validarRegistro, validarLogin } = require('../middlewares/validators');

router.post('/registro', validarRegistro, authController.registro);
router.post('/login', validarLogin, authController.login);

module.exports = router;
