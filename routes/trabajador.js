const express = require('express');
const router = express.Router();
const trabajadorController = require('../controllers/trabajadorController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/tareas', requireAuth, requireRole('trabajador'), trabajadorController.misTareas);
router.get('/tarea/:id', requireAuth, requireRole('trabajador'), trabajadorController.verTarea);
router.post('/tarea/:id/iniciar', requireAuth, requireRole('trabajador'), trabajadorController.iniciarTarea);
router.post('/tarea/:id/completar', requireAuth, requireRole('trabajador'), trabajadorController.completarTarea);
router.post('/tarea/:id/reportar-dano', requireAuth, requireRole('trabajador'), trabajadorController.reportarDano);

module.exports = router;




