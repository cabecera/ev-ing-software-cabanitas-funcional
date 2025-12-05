module.exports = (sequelize, DataTypes) => {
  const TareaPreparacion = sequelize.define('TareaPreparacion', {
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
    tableName: 'tarea_preparaciones',
    timestamps: true
  });

  TareaPreparacion.associate = function(models) {
    TareaPreparacion.hasMany(models.ItemPreparacionCompletado, { foreignKey: 'tareaId', as: 'completados' });
  };

  return TareaPreparacion;
};




