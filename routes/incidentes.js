const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidenteController');
const { requireAuth, requireAdmin, requireRole } = require('../middleware/auth');

router.get('/', requireAuth, incidenteController.list);
router.get('/crear', requireAuth, incidenteController.showCreate);
router.post('/crear', requireAuth, incidenteController.create);
router.post('/:id/proponer-solucion', requireAuth, requireAdmin, incidenteController.proponerSolucion);
router.post('/:id/responder', requireAuth, requireRole('cliente'), incidenteController.responderSolucion);
router.post('/:id/resolver', requireAuth, requireAdmin, incidenteController.resolver);

module.exports = router;




