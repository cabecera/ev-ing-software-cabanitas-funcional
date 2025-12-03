const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/admin', requireAuth, requireRole('admin'), dashboardController.admin);
router.get('/cliente', requireAuth, requireRole('cliente'), dashboardController.cliente);
router.get('/encargado', requireAuth, requireRole('encargado', 'admin'), dashboardController.encargado);
router.get('/trabajador', requireAuth, requireRole('trabajador'), dashboardController.trabajador);

module.exports = router;
