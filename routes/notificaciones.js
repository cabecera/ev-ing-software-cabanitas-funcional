const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, notificacionController.list);
router.post('/:id/leer', requireAuth, notificacionController.marcarLeida);

module.exports = router;
