const express = require('express');
const router = express.Router();
const mantenimientoController = require('../controllers/mantenimientoController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireAdmin, mantenimientoController.list);
router.get('/crear', requireAuth, requireAdmin, mantenimientoController.showCreate);
router.post('/crear', requireAuth, requireAdmin, mantenimientoController.create);
router.post('/:id/completar', requireAuth, requireAdmin, mantenimientoController.completar);

module.exports = router;
