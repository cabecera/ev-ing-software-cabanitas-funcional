const express = require('express');
const router = express.Router();
const cabanaController = require('../controllers/cabanaController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', cabanaController.list);
router.get('/crear', requireAuth, requireAdmin, cabanaController.showCreate);
router.post('/crear', requireAuth, requireAdmin, cabanaController.create);
router.get('/:id', cabanaController.show);
router.get('/:id/editar', requireAuth, requireAdmin, cabanaController.showEdit);
router.post('/:id/editar', requireAuth, requireAdmin, cabanaController.update);
router.post('/:id/eliminar', requireAuth, requireAdmin, cabanaController.delete);

module.exports = router;
