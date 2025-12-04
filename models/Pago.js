module.exports = (sequelize, DataTypes) => {
  const Pago = sequelize.define('Pago', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
      references: {
        model: 'reservas',
        key: 'id'
      }
    },
    prestamoImplementoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'prestamo_implementos',
        key: 'id'
      }
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    metodoPago: {
      type: DataTypes.ENUM('efectivo', 'transferencia', 'tarjeta'),
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completado', 'rechazado'),
      defaultValue: 'pendiente'
    },
    fechaPago: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'pagos',
    timestamps: true
  });

  Pago.associate = function(models) {
    Pago.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    Pago.belongsTo(models.PrestamoImplemento, { foreignKey: 'prestamoImplementoId', as: 'prestamoImplemento' });
  };

  return Pago;
};
