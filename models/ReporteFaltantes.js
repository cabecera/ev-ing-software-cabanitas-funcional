module.exports = (sequelize, DataTypes) => {
  const ReporteFaltantes = sequelize.define('ReporteFaltantes', {
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
    fecha: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    itemsFaltantes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array de items faltantes'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'resuelto', 'cancelado'),
      defaultValue: 'pendiente'
    },
    resueltoPor: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fechaResolucion: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'reporte_faltantes',
    timestamps: true
  });

  ReporteFaltantes.associate = function(models) {
    ReporteFaltantes.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    ReporteFaltantes.belongsTo(models.User, { foreignKey: 'resueltoPor', as: 'resolutor' });
  };

  return ReporteFaltantes;
};
