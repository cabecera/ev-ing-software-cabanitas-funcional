module.exports = (sequelize, DataTypes) => {
  const PrestamoImplemento = sequelize.define('PrestamoImplemento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'clientes',
        key: 'id'
      }
    },
    implementoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'implementos',
        key: 'id'
      }
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1
      }
    },
    fechaPrestamo: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fechaDevolucion: {
      type: DataTypes.DATE,
      allowNull: true
    },
    estado: {
      type: DataTypes.ENUM('activo', 'devuelto', 'perdido'),
      defaultValue: 'activo'
    }
  }, {
    tableName: 'prestamo_implementos',
    timestamps: true
  });

  PrestamoImplemento.associate = function(models) {
    PrestamoImplemento.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
    PrestamoImplemento.belongsTo(models.Implemento, { foreignKey: 'implementoId', as: 'implemento' });
    PrestamoImplemento.hasOne(models.Pago, { foreignKey: 'prestamoImplementoId', as: 'pago' });
  };

  return PrestamoImplemento;
};
