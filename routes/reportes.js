const express = require('express');
const router = express.Router();
const reporteFaltantesController = require('../controllers/reporteFaltantesController');
const reportesController = require('../controllers/reportesController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Dashboard de reportes (nuevos) - redirige a estadisticas
router.get('/', requireAuth, requireAdmin, reportesController.dashboard);

// Reportes de faltantes
router.get('/faltantes', requireAuth, requireAdmin, reporteFaltantesController.list);
router.get('/faltantes/crear', requireAuth, requireAdmin, reporteFaltantesController.showCreate);
router.post('/faltantes/crear', requireAuth, requireAdmin, reporteFaltantesController.create);
router.post('/faltantes/:id/resolver', requireAuth, requireAdmin, reporteFaltantesController.resolver);

module.exports = router;