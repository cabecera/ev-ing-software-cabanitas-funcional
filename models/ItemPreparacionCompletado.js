module.exports = (sequelize, DataTypes) => {
  const ItemPreparacionCompletado = sequelize.define('ItemPreparacionCompletado', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    preparacionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'preparacion_cabanas',
        key: 'id'
      }
    },
    tareaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tarea_preparaciones',
        key: 'id'
      }
    },
    completado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    fechaCompletado: {
      type: DataTypes.DATE,
      allowNull: true
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'item_preparacion_completados',
    timestamps: true
  });

  ItemPreparacionCompletado.associate = function(models) {
    ItemPreparacionCompletado.belongsTo(models.PreparacionCabana, { foreignKey: 'preparacionId', as: 'preparacion' });
    ItemPreparacionCompletado.belongsTo(models.TareaPreparacion, { foreignKey: 'tareaId', as: 'tarea' });
  };

  return ItemPreparacionCompletado;
};
