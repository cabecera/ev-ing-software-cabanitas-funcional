module.exports = (sequelize, DataTypes) => {
  const ChecklistInventario = sequelize.define('ChecklistInventario', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'checklist_inventarios',
    timestamps: true
  });

  ChecklistInventario.associate = function(models) {
    ChecklistInventario.hasMany(models.ItemVerificacion, { foreignKey: 'checklistId', as: 'items' });
    ChecklistInventario.hasMany(models.EntregaCabana, { foreignKey: 'checklistId', as: 'entregas' });
  };

  return ChecklistInventario;
};




