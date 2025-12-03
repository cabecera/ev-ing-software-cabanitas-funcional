module.exports = (sequelize, DataTypes) => {
  const EncuestaSatisfaccion = sequelize.define('EncuestaSatisfaccion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    reservaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    calificacionGeneral: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 }
    },
    calificacionLimpieza: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    calificacionServicio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    calificacionPrecio: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: { min: 1, max: 5 }
    },
    comentarios: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    recomendaria: {
      type: DataTypes.BOOLEAN,
      allowNull: true
    }
  }, {
    tableName: 'encuesta_satisfaccions',
    timestamps: true
  });

  EncuestaSatisfaccion.associate = function(models) {
    EncuestaSatisfaccion.belongsTo(models.Reserva, { foreignKey: 'reservaId', as: 'reserva' });
    EncuestaSatisfaccion.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  };

  return EncuestaSatisfaccion;
};