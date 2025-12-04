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

