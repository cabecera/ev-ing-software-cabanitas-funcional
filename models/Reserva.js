/**
 * Modelo de Reserva
 *
 * Representa una reserva de cabaña realizada por un cliente.
 * Una reserva puede estar en diferentes estados: pendiente, confirmada, cancelada, completada.
 *
 * @module models/Reserva
 */

module.exports = (sequelize, DataTypes) => {
  const Reserva = sequelize.define('Reserva', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      },
      comment: 'ID del cliente que realiza la reserva'
    },
    cabanaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cabanas',
        key: 'id'
      },
      comment: 'ID de la cabaña reservada'
    },
    fechaInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de inicio de la reserva'
    },
    fechaFin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Fecha de fin de la reserva'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
      allowNull: false,
      defaultValue: 'pendiente',
      comment: 'Estado de la reserva: pendiente (esperando confirmación), confirmada (aceptada), cancelada, completada'
    },
    confirmacion_cliente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      comment: 'Indica si el cliente ha confirmado la reserva'
    },
    montoCotizado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Monto total de la reserva calculado según precio por noche y días'
    }
  }, {
    tableName: 'reservas',
    timestamps: true // Agrega createdAt y updatedAt automáticamente
  });

  /**
   * Define las relaciones del modelo Reserva con otros modelos
   * @param {Object} models - Objeto con todos los modelos cargados
   */
  Reserva.associate = function(models) {
    // Una reserva pertenece a un cliente
    Reserva.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });

    // Una reserva pertenece a una cabaña
    Reserva.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });

    // Una reserva tiene un pago (relación 1:1)
    Reserva.hasOne(models.Pago, { foreignKey: 'reservaId', as: 'pago' });

    // Una reserva tiene una preparación (relación 1:1)
    Reserva.hasOne(models.PreparacionCabana, { foreignKey: 'reservaId', as: 'preparacion' });

    // Una reserva tiene una encuesta de satisfacción (relación 1:1)
    Reserva.hasOne(models.EncuestaSatisfaccion, { foreignKey: 'reservaId', as: 'encuesta' });

    // Una reserva puede tener múltiples incidentes
    Reserva.hasMany(models.Incidente, { foreignKey: 'reservaId', as: 'incidentes' });

    // Una reserva tiene una entrega de cabaña (relación 1:1)
    Reserva.hasOne(models.EntregaCabana, { foreignKey: 'reservaId', as: 'entrega' });

    // Una reserva puede tener múltiples observaciones del cliente
    Reserva.hasMany(models.ObservacionCliente, { foreignKey: 'reservaId', as: 'observaciones' });
  };

  return Reserva;
};
