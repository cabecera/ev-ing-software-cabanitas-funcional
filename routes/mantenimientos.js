const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { requireAuth, requireAdmin, requireAdminOrEncargado } = require('../middleware/auth');

router.get('/', requireAuth, requireAdminOrEncargado, mantenimientoController.list);
router.get('/crear', requireAuth, requireAdmin, mantenimientoController.showCreate);
router.post('/crear', requireAuth, requireAdmin, mantenimientoController.create);
router.post('/:id/asignar-trabajador', requireAuth, requireAdminOrEncargado, mantenimientoController.asignarTrabajador);
router.get('/cabana/:cabanaId/historial', requireAuth, requireAdminOrEncargado, mantenimientoController.historialCabana);
router.get('/implemento/:implementoId/historial', requireAuth, requireAdminOrEncargado, mantenimientoController.historialImplemento);

module.exports = router;

