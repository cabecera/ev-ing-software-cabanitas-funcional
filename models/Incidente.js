module.exports = (sequelize, DataTypes) => {
  const Incidente = sequelize.define('Incidente', {
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
      allowNull: true,
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
    tipo: {
      type: DataTypes.ENUM('no_disponible', 'daño', 'servicio', 'otro'),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_revision', 'resuelto', 'cancelado'),
      defaultValue: 'pendiente'
    },
    solucionPropuesta: {
      type: DataTypes.ENUM('reprogramar', 'reembolso', 'cambio_cabana', 'descuento', 'otro'),
      allowNull: true
    },
    solucionAceptada: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    },
    fechaResolucion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resueltoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    tableName: 'incidentes',
    timestamps: true
  });

  Incidente.associate = function(models) {
    Incidente.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    Incidente.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
    Incidente.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    Incidente.belongsTo(models.User, { foreignKey: 'resueltoPor', as: 'resolutor' });
  };

  return Incidente;
};