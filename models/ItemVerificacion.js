module.exports = (sequelize, DataTypes) => {
  const ItemVerificacion = sequelize.define('ItemVerificacion', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    checklistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'checklist_inventarios',
        key: 'id'
      }
    },
    entregaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'entrega_cabanas',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    verificado: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'item_verificaciones',
    timestamps: true
  });

  ItemVerificacion.associate = function(models) {
    ItemVerificacion.belongsTo(models.ChecklistInventario, { foreignKey: 'checklistId', as: 'checklist' });
    ItemVerificacion.belongsTo(models.EntregaCabana, { foreignKey: 'entregaId', as: 'entrega' });
  };

  return ItemVerificacion;
};

