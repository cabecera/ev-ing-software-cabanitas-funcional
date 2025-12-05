const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireAdmin, userController.list);
router.get('/crear', requireAuth, requireAdmin, userController.showCreate);
router.post('/crear', requireAuth, requireAdmin, userController.create);
// Rutas de edición y eliminación deben ir después de rutas específicas como /crear
router.get('/:id/editar', requireAuth, requireAdmin, userController.showEdit);
router.post('/:id/editar', requireAuth, requireAdmin, userController.update);
router.post('/:id/eliminar', requireAuth, requireAdmin, userController.delete);

module.exports = router;




