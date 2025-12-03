const db = require('../models');
const { Cabana, Reserva, Mantenimiento, Cliente, User } = db;
const { Op } = require('sequelize');

const calendarioController = {
  // Calendario de disponibilidad para clientes (público y registrados)
  disponibilidad: async (req, res) => {
    try {
      const { mes, anio } = req.query;
      const fechaActual = new Date();
      const mesActual = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
      const anioActual = anio ? parseInt(anio) : fechaActual.getFullYear();

      // Obtener todas las reservas del mes
      const fechaInicio = new Date(anioActual, mesActual - 1, 1);
      const fechaFin = new Date(anioActual, mesActual, 0);

      const reservas = await Reserva.findAll({
        where: {
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
        },
        include: [{ model: Cabana, as: 'cabana' }]
      });

      // Obtener mantenimientos del mes
      const mantenimientos = await Mantenimiento.findAll({
        where: {
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

      // Obtener todas las cabañas
      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });

      // Construir matriz de disponibilidad
      const diasEnMes = new Date(anioActual, mesActual, 0).getDate();
      const disponibilidad = [];

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(anioActual, mesActual - 1, dia);
        const estadoPorCabana = {};

        cabanas.forEach(cabana => {
          let disponible = true;
          let motivo = null;

          // Verificar reservas
          const reservaOcupada = reservas.find(r =>
            r.cabanaId === cabana.id &&
            new Date(r.fechaInicio) <= fecha &&
            new Date(r.fechaFin) >= fecha
          );

          if (reservaOcupada) {
            disponible = false;
            motivo = 'Reservada';
          }

          // Verificar mantenimientos
          const mantenimiento = mantenimientos.find(m =>
            m.cabanaId === cabana.id &&
            new Date(m.fechaInicio) <= fecha &&
            new Date(m.fechaFin) >= fecha
          );

          if (mantenimiento) {
            disponible = false;
            motivo = 'Mantenimiento';
          }

          estadoPorCabana[cabana.id] = {
            disponible,
            motivo,
            nombre: cabana.nombre
          };
        });

        disponibilidad.push({
          dia,
          fecha: fecha.toISOString().split('T')[0],
          cabanas: estadoPorCabana
        });
      }

      res.render('calendario/disponibilidad', {
        cabanas,
        disponibilidad,
        mesActual,
        anioActual,
        user: req.session.user
      });
    } catch (error) {
      console.error('Error al cargar calendario:', error);
      res.status(500).render('error', { message: 'Error al cargar calendario', error });
    }
  },

  // Calendario maestro para admin
  adminCalendario: async (req, res) => {
    try {
      const { mes, anio } = req.query;
      const fechaActual = new Date();
      const mesActual = mes ? parseInt(mes) : fechaActual.getMonth() + 1;
      const anioActual = anio ? parseInt(anio) : fechaActual.getFullYear();

      const fechaInicio = new Date(anioActual, mesActual - 1, 1);
      const fechaFin = new Date(anioActual, mesActual, 0);

      // Obtener todas las reservas
      const reservas = await Reserva.findAll({
        where: {
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
        },
        include: [
          { model: Cabana, as: 'cabana' },
          { model: Cliente, as: 'cliente', include: [{ model: User, as: 'user' }] }
        ]
      });

      // Obtener mantenimientos (solo programados y en proceso, NO completados)
      const mantenimientos = await Mantenimiento.findAll({
        where: {
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
        },
        include: [{ model: Cabana, as: 'cabana' }]
      });

      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });

      const diasEnMes = new Date(anioActual, mesActual, 0).getDate();
      const eventos = [];

      for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(anioActual, mesActual - 1, dia);
        const eventosDia = [];

        // Agregar reservas del día
        reservas.forEach(reserva => {
          const inicio = new Date(reserva.fechaInicio);
          const fin = new Date(reserva.fechaFin);
          if (fecha >= inicio && fecha <= fin) {
            eventosDia.push({
              tipo: 'reserva',
              cabanaId: reserva.cabanaId,
              cabanaNombre: reserva.cabana.nombre,
              cliente: reserva.cliente ? `${reserva.cliente.nombre} ${reserva.cliente.apellido}` : 'N/A',
              estado: reserva.estado,
              id: reserva.id
            });
          }
        });

        // Agregar mantenimientos del día
        mantenimientos.forEach(mant => {
          const inicio = new Date(mant.fechaInicio);
          const fin = new Date(mant.fechaFin);
          if (fecha >= inicio && fecha <= fin) {
            eventosDia.push({
              tipo: 'mantenimiento',
              cabanaId: mant.cabanaId,
              cabanaNombre: mant.cabana.nombre,
              tipoMant: mant.tipo,
              estado: mant.estado,
              id: mant.id
            });
          }
        });

        eventos.push({
          dia,
          fecha: fecha.toISOString().split('T')[0],
          eventos: eventosDia
        });
      }

      res.render('calendario/admin', {
        cabanas,
        eventos,
        mesActual,
        anioActual
      });
    } catch (error) {
      console.error('Error al cargar calendario admin:', error);
      res.status(500).render('error', { message: 'Error al cargar calendario', error });
    }
  }
};

module.exports = calendarioController;
