/**
 * Configuración de Swagger UI para la documentación de la API
 */

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const swaggerDocument = YAML.load(
  path.join(__dirname, '../../docs/arquitectura/openapi.yaml')
);

module.exports = { swaggerUi, swaggerDocument };
