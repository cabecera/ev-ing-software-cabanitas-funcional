const db = require('../models');
const { Reserva, Cabana, Cliente, Pago, EncuestaSatisfaccion } = db;
const { Op } = require('sequelize');

const reportesController = {
  // Dashboard de reportes
  dashboard: async (req, res) => {
    try {
      // Manejar fechas correctamente
      let fechaInicio, fechaFin;

      if (req.query.fechaInicio) {
        fechaInicio = new Date(req.query.fechaInicio);
        fechaInicio.setHours(0, 0, 0, 0);
      } else {
        fechaInicio = new Date(new Date().getFullYear(), 0, 1);
        fechaInicio.setHours(0, 0, 0, 0);
      }

      if (req.query.fechaFin) {
        fechaFin = new Date(req.query.fechaFin);
        fechaFin.setHours(23, 59, 59, 999);
      } else {
        fechaFin = new Date();
        fechaFin.setHours(23, 59, 59, 999);
      }

      // Convertir fechas a formato DATEONLY (YYYY-MM-DD) para comparar con el campo DATEONLY de Reserva
      const fechaInicioStr = fechaInicio.toISOString().split('T')[0];
      const fechaFinStr = fechaFin.toISOString().split('T')[0];

      // Ocupación
      const totalReservas = await Reserva.count({
        where: {
          fechaInicio: { [Op.between]: [fechaInicioStr, fechaFinStr] }
        }
      }).catch(() => 0);

      const reservasConfirmadas = await Reserva.count({
        where: {
          estado: 'confirmada',
          fechaInicio: { [Op.between]: [fechaInicioStr, fechaFinStr] }
        }
      }).catch(() => 0);

      // Ingresos - calcular basándose en todos los pagos completados del período
      // Pagos de reservas (pagos completados en el período, filtrar por reservas del período)
      const pagosReservas = await Pago.findAll({
        where: {
          estado: 'completado',
          reservaId: { [Op.ne]: null }
        },
        include: [{
          model: Reserva,
          as: 'reserva',
          required: true,
          where: {
            fechaInicio: { [Op.between]: [fechaInicioStr, fechaFinStr] }
          }
        }]
      }).catch(() => []);

      // Sumar montos de pagos de reservas
      const ingresosReservas = pagosReservas
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

      // Ingresos de préstamos (pagos de préstamos en el período)
      const pagosPrestamos = await Pago.findAll({
        where: {
          estado: 'completado',
          fechaPago: { [Op.between]: [fechaInicio, fechaFin] },
          prestamoImplementoId: { [Op.ne]: null }
        }
      }).catch(() => []);

      const ingresosPrestamos = pagosPrestamos
        .reduce((sum, p) => sum + parseFloat(p.monto || 0), 0);

      const ingresosTotales = ingresosReservas + ingresosPrestamos;

      // Ocupación por cabaña
      const reservasPorCabana = await Reserva.findAll({
        where: {
          estado: 'confirmada',
          fechaInicio: { [Op.between]: [fechaInicioStr, fechaFinStr] }
        },
        include: [{ model: Cabana, as: 'cabana', required: false }]
      }).catch(() => []);

      const ocupacionPorCabana = {};
      reservasPorCabana.forEach(r => {
        if (r.cabana && r.cabana.nombre) {
          if (!ocupacionPorCabana[r.cabana.nombre]) {
            ocupacionPorCabana[r.cabana.nombre] = { reservas: 0, ingresos: 0 };
          }
          ocupacionPorCabana[r.cabana.nombre].reservas++;
          ocupacionPorCabana[r.cabana.nombre].ingresos += parseFloat(r.montoCotizado || 0);
        }
      });

      // Clientes más frecuentes
      const reservasPorCliente = await Reserva.findAll({
        where: {
          fechaInicio: { [Op.between]: [fechaInicioStr, fechaFinStr] }
        },
        include: [{ model: Cliente, as: 'cliente', required: false }]
      }).catch(() => []);

      const clientesMap = {};
      reservasPorCliente.forEach(r => {
        if (r.cliente && r.cliente.nombre && r.cliente.apellido) {
          const key = `${r.cliente.nombre} ${r.cliente.apellido}`;
          if (!clientesMap[key]) {
            clientesMap[key] = { nombre: key, reservas: 0 };
          }
          clientesMap[key].reservas++;
        }
      });

      const clientesFrecuentes = Object.values(clientesMap)
        .sort((a, b) => b.reservas - a.reservas)
        .slice(0, 10);

      // Satisfacción
      const encuestas = await EncuestaSatisfaccion.findAll({
        where: {
          createdAt: { [Op.between]: [fechaInicio, fechaFin] }
        }
      }).catch(() => []);

      const promedioSatisfaccion = encuestas.length > 0
        ? encuestas.reduce((sum, e) => sum + (parseFloat(e.calificacionGeneral) || 0), 0) / encuestas.length
        : 0;

      res.render('reportes/dashboard', {
        totalReservas: totalReservas || 0,
        reservasConfirmadas: reservasConfirmadas || 0,
        ingresosTotales: ingresosTotales || 0,
        ocupacionPorCabana: ocupacionPorCabana || {},
        clientesFrecuentes: clientesFrecuentes || [],
        promedioSatisfaccion: promedioSatisfaccion || 0,
        fechaInicio: fechaInicio.toISOString().split('T')[0],
        fechaFin: req.query.fechaFin ? new Date(req.query.fechaFin).toISOString().split('T')[0] : fechaFin.toISOString().split('T')[0],
        req: req
      });
    } catch (error) {
      console.error('Error al generar reportes:', error);
      res.status(500).render('error', {
        message: 'Error al generar reportes',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  }
};

module.exports = reportesController;
