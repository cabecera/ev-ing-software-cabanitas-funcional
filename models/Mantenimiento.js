module.exports = (sequelize, DataTypes) => {
  const Mantenimiento = sequelize.define('Mantenimiento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
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
    tipo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('programado', 'en_proceso', 'completado', 'cancelado'),
      defaultValue: 'programado'
    }
  }, {
    tableName: 'mantenimientos',
    timestamps: true
  });

  Mantenimiento.associate = function(models) {
    Mantenimiento.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
  };

  return Mantenimiento;
};
