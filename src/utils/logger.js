/**
 * Logger simple para la aplicación
 * Evita console.log directo en el código de producción
 */

const NODE_ENV = process.env.NODE_ENV || 'development';

const niveles = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const nivelActual = NODE_ENV === 'test' ? niveles.ERROR : niveles.DEBUG;

const formatear = (nivel, mensaje, datos) => {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${nivel}] ${mensaje}`;
  return datos ? `${base} ${JSON.stringify(datos)}` : base;
};

const logger = {
  error: (mensaje, datos) => {
    if (nivelActual >= niveles.ERROR) {
      console.error(formatear('ERROR', mensaje, datos));
    }
  },
  warn: (mensaje, datos) => {
    if (nivelActual >= niveles.WARN) {
      console.warn(formatear('WARN', mensaje, datos));
    }
  },
  info: (mensaje, datos) => {
    if (nivelActual >= niveles.INFO) {
      console.info(formatear('INFO', mensaje, datos));
    }
  },
  debug: (mensaje, datos) => {
    if (nivelActual >= niveles.DEBUG) {
      console.debug(formatear('DEBUG', mensaje, datos));
    }
  },
};

module.exports = logger;
