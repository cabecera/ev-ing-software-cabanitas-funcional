module.exports = (sequelize, DataTypes) => {
  const Implemento = sequelize.define('Implemento', {
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
    stockTotal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    stockDisponible: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0
      }
    },
    precioPrestamo: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0
    }
  }, {
    tableName: 'implementos',
    timestamps: true
  });

  Implemento.associate = function(models) {
    Implemento.hasMany(models.PrestamoImplemento, { foreignKey: 'implementoId', as: 'prestamos' });
  };

  return Implemento;
};

