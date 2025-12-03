const express = require('express');
const router = express.Router();
const implementoController = require('../controllers/implementoController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, implementoController.list);
router.post('/crear', requireAuth, requireAdmin, implementoController.create);
router.post('/:id/editar', requireAuth, requireAdmin, implementoController.update);

module.exports = router;
