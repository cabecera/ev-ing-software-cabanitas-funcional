const express = require('express');
const router = express.Router();
const checkinController = require('../controllers/checkinController');
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/:reservaId', requireAuth, requireRole('cliente'), checkinController.showCheckin);
router.post('/:reservaId', requireAuth, requireRole('cliente'), checkinController.procesarCheckin);

module.exports = router;
