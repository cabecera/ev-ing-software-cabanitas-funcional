const db = require('../models');
const { Notificacion } = db;

const notificacionController = {
  // Listar notificaciones del usuario
  list: async (req, res) => {
    try {
      const notificaciones = await Notificacion.findAll({
        where: { userId: req.session.user.id },
        order: [['createdAt', 'DESC']],
        limit: 50
      });

      res.render('notificaciones/list', { notificaciones });
    } catch (error) {
      console.error('Error al listar notificaciones:', error);
      res.status(500).render('error', { message: 'Error al cargar notificaciones', error });
    }
  },

  // Marcar como leída
  marcarLeida: async (req, res) => {
    try {
      const { id } = req.params;
      const notificacion = await Notificacion.findByPk(id);

      if (!notificacion || notificacion.userId !== req.session.user.id) {
        return res.status(404).json({ error: 'Notificación no encontrada' });
      }

      await notificacion.update({
        leida: true,
        fechaLeida: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      res.status(500).json({ error: 'Error al marcar notificación' });
    }
  }
};

// Función helper para crear notificaciones
const crearNotificacion = async (userId, titulo, mensaje, tipo = 'info') => {
  try {
    await Notificacion.create({
      userId,
      titulo,
      mensaje,
      tipo
    });
  } catch (error) {
    console.error('Error al crear notificación:', error);
  }
};

module.exports = { ...notificacionController, crearNotificacion };
