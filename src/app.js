/**
 * Punto de entrada principal de la aplicación
 * Sistema de Reservas de Salas de Biblioteca
 */

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { inicializarDB } = require('./config/database');
const errorHandler = require('./middlewares/errorHandler');
const logger = require('./utils/logger');

// Rutas
const authRoutes = require('./routes/authRoutes');
const salaRoutes = require('./routes/salaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');

const app = express();

// ─── Seguridad y middlewares globales ────────────────────────────────────────

// Cabeceras de seguridad HTTP
app.use(helmet());

// CORS: solo permitir orígenes configurados
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting: máx 100 peticiones por 15 minutos por IP
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    mensaje: 'Demasiadas solicitudes desde esta IP. Intenta de nuevo en 15 minutos.',
  },
});
app.use('/api/', limiter);

// Logging de peticiones HTTP (solo en desarrollo)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Parseo de JSON y URL-encoded
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Documentación Swagger ───────────────────────────────────────────────────

try {
  const { swaggerUi, swaggerDocument } = require('./config/swagger');
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (_e) {
  logger.warn('Swagger UI no disponible: openapi.yaml no encontrado');
}

// ─── Rutas de la API ─────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/salas', salaRoutes);
app.use('/api/v1/reservas', reservaRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);

// Ruta raíz con información básica
app.get('/', (_req, res) => {
  res.json({
    nombre: 'API Sistema de Reservas de Biblioteca',
    version: '1.0.0',
    documentacion: '/api-docs',
    estado: 'activo',
  });
});

// Ruta no encontrada (404)
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    mensaje: 'Ruta no encontrada',
  });
});

// ─── Manejador de errores ────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Iniciar servidor ────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;

const iniciar = async () => {
  try {
    await inicializarDB();
    logger.info('Base de datos inicializada correctamente');

    app.listen(PORT, () => {
      logger.info(`Servidor corriendo en http://localhost:${PORT}`);
      logger.info(`Documentación API en http://localhost:${PORT}/api-docs`);
    });
  } catch (err) {
    logger.error('Error al iniciar la aplicación:', err);
    process.exit(1);
  }
};

// Solo iniciar si es el módulo principal (no en tests)
if (require.main === module) {
  iniciar();
}

module.exports = app;
