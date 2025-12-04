const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');

// Ruta base /dashboard que redirige según el rol
router.get('/', requireAuth, (req, res) => {
  const role = req.session.user.role;
  if (role === 'admin') {
    return res.redirect('/dashboard/admin');
  } else if (role === 'encargado') {
    return res.redirect('/dashboard/encargado');
  } else if (role === 'trabajador') {
    return res.redirect('/dashboard/trabajador');
  } else {
    return res.redirect('/dashboard/cliente');
  }
});

router.get('/admin', requireAuth, requireRole('admin'), dashboardController.admin);
router.get('/cliente', requireAuth, requireRole('cliente'), dashboardController.cliente);
router.get('/encargado', requireAuth, requireRole('encargado', 'admin'), dashboardController.encargado);
router.get('/trabajador', requireAuth, requireRole('trabajador'), dashboardController.trabajador);

module.exports = router;
