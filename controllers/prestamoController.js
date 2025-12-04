const db = require('../models');
const { PrestamoImplemento, Implemento, Cliente, Pago, User } = db;
const { crearNotificacion } = require('./notificacionController');

const prestamoController = {
  // Listar préstamos del cliente
  listCliente: async (req, res) => {
    try {
      const clienteId = req.session.user.clienteId;
      const prestamos = await PrestamoImplemento.findAll({
        where: { clienteId },
        include: [
          { model: Implemento, as: 'implemento' },
          { model: Pago, as: 'pago', required: false }
        ],
        order: [['fechaPrestamo', 'DESC']]
      });

      res.render('prestamos/mis_prestamos', { prestamos });
    } catch (error) {
      console.error('Error al listar préstamos:', error);
      res.status(500).render('error', { message: 'Error al cargar préstamos', error });
    }
  },

  // Listar todos los préstamos (admin)
  listAll: async (req, res) => {
    try {
      const prestamos = await PrestamoImplemento.findAll({
        include: [
          { model: Implemento, as: 'implemento' },
          { model: Cliente, as: 'cliente' },
          { model: Pago, as: 'pago', required: false }
        ],
        order: [['fechaPrestamo', 'DESC']]
      });

      res.render('prestamos/list', { prestamos });
    } catch (error) {
      console.error('Error al listar préstamos:', error);
      res.status(500).render('error', { message: 'Error al cargar préstamos', error });
    }
  },

  // Mostrar formulario de solicitud
  showCreate: async (req, res) => {
    try {
      const implementos = await Implemento.findAll({
        where: {
          stockDisponible: {
            [require('sequelize').Op.gt]: 0
          }
        },
        order: [['nombre', 'ASC']]
      });

      res.render('prestamos/create', { implementos });
    } catch (error) {
      console.error('Error al cargar formulario:', error);
      res.status(500).render('error', { message: 'Error al cargar formulario', error });
    }
  },

  // Crear préstamo
  create: async (req, res) => {
    try {
      const clienteId = req.session.user.clienteId;
      const { implementoId, cantidad, metodoPago } = req.body;

      if (!clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para solicitar préstamos', error: {} });
      }

      const implemento = await Implemento.findByPk(implementoId);
      if (!implemento) {
        return res.status(404).render('error', { message: 'Implemento no encontrado', error: {} });
      }

      const cantidadSolicitada = parseInt(cantidad);

      // Validar stock disponible
      if (implemento.stockDisponible < cantidadSolicitada) {
        const implementos = await Implemento.findAll({
          where: {
            stockDisponible: {
              [require('sequelize').Op.gt]: 0
            }
          },
          order: [['nombre', 'ASC']]
        });
        return res.render('prestamos/create', {
          error: `No hay suficiente stock disponible. Stock actual: ${implemento.stockDisponible}`,
          implementos
        });
      }

      // Calcular monto total
      const montoTotal = parseFloat(implemento.precioPrestamo || 0) * cantidadSolicitada;

      // Validar que si hay precio, se proporcione método de pago
      if (montoTotal > 0 && !metodoPago) {
        const implementos = await Implemento.findAll({
          where: {
            stockDisponible: {
              [require('sequelize').Op.gt]: 0
            }
          },
          order: [['nombre', 'ASC']]
        });
        return res.render('prestamos/create', {
          error: 'Debe seleccionar un método de pago',
          implementos
        });
      }

      // Obtener cliente con usuario para notificaciones
      const cliente = await Cliente.findByPk(clienteId, {
        include: [{ model: User, as: 'user' }]
      });

      // Crear préstamo, pago y reducir stock
      const transaction = await db.sequelize.transaction();

      try {
        // Crear préstamo
        const prestamo = await PrestamoImplemento.create({
          clienteId,
          implementoId,
          cantidad: cantidadSolicitada,
          estado: 'activo'
        }, { transaction });

        // Reducir stock
        await implemento.update({
          stockDisponible: implemento.stockDisponible - cantidadSolicitada
        }, { transaction });

        // Crear pago si hay monto
        if (montoTotal > 0) {
          // Crear pago para préstamo (reservaId es NULL)
          await Pago.create({
            reservaId: null,
            prestamoImplementoId: prestamo.id,
            monto: montoTotal,
            metodoPago: metodoPago || 'transferencia',
            estado: 'completado',
            fechaPago: new Date()
          }, { transaction });
        }

        await transaction.commit();

        // Notificar a administradores
        try {
          const admins = await User.findAll({ where: { role: 'admin', activo: true } });
          for (const admin of admins) {
            await crearNotificacion(
              admin.id,
              'Nuevo Préstamo de Implemento',
              `El cliente ${cliente ? cliente.nombre + ' ' + cliente.apellido : 'N/A'} ha solicitado un préstamo de ${cantidadSolicitada} unidad(es) de "${implemento.nombre}".${montoTotal > 0 ? ` Monto pagado: $${montoTotal.toLocaleString()}` : ' (Gratis)'}`,
              'info'
            );
          }
        } catch (notifError) {
          console.error('Error al crear notificaciones a administradores:', notifError);
          // No fallar el proceso si las notificaciones fallan
        }

        // Notificar a encargados
        try {
          const encargados = await User.findAll({ where: { role: 'encargado', activo: true } });
          for (const encargado of encargados) {
            await crearNotificacion(
              encargado.id,
              'Nuevo Préstamo de Implemento',
              `El cliente ${cliente ? cliente.nombre + ' ' + cliente.apellido : 'N/A'} ha solicitado un préstamo de ${cantidadSolicitada} unidad(es) de "${implemento.nombre}".${montoTotal > 0 ? ` Monto pagado: $${montoTotal.toLocaleString()}` : ' (Gratis)'}`,
              'info'
            );
          }
        } catch (notifError) {
          console.error('Error al crear notificaciones a encargados:', notifError);
          // No fallar el proceso si las notificaciones fallan
        }

        // Notificar al cliente
        try {
          if (cliente && cliente.user) {
            await crearNotificacion(
              cliente.user.id,
              'Préstamo Confirmado',
              `Tu préstamo de ${cantidadSolicitada} unidad(es) de "${implemento.nombre}" ha sido confirmado.${montoTotal > 0 ? ` Pago recibido: $${montoTotal.toLocaleString()}` : ''}`,
              'success'
            );
          }
        } catch (notifError) {
          console.error('Error al notificar al cliente:', notifError);
          // No fallar el proceso si las notificaciones fallan
        }

        res.redirect('/prestamos/mis-prestamos?prestamo=completado');
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error al crear préstamo:', error);
      try {
        const implementos = await Implemento.findAll({
          where: {
            stockDisponible: {
              [require('sequelize').Op.gt]: 0
            }
          },
          order: [['nombre', 'ASC']]
        });
        res.render('prestamos/create', {
          error: 'Error al crear préstamo. Intenta nuevamente.',
          implementos
        });
      } catch (loadError) {
        console.error('Error al cargar implementos para error:', loadError);
        res.status(500).render('error', { message: 'Error al crear préstamo', error });
      }
    }
  },

  // Devolver implemento
  devolver: async (req, res) => {
    try {
      const { id } = req.params;
      const prestamo = await PrestamoImplemento.findByPk(id, {
        include: [{ model: Implemento, as: 'implemento' }]
      });

      if (!prestamo || prestamo.estado !== 'activo') {
        return res.status(404).json({ error: 'Préstamo no encontrado o ya devuelto' });
      }

      // Verificar permisos
      if (req.session.user.role === 'cliente' && prestamo.clienteId !== req.session.user.clienteId) {
        return res.status(403).json({ error: 'No tienes permiso para devolver este préstamo' });
      }

      const transaction = await db.sequelize.transaction();

      try {
        await prestamo.update({
          estado: 'devuelto',
          fechaDevolucion: new Date()
        }, { transaction });

        await prestamo.implemento.update({
          stockDisponible: prestamo.implemento.stockDisponible + prestamo.cantidad
        }, { transaction });

        await transaction.commit();
        res.redirect('/prestamos/mis-prestamos');
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error al devolver implemento:', error);
      res.status(500).json({ error: 'Error al devolver implemento' });
    }
  }
};

module.exports = prestamoController;
