const express = require('express');
const router = express.Router();
const encuestaController = require('../controllers/encuestaController');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

router.get('/:reservaId', requireAuth, requireRole('cliente'), encuestaController.showForm);
router.post('/:reservaId', requireAuth, requireRole('cliente'), encuestaController.submit);
router.get('/estadisticas/admin', requireAuth, requireAdmin, encuestaController.estadisticas);
router.get('/estadisticas-satisfaccion', requireAuth, requireAdmin, encuestaController.estadisticas);

module.exports = router;
