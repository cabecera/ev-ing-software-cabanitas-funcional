const db = require('../models');
const { Pago, Reserva, Cliente, User, Cabana } = db;
const { crearNotificacion } = require('./notificacionController');

const pagoController = {
  // Mostrar formulario de pago (cliente)
  showPagar: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const clienteId = req.session.user.clienteId;

      const reserva = await Reserva.findByPk(reservaId, {
        include: [
          { model: Cabana, as: 'cabana', required: false },
          { model: Pago, as: 'pago', required: false }
        ]
      });

      if (!reserva) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      if (reserva.clienteId !== clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para ver esta reserva', error: {} });
      }

      res.render('pagos/pagar', { reserva });
    } catch (error) {
      console.error('Error al cargar formulario de pago:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Procesar pago (cliente) - SIMULADO PARA PROTOTIPO
  procesarPago: async (req, res) => {
    try {
      const { reservaId } = req.params;
      const { metodoPago } = req.body;
      const clienteId = req.session.user.clienteId;

      const reserva = await Reserva.findByPk(reservaId, {
        include: [
          { model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] },
          { model: Cabana, as: 'cabana' }
        ]
      });

      if (!reserva || reserva.clienteId !== clienteId) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      // Verificar si ya existe un pago
      let pago = await Pago.findOne({ where: { reservaId: parseInt(reservaId) } });

      const montoTotal = parseFloat(reserva.montoCotizado);

      if (!pago) {
        // Crear nuevo pago COMPLETADO (simulado)
        pago = await Pago.create({
          reservaId: parseInt(reservaId),
          monto: montoTotal,
          metodoPago: metodoPago || 'transferencia',
          estado: 'completado',
          fechaPago: new Date()
        });
      } else {
        // Actualizar pago existente a completado
        await pago.update({
          monto: montoTotal,
          metodoPago: metodoPago || pago.metodoPago,
          estado: 'completado',
          fechaPago: new Date()
        });
      }

      // Actualizar reserva
      await reserva.update({ confirmacion_cliente: true });

      // Notificar admins
      const admins = await User.findAll({ where: { role: 'admin', activo: true } });
      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          'Pago Recibido',
          `El cliente ${reserva.cliente ? reserva.cliente.nombre + ' ' + reserva.cliente.apellido : 'N/A'} ha pagado la reserva #${reserva.id} por $${montoTotal.toLocaleString()}. Método: ${metodoPago || 'transferencia'}`,
          'success'
        );
      }

      // Notificar encargado para preparar cabaña
      const encargados = await User.findAll({ where: { role: 'encargado', activo: true } });
      for (const encargado of encargados) {
        await crearNotificacion(
          encargado.id,
          'Pago Completado - Preparar Cabaña',
          `El cliente ha completado el pago de la reserva para la cabaña "${reserva.cabana ? reserva.cabana.nombre : 'N/A'}". Fecha inicio: ${new Date(reserva.fechaInicio).toLocaleDateString()}.`,
          'info'
        );
      }

      // Notificar al cliente
      if (reserva.cliente && reserva.cliente.user) {
        await crearNotificacion(
          reserva.cliente.user.id,
          'Pago Confirmado',
          `Tu pago de $${montoTotal.toLocaleString()} para la reserva #${reservaId} ha sido confirmado exitosamente.`,
          'success'
        );
      }

      res.redirect('/reservas/mis-reservas?pago=completado');
    } catch (error) {
      console.error('Error al procesar pago:', error);
      res.status(500).render('error', { message: 'Error al procesar pago', error });
    }
  },

  // Mostrar formulario de registro manual (admin)
  showRegistrar: async (req, res) => {
    try {
      const { reservaId } = req.query;
      if (!reservaId) {
        return res.redirect('/reservas');
      }

      const reserva = await Reserva.findByPk(reservaId, {
        include: [
          { model: Cabana, as: 'cabana' },
          { model: Cliente, as: 'cliente' }
        ]
      });

      if (!reserva) {
        return res.status(404).render('error', { message: 'Reserva no encontrada', error: {} });
      }

      res.render('pagos/registrar', { reserva });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Registrar pago manual (admin)
  registrarPago: async (req, res) => {
    try {
      const { reservaId } = req.body;
      const { metodoPago, monto } = req.body;

      const reserva = await Reserva.findByPk(reservaId, {
        include: [{ model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] }]
      });

      if (!reserva) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }

      let pago = await Pago.findOne({ where: { reservaId } });

      if (!pago) {
        pago = await Pago.create({
          reservaId,
          monto: parseFloat(monto),
          metodoPago,
          estado: 'completado',
          fechaPago: new Date()
        });
      } else {
        await pago.update({
          monto: parseFloat(monto),
          metodoPago,
          estado: 'completado',
          fechaPago: new Date()
        });
      }

      await reserva.update({ confirmacion_cliente: true });

      // Notificar al cliente
      if (reserva.cliente && reserva.cliente.user) {
        const { crearNotificacion } = require('./notificacionController');
        await crearNotificacion(
          reserva.cliente.user.id,
          'Pago Registrado',
          `Se ha registrado el pago de $${parseFloat(monto).toLocaleString()} para tu reserva #${reservaId}`,
          'success'
        );
      }

      res.redirect('/reservas');
    } catch (error) {
      console.error('Error al registrar pago:', error);
      res.status(500).json({ error: 'Error al registrar pago' });
    }
  }
};

module.exports = pagoController;
