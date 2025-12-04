const db = require('../models');
const { EncuestaSatisfaccion, Reserva, Cliente } = db;

const encuestaController = {
  // Mostrar formulario de encuesta
  showForm: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const clienteId = req.session.user?.clienteId;

      if (!clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para acceder a esta página', error: {} });
      }

      const reserva = await Reserva.findByPk(reservaId, {
        include: [{ model: db.Cabana, as: 'cabana' }]
      });

      if (!reserva) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      if (reserva.clienteId !== clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para ver esta reserva', error: {} });
      }

      // Aceptar reservas confirmadas o completadas (para prototipo)
      const estadosPermitidos = ['confirmada', 'completada'];
      if (!estadosPermitidos.includes(reserva.estado)) {
        return res.status(400).render('error', {
          message: `Solo se pueden responder encuestas para reservas confirmadas o completadas. Estado actual: ${reserva.estado}`,
          error: {}
        });
      }

      // Verificar si ya completó la encuesta
      const encuestaExistente = await EncuestaSatisfaccion.findOne({ where: { reservaId } });
      if (encuestaExistente) {
        return res.redirect('/reservas/mis-reservas?encuesta=completada');
      }

      res.render('encuestas/form', { reserva });
    } catch (error) {
      console.error('Error al cargar encuesta:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Procesar encuesta
  submit: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const clienteId = req.session.user.clienteId;
      const { calificacionGeneral, calificacionLimpieza, calificacionServicio, calificacionPrecio, comentarios, recomendaria } = req.body;

      const reserva = await Reserva.findByPk(reservaId);
      if (!reserva || reserva.clienteId !== clienteId) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      await EncuestaSatisfaccion.create({
        reservaId,
        clienteId,
        calificacionGeneral: parseInt(calificacionGeneral),
        calificacionLimpieza: calificacionLimpieza ? parseInt(calificacionLimpieza) : null,
        calificacionServicio: calificacionServicio ? parseInt(calificacionServicio) : null,
        calificacionPrecio: calificacionPrecio ? parseInt(calificacionPrecio) : null,
        comentarios: comentarios || null,
        recomendaria: recomendaria === 'true'
      });

      // Notificar a administradores sobre la nueva encuesta
      const { crearNotificacion } = require('./notificacionController');
      const { User, Cabana } = db;

      try {
        const reservaConCabana = await Reserva.findByPk(reservaId, {
          include: [{ model: Cabana, as: 'cabana', required: false }]
        });

        const admins = await User.findAll({ where: { role: 'admin', activo: true } });
        for (const admin of admins) {
          await crearNotificacion(
            admin.id,
            'Nueva Encuesta de Satisfacción',
            `Un cliente ha completado una encuesta de satisfacción para la reserva #${reservaId} de la cabaña "${reservaConCabana && reservaConCabana.cabana ? reservaConCabana.cabana.nombre : 'N/A'}". Calificación: ${calificacionGeneral}/5`,
            'info'
          );
        }
      } catch (notifError) {
        console.error('Error al notificar administradores sobre encuesta:', notifError);
        // No fallar el proceso si las notificaciones fallan
      }

      res.redirect('/reservas/mis-reservas?encuesta=gracias');
    } catch (error) {
      console.error('Error al enviar encuesta:', error);
      res.status(500).render('error', { message: 'Error al enviar encuesta', error });
    }
  },

  // Ver estadísticas (admin)
  estadisticas: async (req, res) => {
    try {
      // Verificar que el usuario tenga rol de admin
      if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).render('error', {
          message: 'No tienes permiso para acceder a esta página',
          error: {},
          req: req
        });
      }

      const encuestas = await EncuestaSatisfaccion.findAll({
        include: [
          {
            model: Reserva,
            as: 'reserva',
            required: false,
            include: [{
              model: db.Cabana,
              as: 'cabana',
              required: false
            }]
          },
          {
            model: Cliente,
            as: 'cliente',
            required: false
          }
        ],
        order: [['createdAt', 'DESC']]
      }).catch(() => []);

      // Calcular promedios de forma segura
      const encuestasConGeneral = encuestas.filter(e => e && e.calificacionGeneral != null);
      const encuestasConLimpieza = encuestas.filter(e => e && e.calificacionLimpieza != null);
      const encuestasConServicio = encuestas.filter(e => e && e.calificacionServicio != null);
      const encuestasConPrecio = encuestas.filter(e => e && e.calificacionPrecio != null);

      const promedios = {
        general: encuestasConGeneral.length > 0
          ? encuestasConGeneral.reduce((sum, e) => sum + (parseFloat(e.calificacionGeneral) || 0), 0) / encuestasConGeneral.length
          : 0,
        limpieza: encuestasConLimpieza.length > 0
          ? encuestasConLimpieza.reduce((sum, e) => sum + (parseFloat(e.calificacionLimpieza) || 0), 0) / encuestasConLimpieza.length
          : 0,
        servicio: encuestasConServicio.length > 0
          ? encuestasConServicio.reduce((sum, e) => sum + (parseFloat(e.calificacionServicio) || 0), 0) / encuestasConServicio.length
          : 0,
        precio: encuestasConPrecio.length > 0
          ? encuestasConPrecio.reduce((sum, e) => sum + (parseFloat(e.calificacionPrecio) || 0), 0) / encuestasConPrecio.length
          : 0,
        recomendarian: encuestas.filter(e => e && e.recomendaria === true).length
      };

      res.render('encuestas/estadisticas', {
        encuestas: encuestas || [],
        promedios,
        req: req
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      res.status(500).render('error', {
        message: 'Error al cargar estadísticas',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  }
};

module.exports = encuestaController;
