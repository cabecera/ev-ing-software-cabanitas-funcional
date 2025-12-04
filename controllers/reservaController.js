const db = require('../models');
const { Reserva, Cabana, Cliente, Pago, Mantenimiento, User, Notificacion, EncuestaSatisfaccion } = db;
const { Op } = require('sequelize');
const { crearNotificacion } = require('./notificacionController');

// Función auxiliar para obtener fechas ocupadas
async function obtenerFechasOcupadas() {
  const reservasActivas = await Reserva.findAll({
    where: {
      estado: {
        [Op.in]: ['pendiente', 'confirmada']
      }
    },
    order: [['fechaInicio', 'ASC']]
  });

  const mantenimientosActivos = await Mantenimiento.findAll({
    where: {
      estado: {
        [Op.in]: ['programado', 'en_proceso']
      }
    },
    order: [['fechaInicio', 'ASC']]
  });

  const fechasOcupadasPorCabana = {};

  reservasActivas.forEach(reserva => {
    if (!fechasOcupadasPorCabana[reserva.cabanaId]) {
      fechasOcupadasPorCabana[reserva.cabanaId] = [];
    }
    fechasOcupadasPorCabana[reserva.cabanaId].push({
      inicio: reserva.fechaInicio,
      fin: reserva.fechaFin,
      tipo: 'reserva'
    });
  });

  mantenimientosActivos.forEach(mantenimiento => {
    if (!fechasOcupadasPorCabana[mantenimiento.cabanaId]) {
      fechasOcupadasPorCabana[mantenimiento.cabanaId] = [];
    }
    fechasOcupadasPorCabana[mantenimiento.cabanaId].push({
      inicio: mantenimiento.fechaInicio,
      fin: mantenimiento.fechaFin,
      tipo: 'mantenimiento'
    });
  });

  return fechasOcupadasPorCabana;
}

