module.exports = (sequelize, DataTypes) => {
  const ObservacionCliente = sequelize.define('ObservacionCliente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'reservas',
        key: 'id'
      }
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    registradoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Usuario que registra la observación (admin o encargado)'
    },
    tipo: {
      type: DataTypes.ENUM('comportamiento', 'incidencia', 'observacion_general', 'recomendacion'),
      allowNull: false,
      defaultValue: 'observacion_general'
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fechaObservacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    severidad: {
      type: DataTypes.ENUM('baja', 'media', 'alta'),
      allowNull: true,
      defaultValue: 'media'
    }
  }, {
    tableName: 'observaciones_clientes',
    timestamps: true
  });

  ObservacionCliente.associate = function(models) {
    ObservacionCliente.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    ObservacionCliente.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
    ObservacionCliente.belongsTo(models.User, { foreignKey: 'registradoPor', as: 'registrador' });
  };

  return ObservacionCliente;
};

