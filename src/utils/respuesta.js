/**
 * Helpers para estandarizar las respuestas HTTP de la API
 */

/**
 * Respuesta exitosa
 * @param {Object} res - Objeto response de Express
 * @param {*} datos - Datos a devolver
 * @param {string} mensaje - Mensaje descriptivo
 * @param {number} status - Código HTTP (default: 200)
 */
const exito = (res, datos, mensaje = 'Operación exitosa', status = 200) => {
  return res.status(status).json({
    success: true,
    mensaje,
    datos,
  });
};

/**
 * Respuesta de error
 * @param {Object} res - Objeto response de Express
 * @param {string} mensaje - Mensaje de error
 * @param {number} status - Código HTTP (default: 400)
 * @param {*} errores - Detalles adicionales del error
 */
const error = (res, mensaje = 'Error en la solicitud', status = 400, errores = null) => {
  const cuerpo = { success: false, mensaje };
  if (errores) cuerpo.errores = errores;
  return res.status(status).json(cuerpo);
};

module.exports = { exito, error };
