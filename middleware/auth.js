// Middleware para verificar si el usuario está autenticado
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
};

// Middleware para verificar roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.session.user) {
        return res.redirect('/auth/login');
      }

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

// Middleware para verificar si es admin
const requireAdmin = requireRole('admin');

// Middleware para verificar si es admin o encargado
const requireAdminOrEncargado = requireRole('admin', 'encargado');

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin,
  requireAdminOrEncargado
};
