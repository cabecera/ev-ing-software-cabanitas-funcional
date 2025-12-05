const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

router.get('/mis-reservas', requireAuth, requireRole('cliente'), reservaController.listCliente);
router.get('/solicitar', requireAuth, requireRole('cliente'), reservaController.showCreate);
router.post('/solicitar', requireAuth, requireRole('cliente'), reservaController.create);
router.get('/', requireAuth, requireAdmin, reservaController.listAll);
router.post('/:id/confirmar', requireAuth, requireAdmin, reservaController.confirm);
router.post('/:id/cancelar', requireAuth, reservaController.cancel);

module.exports = router;