const reservaController = {
  // Listar reservas del cliente
  listCliente: async (req, res) => {
    try {
      const clienteId = req.session.user.clienteId;

      if (!clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para ver reservas', error: {} });
      }

      const reservas = await Reserva.findAll({
        where: { clienteId },
        include: [
          { model: Cabana, as: 'cabana' },
          { model: Pago, as: 'pago', required: false }
        ],
        order: [['fechaInicio', 'DESC']]
      });

      // Verificar si hay encuestas completadas
      const { EncuestaSatisfaccion } = db;
      for (const reserva of reservas) {
        if (reserva.estado === 'completada') {
          const encuesta = await EncuestaSatisfaccion.findOne({ where: { reservaId: reserva.id } });
          reserva.encuestaCompletada = !!encuesta;
        }
      }

      res.render('reservas/mis_reservas', { reservas });
    } catch (error) {
      console.error('Error al listar reservas:', error);
      res.status(500).render('error', { message: 'Error al cargar reservas', error });
    }
  },

  // Listar todas las reservas (admin)
  listAll: async (req, res) => {
    try {
      const reservas = await Reserva.findAll({
        include: [
          { model: Cabana, as: 'cabana' },
          { model: Cliente, as: 'cliente', include: ['user'] },
          { model: Pago, as: 'pago', required: false }
        ],
        order: [['fechaInicio', 'DESC']]
      });

      res.render('reservas/list', { reservas });
    } catch (error) {
      console.error('Error al listar reservas:', error);
      res.status(500).render('error', { message: 'Error al cargar reservas', error });
    }
  },

  // Mostrar formulario de solicitud de reserva
  showCreate: async (req, res) => {
    try {
      const { cabanaId } = req.query;
      const cabanas = await Cabana.findAll({
        where: { estado: 'disponible' },
        order: [['nombre', 'ASC']]
      });

      let cabanaSeleccionada = null;
      if (cabanaId) {
        cabanaSeleccionada = await Cabana.findByPk(cabanaId);
      }

      // Obtener fechas ocupadas
      const fechasOcupadasPorCabana = await obtenerFechasOcupadas();

      res.render('reservas/create', {
        cabanas,
        cabanaSeleccionada,
        fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
      });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Crear reserva
  create: async (req, res) => {
    try {
      const clienteId = req.session.user.clienteId;
      // Flatpickr envía las fechas en formato YYYY-MM-DD a través de los hidden inputs
      const { cabanaId, fechaInicio, fechaFin } = req.body;

      if (!clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para crear reservas', error: {} });
      }

      // Validar que las fechas existan y sean válidas
      if (!fechaInicio || !fechaFin || fechaInicio === 'Invalid date' || fechaFin === 'Invalid date') {
        const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
        let cabanaSeleccionada = null;
        if (cabanaId) {
          cabanaSeleccionada = await Cabana.findByPk(cabanaId);
        }
        const fechasOcupadasPorCabana = await obtenerFechasOcupadas();
        return res.render('reservas/create', {
          error: 'Por favor, seleccione fechas válidas',
          cabanas,
          cabanaSeleccionada,
          fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
        });
      }

      // Validar formato de fecha (YYYY-MM-DD)
      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fechaInicio) || !fechaRegex.test(fechaFin)) {
        const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
        let cabanaSeleccionada = null;
        if (cabanaId) {
          cabanaSeleccionada = await Cabana.findByPk(cabanaId);
        }
        const fechasOcupadasPorCabana = await obtenerFechasOcupadas();
        return res.render('reservas/create', {
          error: 'Formato de fecha inválido. Por favor, seleccione las fechas nuevamente',
          cabanas,
          cabanaSeleccionada,
          fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
        });
      }

      // Validar que las fechas sean válidas antes de verificar disponibilidad
      const fechaInicioDate = new Date(fechaInicio + 'T00:00:00');
      const fechaFinDate = new Date(fechaFin + 'T00:00:00');

      if (isNaN(fechaInicioDate.getTime()) || isNaN(fechaFinDate.getTime())) {
        const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
        let cabanaSeleccionada = null;
        if (cabanaId) {
          cabanaSeleccionada = await Cabana.findByPk(cabanaId);
        }
        const fechasOcupadasPorCabana = await obtenerFechasOcupadas();
        return res.render('reservas/create', {
          error: 'Las fechas proporcionadas no son válidas. Por favor, seleccione las fechas nuevamente.',
          cabanas,
          cabanaSeleccionada,
          fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
        });
      }

      // Validar que la fecha de inicio sea al menos 4 días en el futuro
      const fechaMinima = new Date();
      fechaMinima.setDate(fechaMinima.getDate() + 4);
      fechaMinima.setHours(0, 0, 0, 0);

      if (fechaInicioDate < fechaMinima) {
        const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
        let cabanaSeleccionada = null;
        if (cabanaId) {
          cabanaSeleccionada = await Cabana.findByPk(cabanaId);
        }
        const fechasOcupadasPorCabana = await obtenerFechasOcupadas();
        return res.render('reservas/create', {
          error: 'La reserva debe realizarse con al menos 4 días de anticipación',
          cabanas,
          cabanaSeleccionada,
          fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
        });
      }

      // Verificar disponibilidad (las fechas ya fueron validadas arriba)
      const disponible = await reservaController.verificarDisponibilidad(cabanaId, fechaInicio, fechaFin);
      if (!disponible) {
        const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
        let cabanaSeleccionada = null;
        if (cabanaId) {
          cabanaSeleccionada = await Cabana.findByPk(cabanaId);
        }
        const fechasOcupadasPorCabana = await obtenerFechasOcupadas();
        return res.render('reservas/create', {
          error: 'La cabaña no está disponible en las fechas seleccionadas',
          cabanas,
          cabanaSeleccionada,
          fechasOcupadasPorCabana: JSON.stringify(fechasOcupadasPorCabana)
        });
      }

      // Calcular monto
      const cabana = await Cabana.findByPk(cabanaId);
      const dias = Math.ceil((new Date(fechaFin) - new Date(fechaInicio)) / (1000 * 60 * 60 * 24));
      const montoCotizado = dias * parseFloat(cabana.precioNoche);

      // Crear reserva
      const reserva = await Reserva.create({
        clienteId,
        cabanaId: parseInt(cabanaId),
        fechaInicio,
        fechaFin,
        montoCotizado,
        estado: 'pendiente',
        confirmacion_cliente: false
      });

      // Obtener datos del cliente y cabaña para las notificaciones
      const cliente = await Cliente.findByPk(clienteId, { include: [{ model: User, as: 'user' }] });

      // Crear notificación para el cliente
      if (cliente && cliente.user) {
        await crearNotificacion(
          cliente.user.id,
          'Reserva Creada',
          `Tu reserva para la cabaña "${cabana.nombre}" del ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()} ha sido creada y está pendiente de confirmación.`,
          'success'
        );
      }

      // Crear notificaciones para todos los administradores
      const admins = await User.findAll({ where: { role: 'admin', activo: true } });
      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          'Nueva Reserva Pendiente',
          `El cliente ${cliente ? cliente.nombre + ' ' + cliente.apellido : 'N/A'} ha solicitado una reserva para la cabaña "${cabana.nombre}" del ${new Date(fechaInicio).toLocaleDateString()} al ${new Date(fechaFin).toLocaleDateString()}. Monto: $${parseFloat(montoCotizado).toLocaleString()}`,
          'warning'
        );
      }

      // Notificar al encargado
      const encargados = await User.findAll({ where: { role: 'encargado', activo: true } });
      for (const encargado of encargados) {
        await crearNotificacion(
          encargado.id,
          'Nueva Reserva Pendiente',
          `Se ha creado una nueva reserva para la cabaña "${cabana.nombre}". Esperando confirmación del administrador.`,
          'info'
        );
      }

      res.redirect('/reservas/mis-reservas');
    } catch (error) {
      console.error('Error al crear reserva:', error);
      const cabanas = await Cabana.findAll({ where: { estado: 'disponible' } });
      res.render('reservas/create', {
        error: 'Error al crear reserva. Intenta nuevamente.',
        cabanas,
        cabanaSeleccionada: null
      });
    }
  },

  // Verificar disponibilidad de cabaña
  verificarDisponibilidad: async (cabanaId, fechaInicio, fechaFin) => {
    try {
      // Verificar si hay mantenimiento programado
      const mantenimiento = await Mantenimiento.findOne({
        where: {
          cabanaId,
          estado: {
            [Op.in]: ['programado', 'en_proceso']
          },
          [Op.or]: [
            {
              fechaInicio: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              fechaFin: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              [Op.and]: [
                { fechaInicio: { [Op.lte]: fechaInicio } },
                { fechaFin: { [Op.gte]: fechaFin } }
              ]
            }
          ]
        }
      });

      if (mantenimiento) {
        return false;
      }

      // Verificar si hay reservas solapadas
      const reservasExistentes = await Reserva.findAll({
        where: {
          cabanaId,
          estado: {
            [Op.in]: ['pendiente', 'confirmada']
          },
          [Op.or]: [
            {
              fechaInicio: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              fechaFin: {
                [Op.between]: [fechaInicio, fechaFin]
              }
            },
            {
              [Op.and]: [
                { fechaInicio: { [Op.lte]: fechaInicio } },
                { fechaFin: { [Op.gte]: fechaFin } }
              ]
            }
          ]
        }
      });

      return reservasExistentes.length === 0;
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      return false;
    }
  },

  // Confirmar reserva (admin)
  confirm: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] },
          { model: Cabana, as: 'cabana' }
        ]
      });

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      await reserva.update({ estado: 'confirmada' });

      // Cambiar estado de cabaña
      await Cabana.update(
        { estado: 'reservada' },
        { where: { id: reserva.cabanaId } }
      );

      // Notificar al cliente que su reserva fue confirmada
      if (reserva.cliente && reserva.cliente.user) {
        await crearNotificacion(
          reserva.cliente.user.id,
          'Reserva Confirmada',
          `Tu reserva para la cabaña "${reserva.cabana.nombre}" del ${new Date(reserva.fechaInicio).toLocaleDateString()} al ${new Date(reserva.fechaFin).toLocaleDateString()} ha sido confirmada.`,
          'success'
        );
      }

      // Notificar al encargado
      const encargados = await User.findAll({ where: { role: 'encargado', activo: true } });
      for (const encargado of encargados) {
        await crearNotificacion(
          encargado.id,
          'Reserva Confirmada - Preparar Cabaña',
          `La reserva para la cabaña "${reserva.cabana.nombre}" ha sido confirmada. Fecha inicio: ${new Date(reserva.fechaInicio).toLocaleDateString()}.`,
          'warning'
        );
      }

      res.redirect('/reservas');
    } catch (error) {
      console.error('Error al confirmar reserva:', error);
      res.status(500).json({ error: 'Error al confirmar reserva' });
    }
  },

  // Cancelar reserva
  cancel: async (req, res) => {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findByPk(id, {
        include: [
          { model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] },
          { model: Cabana, as: 'cabana' }
        ]
      });

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      // Verificar permisos (cliente solo puede cancelar sus propias reservas)
      if (req.session.user.role === 'cliente' && reserva.clienteId !== req.session.user.clienteId) {
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta reserva' });
      }

      await reserva.update({ estado: 'cancelada' });

      // Liberar cabaña
      await Cabana.update(
        { estado: 'disponible' },
        { where: { id: reserva.cabanaId } }
      );

      // Notificar al cliente que su reserva fue cancelada
      if (reserva.cliente && reserva.cliente.user) {
        await crearNotificacion(
          reserva.cliente.user.id,
          'Reserva Cancelada',
          `Tu reserva para la cabaña "${reserva.cabana.nombre}" del ${new Date(reserva.fechaInicio).toLocaleDateString()} al ${new Date(reserva.fechaFin).toLocaleDateString()} ha sido cancelada.`,
          'warning'
        );
      }

      // Notificar a los admins
      const admins = await User.findAll({ where: { role: 'admin', activo: true } });
      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          'Reserva Cancelada',
          `La reserva del cliente ${reserva.cliente ? reserva.cliente.nombre + ' ' + reserva.cliente.apellido : 'N/A'} para la cabaña "${reserva.cabana.nombre}" ha sido cancelada.`,
          'info'
        );
      }

      res.redirect('/reservas/mis-reservas');
    } catch (error) {
      console.error('Error al cancelar reserva:', error);
      res.status(500).json({ error: 'Error al cancelar reserva' });
    }
  }
};

// Exportar función de verificación de disponibilidad
reservaController.verificarDisponibilidad = async (cabanaId, fechaInicio, fechaFin) => {
  try {
    // Verificar mantenimientos
    const mantenimiento = await Mantenimiento.findOne({
      where: {
        cabanaId,
        estado: {
          [Op.in]: ['programado', 'en_proceso']
        },
        [Op.or]: [
          {
            fechaInicio: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          {
            fechaFin: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          }
        ]
      }
    });

    if (mantenimiento) return false;

    // Verificar reservas solapadas
    const reservasExistentes = await Reserva.findAll({
      where: {
        cabanaId,
        estado: {
          [Op.in]: ['pendiente', 'confirmada']
        },
        [Op.or]: [
          {
            fechaInicio: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          {
            fechaFin: {
              [Op.between]: [fechaInicio, fechaFin]
            }
          },
          {
            [Op.and]: [
              { fechaInicio: { [Op.lte]: fechaInicio } },
              { fechaFin: { [Op.gte]: fechaFin } }
            ]
          }
        ]
      }
    });

    return reservasExistentes.length === 0;
  } catch (error) {
    console.error('Error al verificar disponibilidad:', error);
    return false;
  }
};

module.exports = reservaController;
