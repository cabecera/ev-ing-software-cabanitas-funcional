module.exports = (sequelize, DataTypes) => {
  const Notificacion = sequelize.define('Notificacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mensaje: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('info', 'warning', 'success', 'error'),
      defaultValue: 'info'
    },
    leida: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fechaLeida: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notificaciones',
    timestamps: true
  });

  Notificacion.associate = function(models) {
    Notificacion.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Notificacion;
};




