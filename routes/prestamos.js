const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

router.get('/mis-prestamos', requireAuth, requireRole('cliente'), prestamoController.listCliente);
router.get('/solicitar', requireAuth, requireRole('cliente'), prestamoController.showCreate);
router.post('/solicitar', requireAuth, requireRole('cliente'), prestamoController.create);
router.get('/', requireAuth, requireAdmin, prestamoController.listAll);
router.post('/:id/devolver', requireAuth, prestamoController.devolver);

module.exports = router;
