const express = require('express');
const router = express.Router();
const pagoController = require('../controllers/pagoController');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

router.get('/reserva/:reservaId', requireAuth, requireRole('cliente'), pagoController.showPagar);
router.post('/reserva/:reservaId/procesar', requireAuth, requireRole('cliente'), pagoController.procesarPago);
router.get('/registrar', requireAuth, requireAdmin, pagoController.showRegistrar);
router.post('/registrar', requireAuth, requireAdmin, pagoController.registrarPago);

module.exports = router;
