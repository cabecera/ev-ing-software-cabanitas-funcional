const db = require('../models');
const { EntregaCabana, Reserva, ItemVerificacion, ChecklistInventario } = db;

const checkinController = {
  // Mostrar formulario de check-in
  showCheckin: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const clienteId = req.session.user.clienteId;

      const reserva = await Reserva.findByPk(reservaId, {
        include: [{ model: db.Cabana, as: 'cabana' }]
      });

      if (!reserva || reserva.clienteId !== clienteId) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      // Obtener o crear entrega
      let entrega = await EntregaCabana.findOne({ where: { reservaId } });

      if (!entrega) {
        const checklist = await ChecklistInventario.findOne({ where: { activo: true } });
        entrega = await EntregaCabana.create({
          reservaId,
          cabanaId: reserva.cabanaId,
          checklistId: checklist ? checklist.id : null,
          estado: 'pendiente'
        });

        // Crear items de verificación si hay checklist
        if (checklist) {
          const items = await ItemVerificacion.findAll({ where: { checklistId: checklist.id } });
          for (const item of items) {
            await ItemVerificacion.create({
              entregaId: entrega.id,
              nombre: item.nombre,
              descripcion: item.descripcion,
              verificado: false
            });
          }
        }
      }

      // Cargar items de verificación
      const items = await ItemVerificacion.findAll({
        where: { entregaId: entrega.id }
      });

      res.render('checkin/form', { reserva, entrega, items });
    } catch (error) {
      console.error('Error al cargar check-in:', error);
      res.status(500).render('error', { message: 'Error al cargar check-in', error });
    }
  },

  // Procesar check-in y firma
  procesarCheckin: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const { itemsVerificados, observaciones, firmaDigital } = req.body;
      const clienteId = req.session.user.clienteId;

      const reserva = await Reserva.findByPk(reservaId);
      if (!reserva || reserva.clienteId !== clienteId) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      const entrega = await EntregaCabana.findOne({ where: { reservaId } });
      if (!entrega) {
        return res.status(404).json({ error: 'Entrega no encontrada' });
      }

      // Actualizar items verificados
      if (itemsVerificados && Array.isArray(itemsVerificados)) {
        for (const itemId of itemsVerificados) {
          await ItemVerificacion.update(
            { verificado: true },
            { where: { id: itemId, entregaId: entrega.id } }
          );
        }
      }

      // Actualizar entrega
      const todosVerificados = await ItemVerificacion.findAll({
        where: { entregaId: entrega.id }
      });

      const estado = todosVerificados.every(i => i.verificado || itemsVerificados.includes(i.id))
        ? 'completada'
        : 'con_observaciones';

      await entrega.update({
        estado,
        observaciones: observaciones || entrega.observaciones
      });

      // Si hay firma digital (base64), guardarla
      if (firmaDigital) {
        // Aquí podrías guardar la firma en un campo adicional o en una tabla separada
        // Por ahora solo actualizamos el estado
      }

      res.redirect('/reservas/mis-reservas?checkin=completado');
    } catch (error) {
      console.error('Error al procesar check-in:', error);
      res.status(500).json({ error: 'Error al procesar check-in' });
    }
  }
};

module.exports = checkinController;




