/**
 * Middleware de Manejo de Errores
 *
 * Proporciona manejo centralizado de errores para toda la aplicación:
 * - Detecta errores de base de datos
 * - Genera mensajes de error apropiados según el tipo
 * - Renderiza páginas de error amigables
 * - Maneja errores 404 (página no encontrada)
 *
 * @module middleware/errorHandler
 */

/**
 * Verifica si un error es relacionado con la base de datos
 * @param {Error} error - Error a verificar
 * @returns {boolean} true si es un error de base de datos
 */
function isDatabaseError(error) {
  if (!error) return false;

  const dbErrorIndicators = [
    'SequelizeDatabaseError',
    'ER_NO_SUCH_TABLE',
    'ER_BAD_TABLE_ERROR',
    'ER_TABLE_NOT_FOUND',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PROTOCOL_CONNECTION_LOST',
    'ECONNRESET',
    'doesn\'t exist',
    'Unknown table',
    'Table'
  ];

  const errorStr = error.message ? error.message.toString() : error.toString();
  return dbErrorIndicators.some(indicator =>
    errorStr.includes(indicator) ||
    error.name?.includes(indicator)
  );
}

/**
 * Obtiene el código de estado HTTP apropiado para un error
 * @param {Error} error - Error a evaluar
 * @returns {number} Código de estado HTTP
 */
function getErrorStatus(error) {
  if (error.status) return error.status;
  if (error.statusCode) return error.statusCode;
  if (isDatabaseError(error)) return 503; // Service Unavailable
  return 500;
}

/**
 * Obtiene un mensaje de error amigable para el usuario
 * @param {Error} error - Error a procesar
 * @param {number} status - Código de estado HTTP
 * @returns {string} Mensaje de error amigable
 */
function getErrorMessage(error, status) {
  if (isDatabaseError(error)) {
    return 'Error de conexión con la base de datos. Por favor, contacte al administrador o intente más tarde.';
  }

  if (status === 404) {
    return 'La página o recurso que busca no existe.';
  }

  if (status === 403) {
    return 'No tiene permiso para acceder a este recurso.';
  }

  if (error.message) {
    return error.message;
  }

  return 'Ha ocurrido un error inesperado. Por favor, intente nuevamente.';
}

module.exports = {
  /**
   * Wrapper para manejar funciones asíncronas y capturar errores automáticamente
   * @param {Function} fn - Función asíncrona a envolver
   * @returns {Function} Función middleware que captura errores
   *
   * @example
   * router.get('/ruta', asyncHandler(async (req, res) => {
   *   const data = await Model.findAll();
   *   res.json(data);
   * }));
   */
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Middleware principal de manejo de errores
   * Debe ser el último middleware en la cadena de Express
   *
   * @param {Error} err - Error capturado
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Función next
   */
  errorHandler: (err, req, res, next) => {
    try {
      const status = getErrorStatus(err);
      const message = getErrorMessage(err, status);

      // Log del error para debugging
      console.error('Error capturado:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        status: status,
        isDatabaseError: isDatabaseError(err)
      });

      // Si la respuesta ya fue enviada, delegar al handler por defecto de Express
      if (res.headersSent) {
        return next(err);
      }

      // Determinar si mostrar detalles técnicos (solo en desarrollo)
      const showDetails = process.env.NODE_ENV === 'development';

      res.status(status).render('error', {
        message: message,
        status: status,
        error: showDetails ? {
          message: err.message,
          stack: err.stack,
          name: err.name
        } : {},
        req: req,
        isDatabaseError: isDatabaseError(err),
        is404: status === 404
      });
    } catch (renderError) {
      // Si falla el render, enviar respuesta HTML básica como fallback
      console.error('Error al renderizar página de error:', renderError);
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; }
            h1 { color: #dc3545; }
            .error-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
          </style>
        </head>
        <body>
          <h1>Error del Sistema</h1>
          <div class="error-box">
            <p>Ha ocurrido un error. Por favor, intente más tarde.</p>
            <p><a href="/">Volver al inicio</a></p>
          </div>
        </body>
        </html>
      `);
    }
  },

  /**
   * Middleware para rutas no encontradas (404)
   * Debe ir antes del errorHandler pero después de todas las rutas
   *
   * @param {Object} req - Request object
   * @param {Object} res - Response object
   * @param {Function} next - Función next
   */
  notFoundHandler: (req, res, next) => {
    try {
      res.status(404).render('error', {
        message: 'La página que busca no existe.',
        status: 404,
        error: {},
        req: req,
        is404: true
      });
    } catch (renderError) {
      console.error('Error al renderizar 404:', renderError);
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - No Encontrado</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 2rem; text-align: center; }
            h1 { color: #dc3545; }
          </style>
        </head>
        <body>
          <h1>404 - Página no encontrada</h1>
          <p>La página que busca no existe.</p>
          <p><a href="/">Volver al inicio</a></p>
        </body>
        </html>
      `);
    }
  }
};
