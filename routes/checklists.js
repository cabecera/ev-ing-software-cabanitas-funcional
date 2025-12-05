const express = require('express');
const router = express.Router();
const db = require('../models');
const { EntregaCabana, ItemVerificacion, ChecklistInventario } = db;
const { requireAuth, requireAdminOrEncargado } = require('../middleware/auth');

router.get('/:id', requireAuth, requireAdminOrEncargado, async (req, res) => {
  try {
    const { id } = req.params;
    const entrega = await EntregaCabana.findByPk(id, {
      include: [
        { model: ItemVerificacion, as: 'itemsVerificacion' },
        'reserva',
        'cabana',
        'checklist'
      ]
    });

    if (!entrega) {
      return res.status(404).render('error', { message: 'Entrega no encontrada', error: {} });
    }

    res.render('checklists/show', { entrega });
  } catch (error) {
    console.error('Error al cargar checklist:', error);
    res.status(500).render('error', { message: 'Error al cargar checklist', error });
  }
});

module.exports = router;




