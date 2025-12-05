const express = require('express');
const router = express.Router();
const db = require('../models');
const { Cliente } = db;
const { requireAuth, requireRole } = require('../middleware/auth');

router.get('/perfil', requireAuth, requireRole('cliente'), async (req, res) => {
  try {
    const cliente = await Cliente.findOne({
      where: { userId: req.session.user.id }
    });

    if (!cliente) {
      return res.status(404).render('error', { message: 'Cliente no encontrado', error: {} });
    }

    res.render('clientes/perfil', { cliente });
  } catch (error) {
    console.error('Error al cargar perfil:', error);
    res.status(500).render('error', { message: 'Error al cargar perfil', error });
  }
});

router.post('/perfil', requireAuth, requireRole('cliente'), async (req, res) => {
  try {
    const { nombre, apellido, telefono, direccion, dni } = req.body;
    const cliente = await Cliente.findOne({
      where: { userId: req.session.user.id }
    });

    if (!cliente) {
      return res.status(404).render('error', { message: 'Cliente no encontrado', error: {} });
    }

    await cliente.update({
      nombre,
      apellido,
      telefono: telefono || null,
      direccion: direccion || null,
      dni: dni || null
    });

    res.redirect('/clientes/perfil');
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).render('error', { message: 'Error al actualizar perfil', error });
  }
});

module.exports = router;




