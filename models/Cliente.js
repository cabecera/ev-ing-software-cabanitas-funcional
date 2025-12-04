module.exports = (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true
    },
    direccion: {
      type: DataTypes.STRING,
      allowNull: true
    },
    dni: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true
    }
  }, {
    tableName: 'clientes',
    timestamps: true
  });

  Cliente.associate = function(models) {
    Cliente.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Cliente.hasMany(models.Reserva, { foreignKey: 'clienteId', as: 'reservas' });
    Cliente.hasMany(models.PrestamoImplemento, { foreignKey: 'clienteId', as: 'prestamos' });
  };

  return Cliente;
};

