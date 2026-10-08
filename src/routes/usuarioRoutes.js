/**
 * Rutas de usuarios
 * GET /api/v1/usuarios/perfil
 * PUT /api/v1/usuarios/perfil
 * GET /api/v1/usuarios (solo admin)
 */

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken, verificarAdmin } = require('../middlewares/authMiddleware');

router.get('/perfil', verificarToken, usuarioController.obtenerPerfil);
router.put('/perfil', verificarToken, usuarioController.actualizarPerfil);
router.get('/', verificarToken, verificarAdmin, usuarioController.listarUsuarios);

module.exports = router;
