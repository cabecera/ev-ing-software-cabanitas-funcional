/**
 * Servicio de Alertas Automáticas de Reservas
 * RF5: Alertar reserva próxima a validar
 *
 * Este servicio verifica periódicamente las reservas pendientes y genera
 * notificaciones automáticas para los administradores cuando:
 * - Una reserva pendiente inicia en 1 semana (7 días)
 * - Una reserva pendiente inicia en 72 horas (3 días)
 *
 * @module services/alertasReservas
 */

const db = require('../models');
const { Reserva, User, Cabana, Cliente } = db;
const { Op } = require('sequelize');
const { crearNotificacion } = require('../controllers/notificacionController');

/**
 * Verifica reservas próximas y crea notificaciones automáticas
 * @returns {Promise<Object>} Objeto con el conteo de reservas encontradas
 */
async function verificarReservasProximas() {
  try {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Calcular fechas: 1 semana (7 días) y 72 horas (3 días)
    const unaSemana = new Date(hoy);
    unaSemana.setDate(hoy.getDate() + 7);
    unaSemana.setHours(23, 59, 59, 999);

    const setentaDosHoras = new Date(hoy);
    setentaDosHoras.setDate(hoy.getDate() + 3);
    setentaDosHoras.setHours(23, 59, 59, 999);

    // Buscar reservas pendientes que inician en exactamente 7 días (1 semana)
    const reservasUnaSemana = await Reserva.findAll({
      where: {
        estado: 'pendiente',
        fechaInicio: {
          [Op.between]: [
            new Date(unaSemana.getFullYear(), unaSemana.getMonth(), unaSemana.getDate(), 0, 0, 0),
            new Date(unaSemana.getFullYear(), unaSemana.getMonth(), unaSemana.getDate(), 23, 59, 59)
          ]
        }
      },
      include: [
        { model: Cabana, as: 'cabana' },
        { model: Cliente, as: 'cliente' }
      ]
    });

    // Buscar reservas pendientes que inician en exactamente 3 días (72 horas)
    const reservasSetentaDosHoras = await Reserva.findAll({
      where: {
        estado: 'pendiente',
        fechaInicio: {
          [Op.between]: [
            new Date(setentaDosHoras.getFullYear(), setentaDosHoras.getMonth(), setentaDosHoras.getDate(), 0, 0, 0),
            new Date(setentaDosHoras.getFullYear(), setentaDosHoras.getMonth(), setentaDosHoras.getDate(), 23, 59, 59)
          ]
        }
      },
      include: [
        { model: Cabana, as: 'cabana' },
        { model: Cliente, as: 'cliente' }
      ]
    });

    // Obtener todos los administradores activos
    const admins = await User.findAll({
      where: { role: 'admin', activo: true }
    });

    // Crear notificaciones para reservas en 1 semana
    for (const reserva of reservasUnaSemana) {
      const mensaje = `Reserva #${reserva.id} del cliente ${reserva.cliente ? reserva.cliente.nombre + ' ' + reserva.cliente.apellido : 'N/A'} para la cabaña "${reserva.cabana ? reserva.cabana.nombre : 'N/A'}" inicia en 1 semana (${new Date(reserva.fechaInicio).toLocaleDateString()}). Requiere validación.`;

      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          '⚠️ Alerta: Reserva Próxima (1 Semana)',
          mensaje,
          'warning'
        );
      }
    }

    // Crear notificaciones para reservas en 72 horas
    for (const reserva of reservasSetentaDosHoras) {
      const mensaje = `Reserva #${reserva.id} del cliente ${reserva.cliente ? reserva.cliente.nombre + ' ' + reserva.cliente.apellido : 'N/A'} para la cabaña "${reserva.cabana ? reserva.cabana.nombre : 'N/A'}" inicia en 72 horas (${new Date(reserva.fechaInicio).toLocaleDateString()}). Requiere validación URGENTE.`;

      for (const admin of admins) {
        await crearNotificacion(
          admin.id,
          '🚨 Alerta Urgente: Reserva Próxima (72 Horas)',
          mensaje,
          'error'
        );
      }
    }

    console.log(`[Alertas Reservas] Verificadas: ${reservasUnaSemana.length} en 1 semana, ${reservasSetentaDosHoras.length} en 72 horas`);

    return {
      unaSemana: reservasUnaSemana.length,
      setentaDosHoras: reservasSetentaDosHoras.length
    };
  } catch (error) {
    console.error('Error al verificar reservas próximas:', error);
    throw error;
  }
}

/**
 * Ejecutar verificación manualmente (útil para testing)
 * @returns {Promise<Object>} Resultado de la verificación
 */
async function ejecutarVerificacion() {
  try {
    await db.sequelize.authenticate();
    const resultado = await verificarReservasProximas();
    console.log('Verificación completada:', resultado);
    await db.sequelize.close();
    return resultado;
  } catch (error) {
    console.error('Error en ejecución manual:', error);
    throw error;
  }
}

module.exports = {
  verificarReservasProximas,
  ejecutarVerificacion
};

