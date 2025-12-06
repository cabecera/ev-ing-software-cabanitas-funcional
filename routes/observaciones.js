const express = require('express');
const router = express.Router();
const observacionClienteController = require('../controllers/observacionClienteController');
const { requireAuth, requireAdminOrEncargado, requireAdmin } = require('../middleware/auth');

// Listar observaciones (admin y encargado)
router.get('/', requireAuth, requireAdminOrEncargado, observacionClienteController.list);

// API: Obtener reservas de un cliente (para carga dinámica) - DEBE IR ANTES de /cliente/:clienteId
router.get('/api-reservas/:clienteId', requireAuth, requireAdminOrEncargado, observacionClienteController.getReservasByCliente);

// Ver observaciones por cliente
router.get('/cliente/:clienteId', requireAuth, requireAdminOrEncargado, observacionClienteController.listByCliente);

// Ver observaciones por reserva
router.get('/reserva/:reservaId', requireAuth, requireAdminOrEncargado, observacionClienteController.listByReserva);

// Mostrar formulario de creación
router.get('/crear', requireAuth, requireAdminOrEncargado, observacionClienteController.showCreate);

// Crear observación
router.post('/crear', requireAuth, requireAdminOrEncargado, observacionClienteController.create);

// Eliminar observación (solo admin) - Ruta específica antes de rutas con parámetros genéricos
router.post('/eliminar/:id', requireAuth, requireAdmin, observacionClienteController.delete);

module.exports = router;

