const express = require('express');
const router = express.Router();
const encargadoController = require('../controllers/encargadoController');
const { requireAuth, requireAdminOrEncargado } = require('../middleware/auth');

router.get('/preparaciones', requireAuth, requireAdminOrEncargado, encargadoController.listPreparaciones);
router.get('/reservas-confirmadas', requireAuth, requireAdminOrEncargado, encargadoController.reservasConfirmadas);
router.post('/preparacion/:reservaId/iniciar', requireAuth, requireAdminOrEncargado, encargadoController.iniciarPreparacion);
router.get('/preparacion/:id', requireAuth, requireAdminOrEncargado, encargadoController.verPreparacion);
router.post('/preparacion/:id/tarea/:tareaId/completar', requireAuth, requireAdminOrEncargado, encargadoController.completarTarea);
router.get('/trabajadores', requireAuth, requireAdminOrEncargado, encargadoController.listTrabajadores);
router.post('/asignar-tarea', requireAuth, requireAdminOrEncargado, encargadoController.asignarTarea);

module.exports = router;
