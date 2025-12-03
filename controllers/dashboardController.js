const db = require('../models');
const { Reserva, Cabana, Cliente, PrestamoImplemento, Notificacion, Mantenimiento, TareaTrabajador } = db;
const { Op } = require('sequelize');

const dashboardController = {
  // Dashboard admin
  admin: async (req, res) => {
    try {
      // Obtener reservas pendientes (pendientes de confirmación o confirmadas sin pago)
      const { Pago } = db;
      const reservasPendientesQuery = await Reserva.findAll({
        where: {
          estado: { [Op.in]: ['pendiente', 'confirmada'] }
        },
        include: [{
          model: Pago,
          as: 'pago',
          required: false
        }]
      }).catch(() => []);

      // Contar reservas que están pendientes O confirmadas sin pago completo
      const reservasPendientesCount = reservasPendientesQuery.filter(r => {
        return r.estado === 'pendiente' ||
               (r.estado === 'confirmada' && (!r.pago || r.pago.estado !== 'completado'));
      }).length;

      const [
        totalCabanas,
        totalReservas,
        mantenimientosActivos,
        prestamosActivos,
        notificaciones
      ] = await Promise.allSettled([
        Cabana.count().catch(() => 0),
        Reserva.count().catch(() => 0),
        Mantenimiento.count({ where: { estado: { [Op.in]: ['programado', 'en_proceso'] } } }).catch(() => 0),
        PrestamoImplemento.count({ where: { estado: 'activo' } }).catch(() => 0),
        Notificacion.findAll({
          where: { userId: req.session.user?.id, leida: false },
          limit: 5,
          order: [['createdAt', 'DESC']]
        }).catch(() => [])
      ]);

      res.render('dashboard/admin', {
        stats: {
          totalCabanas: totalCabanas.status === 'fulfilled' ? totalCabanas.value : 0,
          totalReservas: totalReservas.status === 'fulfilled' ? totalReservas.value : 0,
          reservasPendientes: reservasPendientesCount,
          mantenimientosActivos: mantenimientosActivos.status === 'fulfilled' ? mantenimientosActivos.value : 0,
          prestamosActivos: prestamosActivos.status === 'fulfilled' ? prestamosActivos.value : 0
        },
        notificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value : []
      });
    } catch (error) {
      console.error('Error al cargar dashboard admin:', error);
      res.status(500).render('error', {
        message: 'Error al cargar dashboard. Algunos datos pueden no estar disponibles.',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Dashboard cliente
  cliente: async (req, res) => {
    try {
      const clienteId = req.session?.user?.clienteId;

      if (!clienteId) {
        return res.status(403).render('error', { message: 'No tienes permiso para acceder', error: {}, req: req });
      }

      const [
        misReservas,
        reservasActivas,
        prestamosActivos,
        notificaciones
      ] = await Promise.allSettled([
        Reserva.count({ where: { clienteId } }).catch(() => 0),
        Reserva.findAll({
          where: {
            clienteId,
            estado: { [Op.in]: ['pendiente', 'confirmada'] },
            fechaInicio: { [Op.gte]: new Date() }
          },
          include: [{ model: Cabana, as: 'cabana', required: false }],
          limit: 5,
          order: [['fechaInicio', 'ASC']]
        }).catch(() => []),
        PrestamoImplemento.count({
          where: { clienteId, estado: 'activo' }
        }).catch(() => 0),
        Notificacion.findAll({
          where: { userId: req.session.user?.id, leida: false },
          limit: 5,
          order: [['createdAt', 'DESC']]
        }).catch(() => [])
      ]);

      res.render('dashboard/cliente', {
        stats: {
          totalReservas: misReservas.status === 'fulfilled' ? misReservas.value : 0,
          reservasActivas: reservasActivas.status === 'fulfilled' ? reservasActivas.value.length : 0,
          prestamosActivos: prestamosActivos.status === 'fulfilled' ? prestamosActivos.value : 0
        },
        reservasActivas: reservasActivas.status === 'fulfilled' ? reservasActivas.value : [],
        notificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value : []
      });
    } catch (error) {
      console.error('Error al cargar dashboard cliente:', error);
      res.status(500).render('error', {
        message: 'Error al cargar dashboard. Algunos datos pueden no estar disponibles.',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Dashboard encargado
  encargado: async (req, res) => {
    try {
      const { PreparacionCabana } = db;

      const [
        preparacionesPendientes,
        notificaciones
      ] = await Promise.allSettled([
        PreparacionCabana.count({
          where: { estado: { [Op.in]: ['pendiente', 'en_proceso'] } }
        }).catch(() => 0),
        Notificacion.findAll({
          where: { userId: req.session?.user?.id, leida: false },
          limit: 5,
          order: [['createdAt', 'DESC']]
        }).catch(() => [])
      ]);

      res.render('dashboard/encargado', {
        stats: {
          preparacionesPendientes: preparacionesPendientes.status === 'fulfilled' ? preparacionesPendientes.value : 0
        },
        notificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value : []
      });
    } catch (error) {
      console.error('Error al cargar dashboard encargado:', error);
      res.status(500).render('error', {
        message: 'Error al cargar dashboard. Algunos datos pueden no estar disponibles.',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  },

  // Dashboard trabajador
  trabajador: async (req, res) => {
    try {
      const { TareaTrabajador } = db;
      const trabajadorId = req.session?.user?.id;

      if (!trabajadorId) {
        return res.status(403).render('error', { message: 'No tienes permiso para acceder', error: {}, req: req });
      }

      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      const [
        tareasPendientes,
        tareasEnProceso,
        tareasCompletadasHoy,
        notificaciones
      ] = await Promise.allSettled([
        TareaTrabajador.count({
          where: { trabajadorId, estado: 'pendiente' }
        }).catch(() => 0),
        TareaTrabajador.count({
          where: { trabajadorId, estado: 'en_proceso' }
        }).catch(() => 0),
        TareaTrabajador.count({
          where: {
            trabajadorId,
            estado: 'completada',
            fechaCompletada: { [Op.gte]: hoy }
          }
        }).catch(() => 0),
        Notificacion.findAll({
          where: { userId: trabajadorId, leida: false },
          limit: 5,
          order: [['createdAt', 'DESC']]
        }).catch(() => [])
      ]);

      res.render('dashboard/trabajador', {
        stats: {
          tareasPendientes: tareasPendientes.status === 'fulfilled' ? tareasPendientes.value : 0,
          tareasEnProceso: tareasEnProceso.status === 'fulfilled' ? tareasEnProceso.value : 0,
          tareasCompletadasHoy: tareasCompletadasHoy.status === 'fulfilled' ? tareasCompletadasHoy.value : 0
        },
        notificaciones: notificaciones.status === 'fulfilled' ? notificaciones.value : []
      });
    } catch (error) {
      console.error('Error al cargar dashboard trabajador:', error);
      res.status(500).render('error', {
        message: 'Error al cargar dashboard. Algunos datos pueden no estar disponibles.',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  }
};

module.exports = dashboardController;
