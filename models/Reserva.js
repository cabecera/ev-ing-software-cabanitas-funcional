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
      }
    },
    cabanaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'cabanas',
        key: 'id'
      }
    },
    fechaInicio: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fechaFin: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'confirmada', 'cancelada', 'completada'),
      allowNull: false,
      defaultValue: 'pendiente'
    },
    confirmacion_cliente: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    montoCotizado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    }
  }, {
    tableName: 'reservas',
    timestamps: true
  });

  Reserva.associate = function(models) {
    Reserva.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
    Reserva.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    Reserva.hasOne(models.Pago, { foreignKey: 'reservaId', as: 'pago' });
    Reserva.hasOne(models.PreparacionCabana, { foreignKey: 'reservaId', as: 'preparacion' });
    Reserva.hasOne(models.EncuestaSatisfaccion, { foreignKey: 'reservaId', as: 'encuesta' });
    Reserva.hasMany(models.Incidente, { foreignKey: 'reservaId', as: 'incidentes' });
    Reserva.hasOne(models.EntregaCabana, { foreignKey: 'reservaId', as: 'entrega' });
    Reserva.hasMany(models.ObservacionCliente, { foreignKey: 'reservaId', as: 'observaciones' });
  };

  return Reserva;
};
