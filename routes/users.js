const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth, requireAdmin } = require('../middleware/auth');

router.get('/', requireAuth, requireAdmin, userController.list);
router.get('/crear', requireAuth, requireAdmin, userController.showCreate);
router.post('/crear', requireAuth, requireAdmin, userController.create);
router.post('/:id/toggle-activo', requireAuth, requireAdmin, userController.toggleActivo);

module.exports = router;

