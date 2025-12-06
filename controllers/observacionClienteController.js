const db = require('../models');
const { ObservacionCliente, Reserva, Cliente, User, Cabana } = db;
const { Op } = require('sequelize');

const observacionClienteController = {
  // Listar observaciones (admin y encargado)
  list: async (req, res) => {
    try {
      const { clienteId, reservaId } = req.query;

      const where = {};
      if (clienteId) where.clienteId = clienteId;
      if (reservaId) where.reservaId = reservaId;

      const observaciones = await ObservacionCliente.findAll({
        where,
        include: [
          { model: Reserva, as: 'reserva', include: [{ model: Cabana, as: 'cabana' }] },
          { model: Cliente, as: 'cliente' },
          { model: User, as: 'registrador' }
        ],
        order: [['fechaObservacion', 'DESC'], ['createdAt', 'DESC']]
      });

      res.render('observaciones/list', { observaciones });
    } catch (error) {
      console.error('Error al listar observaciones:', error);
      res.status(500).render('error', {
        message: 'Error al cargar observaciones',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Mostrar formulario de creación
  showCreate: async (req, res) => {
    try {
      const { reservaId, clienteId } = req.query;

      let reserva = null;
      let cliente = null;
      let todosLosClientes = [];

      if (reservaId) {
        reserva = await Reserva.findByPk(reservaId, {
          include: [
            { model: Cliente, as: 'cliente' },
            { model: Cabana, as: 'cabana' }
          ]
        });
        if (reserva) cliente = reserva.cliente;
      } else if (clienteId) {
        cliente = await Cliente.findByPk(clienteId);
      } else {
        // Si no hay cliente preseleccionado, obtener todos para el select
        todosLosClientes = await Cliente.findAll({
          order: [['nombre', 'ASC'], ['apellido', 'ASC']]
        });
      }

      // Obtener reservas del cliente si se proporciona clienteId
      let reservas = [];
      if (clienteId) {
        reservas = await Reserva.findAll({
          where: { clienteId },
          include: [{ model: Cabana, as: 'cabana' }],
          order: [['fechaInicio', 'DESC']],
          limit: 10
        });
      }

      res.render('observaciones/create', {
        reserva,
        cliente,
        reservas,
        todosLosClientes
      });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', {
        message: 'Error al cargar formulario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Crear observación
  create: async (req, res) => {
    try {
      const { reservaId, clienteId, tipo, descripcion, fechaObservacion, severidad } = req.body;
      const registradoPor = req.session.user.id;

      if (!clienteId || !descripcion) {
        return res.render('observaciones/create', {
          error: 'Cliente y descripción son requeridos',
          reserva: reservaId ? await Reserva.findByPk(reservaId) : null,
          cliente: clienteId ? await Cliente.findByPk(clienteId) : null,
          reservas: [],
          todosLosClientes: await Cliente.findAll({ order: [['nombre', 'ASC']] })
        });
      }

      // Si hay reservaId, verificar que la reserva pertenece al cliente
      if (reservaId) {
        const reserva = await Reserva.findByPk(reservaId);
        if (!reserva || reserva.clienteId !== parseInt(clienteId)) {
          return res.status(400).render('error', {
            message: 'La reserva no pertenece al cliente especificado',
            error: {},
            req: req
          });
        }
      }

      await ObservacionCliente.create({
        reservaId: reservaId ? parseInt(reservaId) : null,
        clienteId: parseInt(clienteId),
        registradoPor,
        tipo: tipo || 'observacion_general',
        descripcion,
        fechaObservacion: fechaObservacion || new Date().toISOString().split('T')[0],
        severidad: severidad || 'media'
      });

      res.redirect('/observaciones?clienteId=' + clienteId);
    } catch (error) {
      console.error('Error al crear observación:', error);
      res.status(500).render('error', {
        message: 'Error al crear observación',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Ver observaciones de un cliente específico
  listByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;

      const cliente = await Cliente.findByPk(clienteId);
      if (!cliente) {
        return res.status(404).render('error', {
          message: 'Cliente no encontrado',
          error: {},
          req: req
        });
      }

      const observaciones = await ObservacionCliente.findAll({
        where: { clienteId },
        include: [
          { model: Reserva, as: 'reserva', include: [{ model: Cabana, as: 'cabana' }] },
          { model: User, as: 'registrador' }
        ],
        order: [['fechaObservacion', 'DESC']]
      });

      res.render('observaciones/list', {
        observaciones,
        cliente
      });
    } catch (error) {
      console.error('Error al listar observaciones del cliente:', error);
      res.status(500).render('error', {
        message: 'Error al cargar observaciones',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Ver observaciones de una reserva específica
  listByReserva: async (req, res) => {
    try {
      const { reservaId } = req.params;

      const reserva = await Reserva.findByPk(reservaId, {
        include: [
          { model: Cliente, as: 'cliente' },
          { model: Cabana, as: 'cabana' }
        ]
      });

      if (!reserva) {
        return res.status(404).render('error', {
          message: 'Reserva no encontrada',
          error: {},
          req: req
        });
      }

      const observaciones = await ObservacionCliente.findAll({
        where: { reservaId },
        include: [
          { model: User, as: 'registrador' }
        ],
        order: [['fechaObservacion', 'DESC']]
      });

      res.render('observaciones/list', {
        observaciones,
        reserva
      });
    } catch (error) {
      console.error('Error al listar observaciones de la reserva:', error);
      res.status(500).render('error', {
        message: 'Error al cargar observaciones',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // API: Obtener reservas de un cliente (para carga dinámica)
  getReservasByCliente: async (req, res) => {
    try {
      const { clienteId } = req.params;

      if (!clienteId) {
        return res.status(400).json({ error: 'clienteId es requerido' });
      }

      const reservas = await Reserva.findAll({
        where: { clienteId },
        include: [
          {
            model: Cabana,
            as: 'cabana',
            required: false // LEFT JOIN para incluir reservas aunque la cabaña no exista
          }
        ],
        order: [['fechaInicio', 'DESC']]
      });

      // Serializar manualmente para asegurar que los datos se envíen correctamente
      const reservasSerializadas = reservas.map(reserva => ({
        id: reserva.id,
        clienteId: reserva.clienteId,
        cabanaId: reserva.cabanaId,
        fechaInicio: reserva.fechaInicio,
        fechaFin: reserva.fechaFin,
        estado: reserva.estado,
        montoCotizado: reserva.montoCotizado,
        cabana: reserva.cabana ? {
          id: reserva.cabana.id,
          nombre: reserva.cabana.nombre,
          capacidad: reserva.cabana.capacidad,
          estado: reserva.cabana.estado
        } : null
      }));

      res.json(reservasSerializadas);
    } catch (error) {
      console.error('Error al obtener reservas del cliente:', error);
      res.status(500).json({
        error: 'Error al obtener reservas',
        message: error.message
      });
    }
  }
};

module.exports = observacionClienteController;

