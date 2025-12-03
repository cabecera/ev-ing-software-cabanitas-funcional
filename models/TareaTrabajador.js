module.exports = (sequelize, DataTypes) => {
  const TareaTrabajador = sequelize.define('TareaTrabajador', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    trabajadorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    asignadoPor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    cabanaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'cabanas',
        key: 'id'
      }
    },
    preparacionId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'preparacion_cabanas',
        key: 'id'
      }
    },
    tipo: {
      type: DataTypes.ENUM('limpieza', 'mantenimiento', 'inventario', 'otro'),
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    fechaAsignacion: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'fechaAsignacion'
    },
    fechaCompletado: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'fechaCompletado'
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'en_proceso', 'completada', 'cancelada'),
      defaultValue: 'pendiente'
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    reporteDanios: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'reporteDanios'
    }
  }, {
    tableName: 'tarea_trabajadores',
    timestamps: true
  });

  TareaTrabajador.associate = function(models) {
    TareaTrabajador.belongsTo(models.User, { foreignKey: 'trabajadorId', as: 'trabajador' });
    TareaTrabajador.belongsTo(models.User, { foreignKey: 'asignadoPor', as: 'asignador' });
    TareaTrabajador.belongsTo(models.Cabana, { foreignKey: 'cabanaId', as: 'cabana' });
    TareaTrabajador.belongsTo(models.PreparacionCabana, { foreignKey: 'preparacionId', as: 'preparacion' });
  };

  return TareaTrabajador;
};
