/**
 * Middleware de Autenticación y Autorización
 *
 * Proporciona middleware para proteger rutas basándose en:
 * - Autenticación: verificar que el usuario esté logueado
 * - Autorización: verificar que el usuario tenga el rol adecuado
 *
 * @module middleware/auth
 */

/**
 * Middleware para verificar si el usuario está autenticado
 * Redirige al login si no hay sesión activa
 *
 * @param {Object} req - Request object de Express
 * @param {Object} res - Response object de Express
 * @param {Function} next - Función next de Express
 */
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

/**
 * Middleware para verificar roles específicos
 * Permite acceso solo a usuarios con uno de los roles especificados
 *
 * @param {...string} roles - Roles permitidos (admin, encargado, trabajador, cliente)
 * @returns {Function} Middleware function
 *
 * @example
 * router.get('/admin-only', requireRole('admin'), controller.adminOnly);
 * router.get('/staff', requireRole('admin', 'encargado'), controller.staff);
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      // Verificar que el usuario esté autenticado
      if (!req.session.user) {
        return res.redirect('/auth/login');
      }

      // Verificar que el usuario tenga uno de los roles permitidos
      if (!roles.includes(req.session.user.role)) {
        return res.status(403).render('error', {
          message: 'No tienes permiso para acceder a esta página',
          error: {},
          req: req
        });
      }

      next();
    } catch (error) {
      console.error('Error en middleware requireRole:', error);
      return res.status(500).render('error', {
        message: 'Error de autenticación',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  };
};

// Middleware predefinidos para roles comunes
const requireAdmin = requireRole('admin');
const requireAdminOrEncargado = requireRole('admin', 'encargado');

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAdminOrEncargado
};
