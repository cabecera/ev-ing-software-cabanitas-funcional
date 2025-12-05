const express = require('express');
const router = express.Router();
const calendarioController = require('../controllers/calendarioController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Calendario de disponibilidad (público)
router.get('/disponibilidad', calendarioController.disponibilidad);

// Calendario maestro (admin)
router.get('/admin', requireAuth, requireAdmin, calendarioController.adminCalendario);

module.exports = router;




