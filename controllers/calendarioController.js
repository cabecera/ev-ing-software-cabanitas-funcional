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
      res.status(500).render('error', {
        message: 'Error al cargar calendario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
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
      let reservas = [];
      try {
        reservas = await Reserva.findAll({
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
            { model: Cabana, as: 'cabana', required: false },
            { model: Cliente, as: 'cliente', required: false, include: [{ model: User, as: 'user', required: false }] }
          ]
        });
      } catch (reservaError) {
        console.error('Error al cargar reservas en calendario:', reservaError);
        reservas = [];
      }

      // Obtener mantenimientos (solo programados y en proceso, NO completados)
      // Solo mantenimientos de cabañas para el calendario
      let mantenimientos = [];
      try {
        mantenimientos = await Mantenimiento.findAll({
          where: {
            estado: {
              [Op.in]: ['programado', 'en_proceso']
            },
            cabanaId: {
              [Op.ne]: null  // Solo mantenimientos de cabañas
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
          include: [{ model: Cabana, as: 'cabana', required: false }]
        });
      } catch (mantError) {
        console.error('Error al cargar mantenimientos en calendario:', mantError);
        mantenimientos = [];
      }

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
          try {
            if (!reserva || !reserva.cabana) return;
            const inicio = new Date(reserva.fechaInicio);
            const fin = new Date(reserva.fechaFin);
            if (fecha >= inicio && fecha <= fin) {
              eventosDia.push({
                tipo: 'reserva',
                cabanaId: reserva.cabanaId,
                cabanaNombre: reserva.cabana ? reserva.cabana.nombre : 'Cabaña no encontrada',
                cliente: reserva.cliente ? `${reserva.cliente.nombre || ''} ${reserva.cliente.apellido || ''}`.trim() || 'N/A' : 'N/A',
                estado: reserva.estado,
                id: reserva.id
              });
            }
          } catch (reservaError) {
            console.error('Error al procesar reserva en calendario:', reservaError);
            // Continuar con la siguiente reserva
          }
        });

        // Agregar mantenimientos del día
        mantenimientos.forEach(mant => {
          try {
            if (!mant) return;
            // Solo incluir mantenimientos de cabañas (no de implementos)
            if (!mant.cabanaId) return;

            const inicio = new Date(mant.fechaInicio);
            const fin = new Date(mant.fechaFin);
            if (fecha >= inicio && fecha <= fin) {
              eventosDia.push({
                tipo: 'mantenimiento',
                cabanaId: mant.cabanaId,
                cabanaNombre: mant.cabana ? mant.cabana.nombre : 'Cabaña no encontrada',
                tipoMant: mant.tipo || 'Mantenimiento',
                estado: mant.estado,
                id: mant.id
              });
            }
          } catch (mantError) {
            console.error('Error al procesar mantenimiento en calendario:', mantError);
            // Continuar con el siguiente mantenimiento
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
        anioActual,
        req: req
      });
    } catch (error) {
      console.error('Error al cargar calendario admin:', error);
      res.status(500).render('error', {
        message: 'Error al cargar calendario',
        error: process.env.NODE_ENV === 'development' ? error : {},
        req: req
      });
    }
  }
};

module.exports = calendarioController;
