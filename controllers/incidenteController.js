const db = require('../models');
const { Incidente, Reserva, Cliente, Cabana, User } = db;
const { crearNotificacion } = require('./notificacionController');

const incidenteController = {
  // Listar incidentes
  list: async (req, res) => {
    try {
      const whereClause = req.session.user.role === 'cliente'
        ? { clienteId: req.session.user.clienteId }
        : {};

      const incidentes = await Incidente.findAll({
        where: whereClause,
        include: [
          { model: Reserva, as: 'reserva', required: false },
          { model: Cliente, as: 'cliente', required: false },
          { model: Cabana, as: 'cabana' },
          { model: User, as: 'resolutor', required: false }
        ],
        order: [['createdAt', 'DESC']]
      });

      res.render('incidentes/list', { incidentes, user: req.session.user });
    } catch (error) {
      console.error('Error al listar incidentes:', error);
      res.status(500).render('error', { message: 'Error al cargar incidentes', error });
    }
  },

  // Mostrar formulario de creación
  showCreate: async (req, res) => {
    try {
      const { reservaId } = req.query;
      let reserva = null;
      let cabanas = await Cabana.findAll({ order: [['nombre', 'ASC']] });

      if (reservaId) {
        reserva = await Reserva.findByPk(reservaId, {
          include: [{ model: Cabana, as: 'cabana' }]
        });
      }

      res.render('incidentes/create', { reserva, cabanas });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Crear incidente
  create: async (req, res) => {
    try {
      const clienteId = req.session.user.role === 'cliente' ? req.session.user.clienteId : req.body.clienteId;
      const { reservaId, cabanaId, tipo, descripcion } = req.body;

      const incidente = await Incidente.create({
        reservaId: reservaId || null,
        clienteId: clienteId || null,
        cabanaId: parseInt(cabanaId),
        tipo,
        descripcion,
        estado: 'pendiente'
      });

      // Notificar a admins
      const admins = await User.findAll({ where: { role: 'admin', activo: true } });
      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          'Nuevo Incidente Reportado',
          `Se ha reportado un incidente de tipo ${tipo} en la cabaña #${cabanaId}. ${descripcion}`,
          'warning'
        );
      }

      res.redirect('/incidentes');
    } catch (error) {
      console.error('Error al crear incidente:', error);
      res.render('incidentes/create', { error: 'Error al crear incidente', cabanas: await Cabana.findAll() });
    }
  },

  // Proponer solución (admin)
  proponerSolucion: async (req, res) => {
    try {
      const { id } = req.params;
      const { solucionPropuesta } = req.body;

      const incidente = await Incidente.findByPk(id, {
        include: [{ model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] }]
      });

      if (!incidente) {
        return res.status(404).json({ error: 'Incidente no encontrado' });
      }

      await incidente.update({
        solucionPropuesta,
        estado: 'en_revision'
      });

      // Notificar al cliente
      if (incidente.cliente && incidente.cliente.user) {
        await crearNotificacion(
          incidente.cliente.user.id,
          'Solución Propuesta para Incidente',
          `Se ha propuesto una solución para tu incidente: ${solucionPropuesta}. Por favor revisa y acepta o rechaza.`,
          'info'
        );
      }

      res.redirect('/incidentes');
    } catch (error) {
      console.error('Error al proponer solución:', error);
      res.status(500).json({ error: 'Error al proponer solución' });
    }
  },

  // Aceptar/Rechazar solución (cliente)
  responderSolucion: async (req, res) => {
    try {
      const { id } = req.params;
      const { aceptar } = req.body;
      const clienteId = req.session.user.clienteId;

      const incidente = await Incidente.findByPk(id);
      if (!incidente || incidente.clienteId !== clienteId) {
        return res.status(404).json({ error: 'Incidente no encontrado' });
      }

      await incidente.update({
        solucionAceptada: aceptar === 'true',
        estado: aceptar === 'true' ? 'resuelto' : 'pendiente',
        fechaResolucion: aceptar === 'true' ? new Date() : null
      });

      res.redirect('/incidentes');
    } catch (error) {
      console.error('Error al responder solución:', error);
      res.status(500).json({ error: 'Error al responder' });
    }
  },

  // Resolver incidente (admin)
  resolver: async (req, res) => {
    try {
      const { id } = req.params;

      const incidente = await Incidente.findByPk(id);
      if (!incidente) {
        return res.status(404).json({ error: 'Incidente no encontrado' });
      }

      await incidente.update({
        estado: 'resuelto',
        fechaResolucion: new Date(),
        resueltoPor: req.session.user.id
      });

      res.redirect('/incidentes');
    } catch (error) {
      console.error('Error al resolver incidente:', error);
      res.status(500).json({ error: 'Error al resolver incidente' });
    }
  }
};

module.exports = incidenteController;




